"""End-to-end local attachment checks on an isolated SQLite catalogue."""
from pathlib import Path
import hashlib, importlib.util, json, os, sqlite3, tempfile, unittest, zlib

APP = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("connector", APP / "scripts/school/connect-local-archive.py")
connector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(connector)


class LocalArchiveTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "docs"
        self.data = Path(self.temp.name) / "data"
        self.root.mkdir(); self.data.mkdir()
        self.db = sqlite3.connect(self.data / "school.sqlite")
        self.addCleanup(self.db.close)
        self.db.executescript("""
CREATE TABLE materials(id TEXT PRIMARY KEY,source_id TEXT,relative_path TEXT,original_path TEXT,title TEXT,description TEXT DEFAULT 'editorial text',description_source TEXT,format TEXT,privacy TEXT DEFAULT 'internal',publication TEXT DEFAULT 'draft',rights TEXT DEFAULT 'unknown',instructions TEXT DEFAULT 'editorial instructions',bytes INTEGER,checksum TEXT,file_id TEXT,storage_key TEXT,missing INTEGER DEFAULT 1,UNIQUE(source_id,relative_path));
CREATE TABLE files(id TEXT PRIMARY KEY,checksum TEXT UNIQUE,bytes INTEGER,storage_key TEXT,format TEXT);
CREATE TABLE archive_materials(material_id TEXT PRIMARY KEY,folder_id TEXT,file_id TEXT,processing TEXT,metadata TEXT);
CREATE TABLE archive_folders(id TEXT PRIMARY KEY,parent_id TEXT,title TEXT,relative_path TEXT,depth INTEGER,purpose TEXT,source_id TEXT);
INSERT INTO archive_folders VALUES('root',NULL,'root','',0,'root','spanish-original');
INSERT INTO archive_folders VALUES('99','root','99','99 На разбор',1,'quarantine','spanish-original');
""")
        self.rec = {"records": [], "new_files": []}

    def file(self, rel, content=b"source body"):
        p = self.root / rel; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(content)
        return p

    def material(self, ident, rel, source="spanish-original"):
        self.db.execute("INSERT INTO materials(id,source_id,relative_path,original_path,title,description_source,format) VALUES(?,?,?,?,?,'fixture','txt')", (ident, source, rel, rel, ident))
        self.db.execute("INSERT INTO archive_materials VALUES(?,'99',?,'none',?)", (ident, ident, json.dumps({"editor_note": "keep"})))
        self.db.commit()

    def run_connector(self):
        return connector.connect_local(self.root, self.data, self.rec, apply=True, progress=False)

    def test_moved_aliases_extraction_deletion_and_retry(self):
        content = b"same image"; rel = "99 На разбор/moved.txt"; self.file(rel, content)
        for ident in ("alias1", "alias2"):
            self.material(ident, "99 На разбор/old/" + ident + ".txt")
            self.rec["records"].append({"source_id": ident, "status": "relocated_or_deduplicated", "current_paths": [rel]})
        self.material("removed", "99 На разбор/removed.txt")
        self.rec["records"].append({"source_id": "removed", "status": "user_confirmed_deleted"})
        self.material("archive", "99 На разбор/archive.zip")
        member_path = "99 На разбор/extracted/new.txt"; member = self.file(member_path, b"unpacked")
        self.rec["records"].append({"source_id": "archive", "status": "archive_fully_represented_by_extracted_files", "current_paths": [member_path]})
        self.rec["new_files"].append({"path": member_path, **connector.fingerprint(member), "historical_matches": [{"source_id": "archive", "member_id": "Z:example"}]})
        first = self.run_connector(); second = self.run_connector()
        self.assertEqual(first["connected"], 3); self.assertEqual(second["connected"], 3)
        self.assertEqual(first["new_members"], 1); self.assertEqual(second["new_members"], 0)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM materials").fetchone()[0], 5)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM files").fetchone()[0], 2)
        for ident in ("alias1", "alias2"):
            row = self.db.execute("SELECT missing,storage_key,description,publication,rights FROM materials WHERE id=?", (ident,)).fetchone()
            self.assertEqual(row[0], 0); self.assertTrue(os.path.samefile(self.root/rel, self.data/"files"/row[1]))
            self.assertEqual(row[2:], ("editorial text", "draft", "unknown"))
        for ident in ("removed", "archive"):
            row = self.db.execute("SELECT missing,storage_key,instructions FROM materials WHERE id=?", (ident,)).fetchone()
            self.assertEqual(row[:2], (1, None)); self.assertEqual(row[2].count("[Локальный архив]"), 1)
        self.assertTrue(Path(first["database_backup"]).is_file())

    def test_derived_files_are_copies_and_originals_over_100mb_are_supported(self):
        derived = "scripts/myspanish-knowledge/teaching-packs/one/guide.txt"
        self.file(derived, b"derived guide"); self.material("derived", "one/guide.txt", "derived-packs")
        p = self.file("01 Курсы/large.mp4")
        with p.open("wb") as f: f.truncate(101*1024*1024)
        self.material("large", "01 Курсы/large.mp4")
        report = self.run_connector()
        row = self.db.execute("SELECT storage_key FROM materials WHERE id='derived'").fetchone()
        self.assertFalse(os.path.samefile(self.root/derived, self.data/"files"/row[0]))
        self.assertEqual(report["connected"], 2)
        self.assertEqual(self.db.execute("SELECT missing FROM materials WHERE id='large'").fetchone()[0], 0)

    def test_unknown_missing_file_fails_before_database_mutation(self):
        self.material("missing", "01 Курсы/gone.txt")
        with self.assertRaises(FileNotFoundError): self.run_connector()
        self.assertEqual(self.db.execute("SELECT missing FROM materials").fetchone()[0], 1)
        self.assertFalse((self.data/"files").exists())

    def test_path_traversal_and_changed_reconciled_member_are_rejected(self):
        with self.assertRaises(ValueError): connector.safe_file(self.root, "../outside.txt")
        self.file("99 На разбор/file.txt"); self.material("old", "99 На разбор/file.txt")
        member = self.file("99 На разбор/new.txt", b"before")
        self.rec["new_files"] = [{"path": "99 На разбор/new.txt", **connector.fingerprint(member), "historical_matches": [{"source_id": "old", "member_id": "Z:x"}]}]
        member.write_bytes(b"after")
        with self.assertRaisesRegex(ValueError, "changed since review"): self.run_connector()
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM materials").fetchone()[0], 1)
        self.assertEqual(self.db.execute("SELECT missing FROM materials").fetchone()[0], 1)


if __name__ == "__main__":
    unittest.main()
