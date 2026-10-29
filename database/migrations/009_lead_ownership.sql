ALTER TABLE lead_funnel ADD COLUMN assigned_teacher_id TEXT;
UPDATE lead_funnel SET assigned_teacher_id='teacher' WHERE EXISTS(SELECT 1 FROM pd.users WHERE id='teacher' AND role='teacher');
INSERT INTO schema_migrations VALUES(9,datetime('now'));
