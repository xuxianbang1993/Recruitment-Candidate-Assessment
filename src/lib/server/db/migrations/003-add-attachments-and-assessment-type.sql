-- 003: Add attachments table and assessment type/parent_id columns

ALTER TABLE assessments ADD COLUMN type TEXT NOT NULL DEFAULT 'initial';
ALTER TABLE assessments ADD COLUMN parent_id TEXT REFERENCES assessments(id);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  text_content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_assessment ON attachments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_parent ON assessments(parent_id);
