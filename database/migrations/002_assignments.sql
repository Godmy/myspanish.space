CREATE TABLE IF NOT EXISTS school.assignments(id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL UNIQUE REFERENCES lessons(id), title TEXT NOT NULL, instructions TEXT NOT NULL, due_at TEXT);
ALTER TABLE school.submissions ADD COLUMN assignment_id TEXT REFERENCES assignments(id);
INSERT OR IGNORE INTO school.assignments(id,lesson_id,title,instructions) SELECT id,id,title,homework FROM school.lessons;
UPDATE school.submissions SET assignment_id=lesson_id WHERE assignment_id IS NULL;
INSERT INTO schema_migrations VALUES(2,datetime('now'));
