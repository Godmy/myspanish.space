ALTER TABLE school.materials ADD COLUMN rights_note TEXT NOT NULL DEFAULT '';
INSERT INTO schema_migrations VALUES(3,datetime('now'));
