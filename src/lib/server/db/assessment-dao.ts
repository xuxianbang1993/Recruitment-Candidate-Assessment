import { getDatabase } from './database.js';
import type { Assessment, ScoreDimension } from '$lib/types/assessment';
import { randomUUID } from 'crypto';

interface AssessmentRow {
  id: string;
  candidate_id: string;
  job_id: string;
  scores: string | null;
  total_score: number;
  strengths: string | null;
  weaknesses: string | null;
  suggestions: string | null;
  ai_provider: string | null;
  type: string;
  parent_id: string | null;
  created_at: string;
}

function rowToAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    scores: row.scores ? (JSON.parse(row.scores) as ScoreDimension[]) : [],
    totalScore: row.total_score,
    strengths: row.strengths ? (JSON.parse(row.strengths) as string[]) : [],
    weaknesses: row.weaknesses ? (JSON.parse(row.weaknesses) as string[]) : [],
    suggestions: row.suggestions ? (JSON.parse(row.suggestions) as string[]) : [],
    aiProvider: row.ai_provider ?? '',
    type: (row.type as 'initial' | 'comprehensive') ?? 'initial',
    parentId: row.parent_id ?? null,
    createdAt: row.created_at
  };
}

export class AssessmentDAO {
  getAll(): Assessment[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM assessments ORDER BY created_at DESC')
      .all() as AssessmentRow[];
    return rows.map(rowToAssessment);
  }

  getById(id: string): Assessment | undefined {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM assessments WHERE id = ?')
      .get(id) as AssessmentRow | undefined;
    return row ? rowToAssessment(row) : undefined;
  }

  getByCandidateId(candidateId: string): Assessment[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM assessments WHERE candidate_id = ? ORDER BY created_at DESC')
      .all(candidateId) as AssessmentRow[];
    return rows.map(rowToAssessment);
  }

  getByJobId(jobId: string): Assessment[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM assessments WHERE job_id = ? ORDER BY created_at DESC')
      .all(jobId) as AssessmentRow[];
    return rows.map(rowToAssessment);
  }

  create(data: Omit<Assessment, 'id' | 'createdAt'>): Assessment {
    const db = getDatabase();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO assessments (id, candidate_id, job_id, scores, total_score, strengths, weaknesses, suggestions, ai_provider, type, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.candidateId,
      data.jobId,
      JSON.stringify(data.scores ?? []),
      data.totalScore ?? 0,
      JSON.stringify(data.strengths ?? []),
      JSON.stringify(data.weaknesses ?? []),
      JSON.stringify(data.suggestions ?? []),
      data.aiProvider,
      data.type ?? 'initial',
      data.parentId ?? null
    );
    return this.getById(id)!;
  }

  update(id: string, data: Partial<Omit<Assessment, 'id' | 'createdAt'>>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.scores !== undefined) { fields.push('scores = ?'); values.push(JSON.stringify(data.scores)); }
    if (data.totalScore !== undefined) { fields.push('total_score = ?'); values.push(data.totalScore); }
    if (data.strengths !== undefined) { fields.push('strengths = ?'); values.push(JSON.stringify(data.strengths)); }
    if (data.weaknesses !== undefined) { fields.push('weaknesses = ?'); values.push(JSON.stringify(data.weaknesses)); }
    if (data.suggestions !== undefined) { fields.push('suggestions = ?'); values.push(JSON.stringify(data.suggestions)); }
    if (data.aiProvider !== undefined) { fields.push('ai_provider = ?'); values.push(data.aiProvider); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.parentId !== undefined) { fields.push('parent_id = ?'); values.push(data.parentId); }

    if (fields.length === 0) return;
    values.push(id);
    db.prepare(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM assessments WHERE id = ?').run(id);
  }
}

export const assessmentDAO = new AssessmentDAO();
