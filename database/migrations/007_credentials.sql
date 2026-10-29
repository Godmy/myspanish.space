CREATE TABLE IF NOT EXISTS pd.credentials(user_id TEXT PRIMARY KEY REFERENCES users(id), login TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pd.login_attempts(ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS pd.login_attempts_ip ON login_attempts(ip_hash,created_at);
INSERT INTO schema_migrations VALUES(7,datetime('now'));
