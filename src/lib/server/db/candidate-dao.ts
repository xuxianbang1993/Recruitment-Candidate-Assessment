import type { Candidate } from '$lib/types/candidate';
import { randomUUID } from 'crypto';
import { getDatabase } from './database.js';

interface CandidateRow {
  id: string;
  job_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  resume_text: string | null;
  skills: string | null;
  experience: number;
  education: string | null;
  created_at: string;
}

function rowToCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    jobId: row.job_id,
    name: row.name,
    phone: row.phone ?? '',
    email: row.email ?? '',
    resumeText: row.resume_text ?? '',
    skills: row.skills ? (JSON.parse(row.skills) as string[]) : [],
    experience: row.experience,
    education: row.education ?? '',
    createdAt: row.created_at
  };
}

export class CandidateDAO {
  getAll(): Candidate[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM candidates ORDER BY created_at DESC')
      .all() as CandidateRow[];
    return rows.map(rowToCandidate);
  }

  getById(id: string): Candidate | undefined {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM candidates WHERE id = ?')
      .get(id) as CandidateRow | undefined;
    return row ? rowToCandidate(row) : undefined;
  }

  getByJobId(jobId: string): Candidate[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM candidates WHERE job_id = ? ORDER BY created_at DESC')
      .all(jobId) as CandidateRow[];
    return rows.map(rowToCandidate);
  }

  create(data: Omit<Candidate, 'id' | 'createdAt'>): Candidate {
    const db = getDatabase();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO candidates (id, job_id, name, phone, email, resume_text, skills, experience, education)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.jobId,
      data.name,
      data.phone,
      data.email,
      data.resumeText,
      JSON.stringify(data.skills ?? []),
      data.experience ?? 0,
      data.education
    );
    return this.getById(id)!;
  }

  update(id: string, data: Partial<Omit<Candidate, 'id' | 'createdAt'>>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.jobId !== undefined) {
      fields.push('job_id = ?');
      values.push(data.jobId);
    }
    if (data.resumeText !== undefined) {
      fields.push('resume_text = ?');
      values.push(data.resumeText);
    }
    if (data.skills !== undefined) {
      fields.push('skills = ?');
      values.push(JSON.stringify(data.skills));
    }
    if (data.experience !== undefined) {
      fields.push('experience = ?');
      values.push(data.experience);
    }
    if (data.education !== undefined) {
      fields.push('education = ?');
      values.push(data.education);
    }

    if (fields.length === 0) return;

    values.push(id);
    db.prepare(`UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM candidates WHERE id = ?').run(id);
  }

  deleteByJobId(jobId: string): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM candidates WHERE job_id = ?').run(jobId);
    return result.changes;
  }

  deleteAll(): number {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM candidates').run();
    return result.changes;
  }

  search(keyword: string, jobId?: string): Candidate[] {
    const db = getDatabase();
    const escaped = keyword.replace(/[%_]/g, '\\$&');
    const pattern = '%' + escaped + '%';

    if (jobId) {
      const rows = db
        .prepare(
          `SELECT * FROM candidates
           WHERE job_id = ? AND (name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')
           ORDER BY created_at DESC`
        )
        .all(jobId, pattern, pattern) as CandidateRow[];
      return rows.map(rowToCandidate);
    }

    const rows = db
      .prepare(
        `SELECT * FROM candidates
         WHERE name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\'
         ORDER BY created_at DESC`
      )
      .all(pattern, pattern) as CandidateRow[];
    return rows.map(rowToCandidate);
  }
}

export const candidateDAO = new CandidateDAO();
