CREATE TABLE IF NOT EXISTS school.audit(id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_id TEXT, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS school.audit_actor ON audit(actor_id,created_at);
INSERT INTO schema_migrations VALUES(6,datetime('now'));
