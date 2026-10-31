-- Additive archive catalogue. Existing users, lessons and work are preserved.
CREATE TABLE IF NOT EXISTS school.archive_folders(id TEXT PRIMARY KEY,parent_id TEXT,title TEXT NOT NULL,relative_path TEXT NOT NULL,depth INTEGER NOT NULL,purpose TEXT NOT NULL,source_id TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS school.archive_folders_parent ON archive_folders(parent_id);
CREATE TABLE IF NOT EXISTS school.archive_materials(material_id TEXT PRIMARY KEY,folder_id TEXT NOT NULL,file_id TEXT NOT NULL,processing TEXT NOT NULL,metadata TEXT NOT NULL CHECK(json_valid(metadata)));
CREATE INDEX IF NOT EXISTS school.archive_materials_folder ON archive_materials(folder_id);
CREATE TABLE IF NOT EXISTS school.archive_programs(course_id TEXT PRIMARY KEY,readiness TEXT NOT NULL,kind TEXT NOT NULL,provenance TEXT NOT NULL,metadata TEXT NOT NULL CHECK(json_valid(metadata)));
CREATE TABLE IF NOT EXISTS school.archive_module_materials(module_id TEXT NOT NULL,material_id TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(module_id,material_id));
CREATE TABLE IF NOT EXISTS school.archive_batches(digest TEXT NOT NULL,part TEXT NOT NULL,checksum TEXT NOT NULL,PRIMARY KEY(digest,part));
CREATE TABLE IF NOT EXISTS school.archive_import_runs(digest TEXT PRIMARY KEY,state TEXT NOT NULL,report TEXT NOT NULL CHECK(json_valid(report)),created_at TEXT NOT NULL);
INSERT OR IGNORE INTO schema_migrations VALUES(10,datetime('now'));
