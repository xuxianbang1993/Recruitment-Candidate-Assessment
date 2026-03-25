CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT,
  resume_text TEXT,
  skills TEXT, -- JSON array
  experience INTEGER DEFAULT 0,
  education TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  requirements TEXT, -- JSON array
  skills TEXT, -- JSON array
  weights TEXT, -- JSON array of {name, weight}
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  scores TEXT, -- JSON array of {name, weight, score}
  total_score REAL DEFAULT 0,
  strengths TEXT, -- JSON array
  weaknesses TEXT, -- JSON array
  suggestions TEXT, -- JSON array
  ai_provider TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessments_candidate ON assessments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_assessments_job ON assessments(job_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);
