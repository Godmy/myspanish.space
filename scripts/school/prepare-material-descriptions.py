"""Prepare source-labelled catalogue descriptions; never invent content review."""
from pathlib import Path
from collections import Counter
import argparse, json, re, sqlite3


def clean(value):
    return re.sub(r"\s+", " ", value).strip()


def prepare(app, archive, output, refresh_generated=False):
    knowledge = archive / "scripts/myspanish-knowledge"
    cards, by_path = {}, {}
    for p in (knowledge / "cards").glob("E*.json"):
        c = json.loads(p.read_text(encoding="utf-8"))
        cards[c["id"]] = c
        by_path[c.get("origin", {}).get("archive_path", "")] = c
    packs = json.loads((knowledge / "teaching-packs/catalog.json").read_text(encoding="utf-8"))
    pack_names = {p["manifest"].split("/")[0]: p["title"] for p in packs["packs"]}
    artifacts = {}
    for artifact in json.loads((archive / "scripts/school-research/additional/artifact-manifest.json").read_text(encoding="utf-8")):
        if artifact.get("chars", 0) < 80:
            continue
        key=artifact["source_id"]
        score=(artifact.get("mode") == "native", artifact.get("chars", 0))
        if key not in artifacts or score > artifacts[key][0]:
            artifacts[key]=(score,artifact)
    db = sqlite3.connect((app / ".school-data/school.sqlite").resolve().as_uri()+"?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    rows = db.execute("SELECT * FROM materials WHERE source_id IN ('spanish-original','derived-packs') ORDER BY id").fetchall()
    drafts = []; methods = Counter(); preserved = 0
    for r in rows:
        generated = r["description_source"].startswith(("Каталожная аннотация", "Каталожное описание служебного"))
        if r["description"].strip() and not (refresh_generated and generated):
            preserved += 1
            continue
        rel = r["relative_path"].replace("\\", "/")
        card = cards.get(r["id"]) or by_path.get(r["original_path"].replace("\\", "/")) or by_path.get(rel)
        title = clean(re.sub(r"[_]+", " ", Path(rel).stem))
        context = " → ".join(rel.split("/")[:-1][-3:])
        kind = (r["format"] or "файл").upper()
        if card and card.get("description", "").strip():
            text = card["description"].strip(); method = "existing_annotation"
            origin = "Аннотация базы знаний: " + card["id"] + "; статус " + card.get("review_status", "unreviewed")
        elif r["source_id"] == "derived-packs":
            pack = pack_names.get(rel.split("/")[0], rel.split("/")[0]); name = Path(rel).name
            if name.startswith("printables"):
                text = f"Печатные карточки и игровые заготовки комплекта «{pack}». Используйте вместе с пояснениями соответствующих занятий; файл подходит для подготовки материалов до начала игры. Формат: {kind}."
            elif name.startswith("board"):
                text = f"Игровое поле для комплекта «{pack}». Распечатайте перед настольной игрой и используйте с её инструкцией. Формат: {kind}."
            else:
                text = f"Пошаговое руководство комплекта «{pack}»: последовательность занятий, реплики на испанском с переводом, практические действия и варианты проверки понимания. Формат: {kind}."
            method = "pack_manifest"; origin = "Описание по манифесту адаптированного комплекта " + rel.split("/")[0]
        elif Path(rel).name in (".DS_Store", "Thumbs.db") or r["format"] in ("lnk", "~"):
            text = f"Служебный файл «{Path(rel).name}» из раздела «{context}». Не является учебным документом или заданием."
            method = "technical_metadata"; origin = "Каталожное описание служебного формата; без содержательной оценки"
        else:
            text_path = (card or {}).get("extraction", {}).get("text_path")
            source = archive / text_path if text_path else archive / "scripts/school-research/texts" / (r["id"] + ".txt")
            artifact = None
            if not source.is_file():
                record=artifacts.get((card or {}).get("id",r["id"]))
                if record:
                    artifact=record[1]
                    source=archive/artifact["text_path"]
            if source.is_file() and source.resolve().is_relative_to(archive.resolve()):
                raw = source.read_text(encoding="utf-8", errors="replace")
                if artifact:
                    import hashlib
                    if hashlib.sha256(raw.encode("utf-8")).hexdigest()!=artifact["text_sha256"]:
                        raise ValueError("Stale extracted artifact: "+artifact["artifact_id"])
                raw = re.sub(r"(?im)^\s*(?:(?:PAGE|СТРАНИЦА|RECORD|SLIDE)\s*\d+.*|Click to edit Master.*|(?:Second|Third|Fourth|Fifth) level|[*•])\s*$", "", raw)
                fragment = clean(raw)
                fragment = re.sub(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", "[контакт в исходнике]", fragment)
                fragment = fragment[:430].rsplit(" ", 1)[0]
                if fragment:
                    label = "Машинно распознанный фрагмент" if artifact and artifact.get("mode")=="ocr" else "Фрагмент текста"
                    text = f"«{title}» ({kind}). Раздел: {context}. {label}: «{fragment}…»."
                    method = "machine_ocr_fragment" if artifact and artifact.get("mode")=="ocr" else "extracted_fragment"
                    origin = "Каталожная аннотация по извлечённому фрагменту " + source.relative_to(archive).as_posix() + ("; машинное OCR" if method=="machine_ocr_fragment" else "") + "; полный просмотр оригинала не заявляется"
                else:
                    source = None
            else:
                source = None
            if not source:
                form = {"mp3":"Аудиозапись", "wav":"Аудиозапись", "m4a":"Аудиозапись", "mp4":"Видеозапись", "wmv":"Видеозапись", "jpg":"Изображение", "jpeg":"Изображение", "png":"Изображение", "zip":"Архив комплекта", "rar":"Архив комплекта", "ppt":"Презентация", "pptx":"Презентация", "pdf":"Документ", "docx":"Документ", "pub":"Печатный макет"}.get(r["format"], "Материал")
                text = f"{form} «{title}» ({kind}). В каталоге относится к разделу «{context}»."
                method = "catalogue_metadata"; origin = "Каталожная аннотация по названию и разделу; содержание не подтверждено чтением или прослушиванием"
        if r["missing"] and "[Локальный архив]" in r["instructions"]:
            text += " " + r["instructions"].split("[Локальный архив]", 1)[1].strip()
        drafts.append({"id": r["id"], "description": text[:5000], "description_source": origin, "method": method, "previous_generated_description": r["description"] if refresh_generated and generated else None})
        methods[method] += 1
    db.close()
    report = {"total_archive_records": len(rows), "existing_descriptions_preserved": preserved,
              "prepared": len(drafts), "methods": dict(methods), "records": drafts}
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({k:v for k,v in report.items() if k!="records"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    app = Path(__file__).resolve().parents[2]
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--archive", type=Path, default=app.parent/".docs")
    p.add_argument("--output", type=Path, default=app/".school-data/prepared-material-descriptions.json")
    p.add_argument("--refresh-generated", action="store_true")
    a=p.parse_args();prepare(app, a.archive, a.output, a.refresh_generated)
