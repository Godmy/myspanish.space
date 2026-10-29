ALTER TABLE school.materials ADD COLUMN original_path TEXT NOT NULL DEFAULT '';
UPDATE school.materials SET original_path=relative_path WHERE original_path='';
ALTER TABLE lead_funnel ADD COLUMN enrolled_student_id TEXT;
INSERT INTO schema_migrations VALUES(5,datetime('now'));
