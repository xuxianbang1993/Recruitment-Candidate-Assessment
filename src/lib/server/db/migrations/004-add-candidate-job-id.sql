-- 004: Add job_id foreign key to candidates table (job-centric refactor)
-- Pre-v1.4.0 candidates have no job association, so they must be cleared.
-- NOTE: PRAGMA foreign_keys cannot be toggled inside a transaction,
-- so we rely on deleting all rows first to avoid FK violations.

-- Remove pre-existing candidates (cascades to assessments via FK)
DELETE FROM candidates;

-- Add job_id column. SQLite ALTER TABLE ADD COLUMN with NOT NULL requires a DEFAULT.
-- The DEFAULT '' acts as a safety net; all real inserts validate job_id at the API layer.
-- With no existing rows, the default is never applied to data.
ALTER TABLE candidates ADD COLUMN job_id TEXT NOT NULL DEFAULT '' REFERENCES jobs(id) ON DELETE CASCADE;

-- Index for job-scoped queries
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
