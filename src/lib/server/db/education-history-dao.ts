import type { EducationRecord } from '$lib/types';
import { randomUUID } from 'crypto';
import { getDatabase } from './database.js';

interface EducationHistoryRow {
  id: string;
  profile_id: string;
  school: string | null;
  major: string | null;
  degree: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
}

function rowToEntity(row: EducationHistoryRow): EducationRecord {
  return {
    id: row.id,
    profileId: row.profile_id,
    school: row.school ?? '',
    major: row.major ?? '',
    degree: row.degree ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    sortOrder: row.sort_order
  };
}

export class EducationHistoryDAO {
  /**
   * Returns all education history records for a resume profile ordered by sort order.
   */
  getByProfileId(profileId: string): EducationRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM education_history WHERE profile_id = ? ORDER BY sort_order ASC')
      .all(profileId) as EducationHistoryRow[];
    return rows.map(rowToEntity);
  }

  /**
   * Inserts education history records for a profile and assigns sequential sort orders.
   */
  batchCreate(
    profileId: string,
    items: Omit<EducationRecord, 'id' | 'profileId' | 'sortOrder'>[]
  ): void {
    if (items.length === 0) return;

    const db = getDatabase();
    const insert = db.prepare(
      `INSERT INTO education_history (
        id,
        profile_id,
        school,
        major,
        degree,
        start_date,
        end_date,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const transaction = db.transaction(
      (entries: Omit<EducationRecord, 'id' | 'profileId' | 'sortOrder'>[]): void => {
        entries.forEach((item, index) => {
          insert.run(
            randomUUID(),
            profileId,
            item.school,
            item.major,
            item.degree,
            item.startDate,
            item.endDate,
            index
          );
        });
      }
    );

    transaction(items);
  }

  /**
   * Deletes all education history records belonging to a resume profile.
   */
  deleteByProfileId(profileId: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM education_history WHERE profile_id = ?').run(profileId);
  }
}

export const educationHistoryDAO = new EducationHistoryDAO();
