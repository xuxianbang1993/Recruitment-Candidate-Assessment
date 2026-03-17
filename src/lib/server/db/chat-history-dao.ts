import { getDatabase } from './database.js';
import type { Message } from '$lib/types/ai';
import { randomUUID } from 'crypto';

export interface ChatHistoryEntry extends Message {
  id: string;
  sessionId: string;
  createdAt: string;
}

interface ChatHistoryRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

function rowToEntry(row: ChatHistoryRow): ChatHistoryEntry {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role as Message['role'],
    content: row.content,
    createdAt: row.created_at
  };
}

export class ChatHistoryDAO {
  getBySessionId(sessionId: string): ChatHistoryEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at ASC')
      .all(sessionId) as ChatHistoryRow[];
    return rows.map(rowToEntry);
  }

  create(sessionId: string, message: Message): ChatHistoryEntry {
    const db = getDatabase();
    const id = randomUUID();
    db.prepare(
      'INSERT INTO chat_history (id, session_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(id, sessionId, message.role, message.content);
    const row = db
      .prepare('SELECT * FROM chat_history WHERE id = ?')
      .get(id) as ChatHistoryRow;
    return rowToEntry(row);
  }

  deleteSession(sessionId: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM chat_history WHERE session_id = ?').run(sessionId);
  }

  getAll(): ChatHistoryEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM chat_history ORDER BY created_at ASC')
      .all() as ChatHistoryRow[];
    return rows.map(rowToEntry);
  }
}

export const chatHistoryDAO = new ChatHistoryDAO();
