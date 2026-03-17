import { getDatabase } from './database.js';
import type { Job, ScoreDimension } from '$lib/types/assessment';
import { randomUUID } from 'crypto';

interface JobRow {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  requirements: string | null;
  skills: string | null;
  weights: string | null;
  created_at: string;
}

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    department: row.department ?? '',
    description: row.description ?? '',
    requirements: row.requirements ? (JSON.parse(row.requirements) as string[]) : [],
    skills: row.skills ? (JSON.parse(row.skills) as string[]) : [],
    weights: row.weights ? (JSON.parse(row.weights) as ScoreDimension[]) : [],
    createdAt: row.created_at
  };
}

export class JobDAO {
  getAll(): Job[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM jobs ORDER BY created_at DESC')
      .all() as JobRow[];
    return rows.map(rowToJob);
  }

  getById(id: string): Job | undefined {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM jobs WHERE id = ?')
      .get(id) as JobRow | undefined;
    return row ? rowToJob(row) : undefined;
  }

  create(data: Omit<Job, 'id' | 'createdAt'>): Job {
    const db = getDatabase();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO jobs (id, title, department, description, requirements, skills, weights)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.title,
      data.department,
      data.description,
      JSON.stringify(data.requirements ?? []),
      JSON.stringify(data.skills ?? []),
      JSON.stringify(data.weights ?? [])
    );
    return this.getById(id)!;
  }

  update(id: string, data: Partial<Omit<Job, 'id' | 'createdAt'>>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.department !== undefined) { fields.push('department = ?'); values.push(data.department); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.requirements !== undefined) { fields.push('requirements = ?'); values.push(JSON.stringify(data.requirements)); }
    if (data.skills !== undefined) { fields.push('skills = ?'); values.push(JSON.stringify(data.skills)); }
    if (data.weights !== undefined) { fields.push('weights = ?'); values.push(JSON.stringify(data.weights)); }

    if (fields.length === 0) return;
    values.push(id);
    db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  }
}

export const jobDAO = new JobDAO();
