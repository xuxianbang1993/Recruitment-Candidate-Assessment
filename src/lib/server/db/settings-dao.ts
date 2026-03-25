import { getDatabase } from './database.js';

interface SettingsRow {
  key: string;
  value: string;
}

export class SettingsDAO {
  get(key: string): string | undefined {
    const db = getDatabase();
    const row = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as Pick<SettingsRow, 'value'> | undefined;
    return row?.value;
  }

  set(key: string, value: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(key, value);
  }

  getAll(): Record<string, string> {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM settings').all() as SettingsRow[];
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  delete(key: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM settings WHERE key = ?').run(key);
  }
}

export const settingsDAO = new SettingsDAO();
