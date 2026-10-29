CREATE TABLE IF NOT EXISTS school.files(id TEXT PRIMARY KEY, checksum TEXT NOT NULL UNIQUE, bytes INTEGER NOT NULL, storage_key TEXT NOT NULL, format TEXT NOT NULL);
ALTER TABLE school.materials ADD COLUMN file_id TEXT REFERENCES files(id);
INSERT OR IGNORE INTO school.files(id,checksum,bytes,storage_key,format) SELECT checksum,checksum,COALESCE(bytes,0),storage_key,format FROM school.materials WHERE checksum IS NOT NULL AND storage_key IS NOT NULL;
UPDATE school.materials SET file_id=checksum WHERE checksum IN (SELECT id FROM school.files);
INSERT INTO schema_migrations VALUES(8,datetime('now'));
