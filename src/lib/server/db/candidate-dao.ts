import { getDatabase } from './database.js';
import type { Candidate } from '$lib/types/candidate';
import { randomUUID } from 'crypto';

interface CandidateRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  resume_text: string | null;
  skills: string | null;
  experience: number;
  education: string | null;
  created_at: string;
}

function rowToCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    email: row.email ?? '',
    position: row.position ?? '',
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

  create(data: Omit<Candidate, 'id' | 'createdAt'>): Candidate {
    const db = getDatabase();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO candidates (id, name, phone, email, position, resume_text, skills, experience, education)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.name,
      data.phone,
      data.email,
      data.position,
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
    if (data.position !== undefined) {
      fields.push('position = ?');
      values.push(data.position);
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

  search(keyword: string): Candidate[] {
    const db = getDatabase();
    const pattern = `%${keyword}%`;
    const rows = db
      .prepare(
        `SELECT * FROM candidates
         WHERE name LIKE ? OR position LIKE ? OR email LIKE ?
         ORDER BY created_at DESC`
      )
      .all(pattern, pattern, pattern) as CandidateRow[];
    return rows.map(rowToCandidate);
  }
}

export const candidateDAO = new CandidateDAO();
