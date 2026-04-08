-- 004: Add job_id foreign key to candidates table (job-centric refactor)
-- Requires clearing existing candidate data before running

ALTER TABLE candidates ADD COLUMN job_id TEXT NOT NULL DEFAULT '' REFERENCES jobs(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
