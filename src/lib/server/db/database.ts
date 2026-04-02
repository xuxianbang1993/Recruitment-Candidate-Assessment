import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getDbPath(): string {
  if (process.env.NODE_ENV === 'test') {
    return ':memory:';
  }
  // Use DB_PATH env var if set, otherwise resolve from process.cwd() (project root)
  return process.env.DB_PATH || join(process.cwd(), 'recruitment.db');
}

let db: Database.Database | null = null;

function getMigrationsDir(): string {
  return join(__dirname, 'migrations');
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const migrationsDir = getMigrationsDir();
  let files: string[];
  try {
    files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    // No migrations directory or empty — skip
    return;
  }

  const applied = new Set(
    database
      .prepare('SELECT filename FROM _migrations')
      .all()
      .map((row: unknown) => (row as { filename: string }).filename)
  );

  const runSingle = database.transaction((file: string) => {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    database.exec(sql);
    database.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
  });

  for (const file of files) {
    if (applied.has(file)) continue;
    runSingle(file);
  }
}

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = getDbPath();
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enforce foreign key constraints
  db.pragma('foreign_keys = ON');
  // Performance tuning
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = MEMORY');

  runMigrations(db);

  return db;
}

// For testing: reset singleton
export function resetDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export default getDatabase;
