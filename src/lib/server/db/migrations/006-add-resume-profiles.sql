-- 006-add-resume-profiles.sql
-- v1.5.0: 简历信息库 — 结构化简历数据存储

CREATE TABLE IF NOT EXISTS resume_profiles (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  job_title TEXT DEFAULT '',
  name TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  birth_date TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  city TEXT DEFAULT '',
  highest_education TEXT DEFAULT '',
  school TEXT DEFAULT '',
  major TEXT DEFAULT '',
  work_years INTEGER DEFAULT 0,
  expected_salary TEXT DEFAULT '',
  skills TEXT DEFAULT '[]',
  certificates TEXT DEFAULT '[]',
  languages TEXT DEFAULT '[]',
  self_evaluation TEXT DEFAULT '',
  raw_text TEXT DEFAULT '',
  parse_status TEXT DEFAULT 'pending',
  parse_error TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_resume_profiles_candidate_id ON resume_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resume_profiles_job_id ON resume_profiles(job_id);

CREATE TABLE IF NOT EXISTS work_experiences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  company TEXT DEFAULT '',
  position TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES resume_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_work_experiences_profile_id ON work_experiences(profile_id);

CREATE TABLE IF NOT EXISTS education_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  school TEXT DEFAULT '',
  major TEXT DEFAULT '',
  degree TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES resume_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_education_history_profile_id ON education_history(profile_id);

CREATE TABLE IF NOT EXISTS project_experiences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  project_name TEXT DEFAULT '',
  role TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES resume_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_experiences_profile_id ON project_experiences(profile_id);
