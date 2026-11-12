"""Attach the local archive to existing school records without publishing content.

Originals are hard-linked on the same volume; small derived pack assets are copied.
Only registered archive sources and reconciled unpacked members are connected.
"""
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import shutil
import sqlite3
import time
import zlib


SOURCES = ("spanish-original", "derived-packs")


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def safe_file(root, relative_path):
    rel = relative_path.replace("\\", "/")
    if not rel or rel.startswith("/") or ":" in rel or any(p in ("", ".", "..") for p in rel.split("/")):
        raise ValueError(f"Unsafe archive path: {relative_path}")
    path = (root / rel).resolve(strict=True)
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError(f"Archive path escapes source: {relative_path}")
    return path


def fingerprint(path):
    before = path.stat()
    h = hashlib.sha256()
    crc = 0
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(2 * 1024 * 1024), b""):
            h.update(block)
            crc = zlib.crc32(block, crc)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise ValueError(f"File changed while hashing: {path}")
    return {"sha256": h.hexdigest(), "crc32": crc & 0xffffffff, "bytes": after.st_size,
            "mtime_ns": after.st_mtime_ns}


def connect_local(root, data_dir, reconciliation, *, apply=False, progress=True):
    root, data_dir = root.resolve(), data_dir.resolve()
    db_path = data_dir / "school.sqlite"
    if not db_path.is_file():
        raise ValueError("Existing school.sqlite is required; initialize/import the catalogue first.")
    db = sqlite3.connect(db_path.as_uri() + "?mode=rw" if apply else db_path.as_uri() + "?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA busy_timeout=5000")
    try:
        rows = [dict(r) for r in db.execute("SELECT * FROM materials WHERE source_id IN (?,?) ORDER BY id", SOURCES)]
        if not rows:
            raise ValueError("No registered archive materials found.")
        mapped = {r["source_id"]: r for r in reconciliation["records"]}
        packs = root / "scripts/myspanish-knowledge/teaching-packs"
        candidates, unavailable = [], []
        for row in rows:
            if row["id"].startswith("local-unpacked:"):
                continue
            rel = row["relative_path"]
            if row["source_id"] == "spanish-original":
                mapping = mapped.get(row["id"])
                if mapping:
                    # Reconciliation refers to immutable legacy IDs, not generated path hashes.
                    if mapping["status"] == "relocated_or_deduplicated":
                        rel = mapping["current_paths"][0]
                    elif mapping["status"] in ("archive_fully_represented_by_extracted_files", "user_confirmed_deleted"):
                        unavailable.append((row, mapping))
                        continue
                    elif mapping["status"] not in ("unchanged",):
                        raise ValueError(f"Unresolved reconciliation: {row['id']}")
                base = root
                if rel.replace("\\", "/").startswith(("13 ", "scripts/")):
                    raise ValueError(f"Unexpected registered original: {rel}")
            else:
                base = packs
            path = safe_file(base, rel)
            candidates.append({"row": row, "physical": path, "relative_path": rel, "new": False})
        # A physical unpacked member is one material, even when several duplicate ZIPs contained it.
        for added in reconciliation["new_files"]:
            matches = [m for m in added["historical_matches"] if "member_id" in m]
            if not matches:
                continue
            rel = added["path"]
            ident = "local-unpacked:" + hashlib.sha256(rel.encode("utf-8")).hexdigest()[:24]
            previous = db.execute("SELECT * FROM materials WHERE id=?", (ident,)).fetchone()
            row = dict(previous) if previous else {"id": ident, "source_id": "spanish-original",
                    "relative_path": rel, "format": Path(rel).suffix.lstrip(".").lower()}
            candidates.append({"row": row, "physical": safe_file(root, rel), "relative_path": rel,
                               "new": previous is None, "unpacked_from": matches, "expected": added})
        report = {"generated_at": datetime.now(timezone.utc).isoformat(), "root": str(root),
                  "data_dir": str(data_dir), "mode": "apply" if apply else "preview",
                  "connected": 0, "new_members": sum(c["new"] for c in candidates),
                  "unpacked_members": sum("unpacked_from" in c for c in candidates),
                  "unavailable": [{"id": r["id"], "path": r["relative_path"], "status": m["status"]}
                                  for r, m in unavailable], "storage": {}, "files": []}
        if not apply:
            report["connectable"] = len(candidates)
            report["bytes_before_deduplication"] = sum(c["physical"].stat().st_size for c in candidates)
            return report
        backup_dir = data_dir / "local-archive-backups" / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        backup_dir.mkdir(parents=True, exist_ok=False)
        backup = sqlite3.connect(backup_dir / "school.sqlite")
        try:
            db.backup(backup)
        finally:
            backup.close()
        report["database_backup"] = str(backup_dir / "school.sqlite")
        store = data_dir / "files"
        store.mkdir(exist_ok=True)
        storage_counts = Counter()
        # A resumable fingerprint cache avoids re-reading 50 GB after interruptions.
        cache_path = data_dir / "local-archive-fingerprints.json"
        cache = load(cache_path) if cache_path.is_file() else {}
        completed = {}
        verified_storage = set()
        started = time.monotonic()
        for index, item in enumerate(candidates, 1):
            path = item["physical"]
            st = path.stat()
            cached = cache.get(str(path))
            fp = cached if cached and (cached["bytes"], cached["mtime_ns"]) == (st.st_size, st.st_mtime_ns) else fingerprint(path)
            completed[str(path)] = fp
            expected = item.get("expected")
            if expected and any(fp[k] != expected[k] for k in ("sha256", "bytes", "crc32")):
                raise ValueError(f"Reconciled file changed since review: {path}")
            target = store / fp["sha256"]
            if target.exists():
                if target.stat().st_size != fp["bytes"]:
                    raise ValueError(f"Invalid existing storage object: {target}")
                # Existing content must match; same inode is the already-hashed source.
                if fp["sha256"] not in verified_storage and not os.path.samefile(path, target) and fingerprint(target)["sha256"] != fp["sha256"]:
                    raise ValueError(f"Existing storage checksum mismatch: {target}")
                method = "existing"
            elif item["row"]["source_id"] == "derived-packs":
                shutil.copyfile(path, target)
                if fingerprint(target)["sha256"] != fp["sha256"]:
                    raise ValueError(f"Copy checksum mismatch: {target}")
                method = "copied_derived"
            else:
                if path.stat().st_dev != store.stat().st_dev:
                    raise ValueError("Originals and storage must be on the same volume for hard links.")
                os.link(path, target)
                method = "hardlinked_original"
            verified_storage.add(fp["sha256"])
            storage_counts[method] += 1
            item["fingerprint"] = fp
            report["files"].append({"id": item["row"]["id"], "path": item["relative_path"], **fp,
                                    "storage_key": fp["sha256"], "method": method})
            if index % 100 == 0 or index == len(candidates):
                tmp = cache_path.with_suffix(".pending")
                tmp.write_text(json.dumps({**cache, **completed}, ensure_ascii=False), encoding="utf-8")
                tmp.replace(cache_path)
                if progress:
                    print(f"Connected files: {index}/{len(candidates)}; elapsed {time.monotonic()-started:.0f}s", flush=True)
        for item in candidates:
            info = item["physical"].stat()
            fp = item["fingerprint"]
            if (info.st_size, info.st_mtime_ns) != (fp["bytes"], fp["mtime_ns"]):
                raise ValueError(f"Source changed before catalogue commit: {item['physical']}")
        with db:
            def folder_for(relative_path):
                folder_path = Path(relative_path).parent.as_posix()
                prior = db.execute("SELECT id FROM archive_folders WHERE source_id=? AND relative_path=?", ("spanish-original", folder_path)).fetchone()
                if prior:
                    return prior["id"]
                if folder_path == ".":
                    raise ValueError("Unexpected archive root file")
                # Recurse by the parent's path, using a dummy filename only to reuse this helper.
                parent_path = Path(folder_path).parent.as_posix()
                parent_row = db.execute("SELECT id FROM archive_folders WHERE source_id=? AND relative_path=?", ("spanish-original", "" if parent_path == "." else parent_path)).fetchone()
                parent = parent_row["id"] if parent_row else folder_for(parent_path + "/placeholder")
                ident = "local-folder:" + hashlib.sha256(folder_path.encode("utf-8")).hexdigest()[:24]
                db.execute("INSERT INTO archive_folders VALUES(?,?,?,?,?,?,?)", (ident, parent, Path(folder_path).name, folder_path,
                           len(Path(folder_path).parts), "quarantine", "spanish-original"))
                return ident
            for item in candidates:
                row, fp = item["row"], item["fingerprint"]
                sha = fp["sha256"]
                db.execute("INSERT OR IGNORE INTO files VALUES(?,?,?,?,?)", (sha, sha, fp["bytes"], sha, row["format"]))
                if item["new"]:
                    db.execute("INSERT INTO materials(id,source_id,relative_path,original_path,title,description_source,format,privacy) VALUES(?,?,?,?,?,?,?,?)",
                               (row["id"], row["source_id"], item["relative_path"], item["relative_path"],
                                Path(item["relative_path"]).name, "Распакованное вложение; E-ID архивов и Z-ID сохранены в происхождении", row["format"], "restricted"))
                    db.execute("INSERT INTO archive_materials VALUES(?,?,?,?,?)", (row["id"], folder_for(item["relative_path"]), sha, "none",
                               json.dumps({"disposition": "quarantine", "local_unpacked_from": item["unpacked_from"]}, ensure_ascii=False)))
                db.execute("UPDATE materials SET bytes=?,checksum=?,file_id=?,storage_key=?,missing=0 WHERE id=?", (fp["bytes"], sha, sha, sha, row["id"]))
                # Preserve the legacy address/ID of duplicate aliases to satisfy the existing unique key.
                if item["relative_path"] != row["relative_path"]:
                    collision = db.execute("SELECT id FROM materials WHERE source_id=? AND relative_path=? AND id!=?", (row["source_id"], item["relative_path"], row["id"])).fetchone()
                    if not collision:
                        db.execute("UPDATE materials SET relative_path=? WHERE id=?", (item["relative_path"], row["id"]))
                    db.execute("UPDATE archive_materials SET folder_id=? WHERE material_id=?", (folder_for(item["relative_path"]), row["id"]))
                prior = db.execute("SELECT metadata FROM archive_materials WHERE material_id=?", (row["id"],)).fetchone()
                if prior:
                    meta = json.loads(prior["metadata"])
                    meta.update(storage="local_connected", local_attachment={"path": item["relative_path"], "sha256": sha})
                    db.execute("UPDATE archive_materials SET metadata=? WHERE material_id=?", (json.dumps(meta, ensure_ascii=False), row["id"]))
            for row, mapping in unavailable:
                prior = db.execute("SELECT metadata FROM archive_materials WHERE material_id=?", (row["id"],)).fetchone()
                meta = json.loads(prior["metadata"]) if prior else {}
                meta.update(storage=mapping["status"], local_reconciliation=mapping)
                db.execute("UPDATE archive_materials SET metadata=? WHERE material_id=?", (json.dumps(meta, ensure_ascii=False), row["id"]))
                note = ("Удалён владельцем 6 ноября 2026 года." if mapping["status"] == "user_confirmed_deleted" else
                        "ZIP распакован; содержимое подключено отдельными материалами: " + "; ".join(mapping["current_paths"]))
                original = row["instructions"].split("\n[Локальный архив]", 1)[0]
                db.execute("UPDATE materials SET missing=1,storage_key=NULL,instructions=? WHERE id=?", (original + "\n[Локальный архив] " + note, row["id"]))
        report["connected"] = len(candidates)
        report["storage"] = dict(storage_counts)
        report["unique_blobs"] = len({i["fingerprint"]["sha256"] for i in candidates})
        report["bytes_before_deduplication"] = sum(i["fingerprint"]["bytes"] for i in candidates)
        report["integrity_check"] = db.execute("PRAGMA integrity_check").fetchone()[0]
        if report["integrity_check"] != "ok":
            raise ValueError("SQLite integrity check failed")
        report_path = data_dir / "local-archive-connection.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return {k: v for k, v in report.items() if k != "files"}
    finally:
        db.close()


def main():
    app = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=app.parent / ".docs")
    parser.add_argument("--data-dir", type=Path, default=app / ".school-data")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    rec = load(args.root / "scripts/myspanish-knowledge/reviews/archive-reconciliation/reconciliation.json")
    print(json.dumps(connect_local(args.root, args.data_dir, rec, apply=args.apply), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
