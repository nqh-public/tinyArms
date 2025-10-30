/**
 * SQLite database setup for lint history tracking
 * Location: apps/tinyArms/src/logging/db.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.env.HOME!, '.tinyarms');
const DB_PATH = path.join(DB_DIR, 'tinyarms.db');

export interface LintHistoryRow {
  id?: number;
  timestamp: string; // ISO 8601
  file_path: string;
  violations_count: number;
  violations_json: string;
  confidence: number;
  model: string;
  latency_ms: number;
  exit_code: number;
  user_decision: string | null;
}

export class LintDatabase {
  private db: Database.Database;

  constructor() {
    // Ensure directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS lint_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        file_path TEXT NOT NULL,
        violations_count INTEGER NOT NULL,
        violations_json TEXT NOT NULL,
        confidence REAL NOT NULL,
        model TEXT NOT NULL,
        latency_ms INTEGER NOT NULL,
        exit_code INTEGER NOT NULL,
        user_decision TEXT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON lint_history(timestamp);
      CREATE INDEX IF NOT EXISTS idx_file_path ON lint_history(file_path);
    `);
  }

  insertLintExecution(row: Omit<LintHistoryRow, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO lint_history (
        timestamp, file_path, violations_count, violations_json,
        confidence, model, latency_ms, exit_code, user_decision
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      row.timestamp,
      row.file_path,
      row.violations_count,
      row.violations_json,
      row.confidence,
      row.model,
      row.latency_ms,
      row.exit_code,
      row.user_decision
    );

    return result.lastInsertRowid as number;
  }

  getRecentHistory(limit: number = 10): LintHistoryRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM lint_history
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(limit) as LintHistoryRow[];
  }

  close(): void {
    this.db.close();
  }
}
