import type { WorkExperience } from '$lib/types';
import { randomUUID } from 'crypto';
import { getDatabase } from './database.js';

interface WorkExperienceRow {
  id: string;
  profile_id: string;
  company: string | null;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  sort_order: number;
}

function rowToEntity(row: WorkExperienceRow): WorkExperience {
  return {
    id: row.id,
    profileId: row.profile_id,
    company: row.company ?? '',
    position: row.position ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    description: row.description ?? '',
    sortOrder: row.sort_order
  };
}

export class WorkExperienceDAO {
  /**
   * Returns all work experiences for a resume profile ordered by sort order.
   */
  getByProfileId(profileId: string): WorkExperience[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM work_experiences WHERE profile_id = ? ORDER BY sort_order ASC')
      .all(profileId) as WorkExperienceRow[];
    return rows.map(rowToEntity);
  }

  /**
   * Inserts work experiences for a profile and assigns sequential sort orders.
   */
  batchCreate(
    profileId: string,
    items: Omit<WorkExperience, 'id' | 'profileId' | 'sortOrder'>[]
  ): void {
    if (items.length === 0) return;

    const db = getDatabase();
    const insert = db.prepare(
      `INSERT INTO work_experiences (
        id,
        profile_id,
        company,
        position,
        start_date,
        end_date,
        description,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const transaction = db.transaction(
      (entries: Omit<WorkExperience, 'id' | 'profileId' | 'sortOrder'>[]): void => {
        entries.forEach((item, index) => {
          insert.run(
            randomUUID(),
            profileId,
            item.company,
            item.position,
            item.startDate,
            item.endDate,
            item.description,
            index
          );
        });
      }
    );

    transaction(items);
  }

  /**
   * Deletes all work experiences belonging to a resume profile.
   */
  deleteByProfileId(profileId: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM work_experiences WHERE profile_id = ?').run(profileId);
  }
}

export const workExperienceDAO = new WorkExperienceDAO();
