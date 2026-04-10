import type { LanguageSkill, ResumeProfile, ResumeProfileFull } from '$lib/types';
import { randomUUID } from 'crypto';
import { getDatabase } from './database.js';
import { educationHistoryDAO } from './education-history-dao.js';
import { projectExperienceDAO } from './project-experience-dao.js';
import { workExperienceDAO } from './work-experience-dao.js';

interface ResumeProfileRow {
  id: string;
  candidate_id: string;
  job_id: string;
  job_title: string | null;
  name: string | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  highest_education: string | null;
  school: string | null;
  major: string | null;
  work_years: number;
  expected_salary: string | null;
  skills: string | null;
  certificates: string | null;
  languages: string | null;
  self_evaluation: string | null;
  raw_text: string | null;
  parse_status: string;
  parse_error: string | null;
  created_at: string;
  updated_at: string;
}

type ResumeProfileUpdateData = Partial<Omit<ResumeProfile, 'id' | 'createdAt' | 'updatedAt'>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isLanguageSkill(value: unknown): value is LanguageSkill {
  return (
    isRecord(value) &&
    typeof value['language'] === 'string' &&
    typeof value['level'] === 'string'
  );
}

function parseStringArray(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseLanguageSkills(value: string | null): LanguageSkill[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(isLanguageSkill) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToEntity(row: ResumeProfileRow): ResumeProfile {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    jobTitle: row.job_title ?? '',
    name: row.name ?? '',
    gender: row.gender ?? '',
    birthDate: row.birth_date ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    city: row.city ?? '',
    highestEducation: row.highest_education ?? '',
    school: row.school ?? '',
    major: row.major ?? '',
    workYears: row.work_years,
    expectedSalary: row.expected_salary ?? '',
    skills: parseStringArray(row.skills),
    certificates: parseStringArray(row.certificates),
    languages: parseLanguageSkills(row.languages),
    selfEvaluation: row.self_evaluation ?? '',
    rawText: row.raw_text ?? '',
    parseStatus: row.parse_status as ResumeProfile['parseStatus'],
    parseError: row.parse_error ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class ResumeProfileDAO {
  /**
   * Returns all resume profiles ordered by creation time descending.
   */
  getAll(): ResumeProfile[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM resume_profiles ORDER BY created_at DESC')
      .all() as ResumeProfileRow[];
    return rows.map(rowToEntity);
  }

  /**
   * Returns a single resume profile by its identifier.
   */
  getById(id: string): ResumeProfile | undefined {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM resume_profiles WHERE id = ?')
      .get(id) as ResumeProfileRow | undefined;
    return row ? rowToEntity(row) : undefined;
  }

  /**
   * Returns a resume profile with its work, education, and project child records.
   */
  getFullById(id: string): ResumeProfileFull | undefined {
    const profile = this.getById(id);
    if (!profile) return undefined;

    return {
      ...profile,
      workExperiences: workExperienceDAO.getByProfileId(id),
      educationHistory: educationHistoryDAO.getByProfileId(id),
      projectExperiences: projectExperienceDAO.getByProfileId(id)
    };
  }

  /**
   * Returns the newest resume profile for a candidate.
   */
  getByCandidateId(candidateId: string): ResumeProfile | undefined {
    const db = getDatabase();
    const row = db
      .prepare(
        'SELECT * FROM resume_profiles WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .get(candidateId) as ResumeProfileRow | undefined;
    return row ? rowToEntity(row) : undefined;
  }

  /**
   * Returns all resume profiles for a job ordered by creation time descending.
   */
  getByJobId(jobId: string): ResumeProfile[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM resume_profiles WHERE job_id = ? ORDER BY created_at DESC')
      .all(jobId) as ResumeProfileRow[];
    return rows.map(rowToEntity);
  }

  /**
   * Creates a new resume profile using default values for fields not provided.
   */
  create(data: {
    id: string;
    candidateId: string;
    jobId: string;
    jobTitle: string;
    rawText: string;
    parseStatus: string;
  }): ResumeProfile {
    const db = getDatabase();
    const id = data.id || randomUUID();

    db.prepare(
      `INSERT INTO resume_profiles (
        id,
        candidate_id,
        job_id,
        job_title,
        raw_text,
        parse_status
      ) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, data.candidateId, data.jobId, data.jobTitle, data.rawText, data.parseStatus);

    return this.getById(id)!;
  }

  /**
   * Updates a resume profile and always refreshes the updated_at timestamp.
   */
  update(id: string, data: ResumeProfileUpdateData): void {
    const db = getDatabase();
    const fields: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];

    if (data.candidateId !== undefined) {
      fields.push('candidate_id = ?');
      values.push(data.candidateId);
    }
    if (data.jobId !== undefined) {
      fields.push('job_id = ?');
      values.push(data.jobId);
    }
    if (data.jobTitle !== undefined) {
      fields.push('job_title = ?');
      values.push(data.jobTitle);
    }
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.gender !== undefined) {
      fields.push('gender = ?');
      values.push(data.gender);
    }
    if (data.birthDate !== undefined) {
      fields.push('birth_date = ?');
      values.push(data.birthDate);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      values.push(data.city);
    }
    if (data.highestEducation !== undefined) {
      fields.push('highest_education = ?');
      values.push(data.highestEducation);
    }
    if (data.school !== undefined) {
      fields.push('school = ?');
      values.push(data.school);
    }
    if (data.major !== undefined) {
      fields.push('major = ?');
      values.push(data.major);
    }
    if (data.workYears !== undefined) {
      fields.push('work_years = ?');
      values.push(data.workYears);
    }
    if (data.expectedSalary !== undefined) {
      fields.push('expected_salary = ?');
      values.push(data.expectedSalary);
    }
    if (data.skills !== undefined) {
      fields.push('skills = ?');
      values.push(JSON.stringify(data.skills));
    }
    if (data.certificates !== undefined) {
      fields.push('certificates = ?');
      values.push(JSON.stringify(data.certificates));
    }
    if (data.languages !== undefined) {
      fields.push('languages = ?');
      values.push(JSON.stringify(data.languages));
    }
    if (data.selfEvaluation !== undefined) {
      fields.push('self_evaluation = ?');
      values.push(data.selfEvaluation);
    }
    if (data.rawText !== undefined) {
      fields.push('raw_text = ?');
      values.push(data.rawText);
    }
    if (data.parseStatus !== undefined) {
      fields.push('parse_status = ?');
      values.push(data.parseStatus);
    }
    if (data.parseError !== undefined) {
      fields.push('parse_error = ?');
      values.push(data.parseError);
    }

    values.push(id);
    db.prepare(`UPDATE resume_profiles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  /**
   * Deletes a resume profile by identifier.
   */
  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM resume_profiles WHERE id = ?').run(id);
  }

  /**
   * Deletes all resume profiles for a candidate and returns the affected row count.
   */
  deleteByCandidateId(candidateId: string): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM resume_profiles WHERE candidate_id = ?').run(candidateId);
    return result.changes;
  }

  /**
   * Deletes all resume profiles for a job and returns the affected row count.
   */
  deleteByJobId(jobId: string): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM resume_profiles WHERE job_id = ?').run(jobId);
    return result.changes;
  }
}

export const resumeProfileDAO = new ResumeProfileDAO();
