import type { ProjectExperience } from '$lib/types';
import { randomUUID } from 'crypto';
import { getDatabase } from './database.js';

interface ProjectExperienceRow {
  id: string;
  profile_id: string;
  project_name: string | null;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  sort_order: number;
}

function rowToEntity(row: ProjectExperienceRow): ProjectExperience {
  return {
    id: row.id,
    profileId: row.profile_id,
    projectName: row.project_name ?? '',
    role: row.role ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    description: row.description ?? '',
    sortOrder: row.sort_order
  };
}

export class ProjectExperienceDAO {
  /**
   * Returns all project experiences for a resume profile ordered by sort order.
   */
  getByProfileId(profileId: string): ProjectExperience[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM project_experiences WHERE profile_id = ? ORDER BY sort_order ASC')
      .all(profileId) as ProjectExperienceRow[];
    return rows.map(rowToEntity);
  }

  /**
   * Inserts project experiences for a profile and assigns sequential sort orders.
   */
  batchCreate(
    profileId: string,
    items: Omit<ProjectExperience, 'id' | 'profileId' | 'sortOrder'>[]
  ): void {
    if (items.length === 0) return;

    const db = getDatabase();
    const insert = db.prepare(
      `INSERT INTO project_experiences (
        id,
        profile_id,
        project_name,
        role,
        start_date,
        end_date,
        description,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const transaction = db.transaction(
      (entries: Omit<ProjectExperience, 'id' | 'profileId' | 'sortOrder'>[]): void => {
        entries.forEach((item, index) => {
          insert.run(
            randomUUID(),
            profileId,
            item.projectName,
            item.role,
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
   * Deletes all project experiences belonging to a resume profile.
   */
  deleteByProfileId(profileId: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM project_experiences WHERE profile_id = ?').run(profileId);
  }
}

export const projectExperienceDAO = new ProjectExperienceDAO();
