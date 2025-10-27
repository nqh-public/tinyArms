// src/database/db.ts
import Database from 'better-sqlite3';
import { TaskHistory, CacheEntry } from '../types';
import path from 'path';
import fs from 'fs';

/**
 * SQLite Database for TinyArms
 * 
 * Stores:
 * - Task execution history
 * - Routing decisions
 * - Performance metrics
 * - User feedback (for learning)
 */

export class TinyArmsDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
  }

  /**
   * Initialize database schema
   */
  async init(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        input TEXT,
        output TEXT,
        level TEXT,
        confidence REAL,
        duration_ms INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_task_skill ON task_history(skill);
      CREATE INDEX IF NOT EXISTS idx_task_timestamp ON task_history(timestamp);

      CREATE TABLE IF NOT EXISTS cache_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_entries(key);
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);

      CREATE TABLE IF NOT EXISTS user_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        feedback_type TEXT NOT NULL, -- 'thumbs_up', 'thumbs_down', 'correction'
        original_output TEXT,
        corrected_output TEXT,
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES task_history(id)
      );

      CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_type TEXT NOT NULL, -- 'memory', 'battery', 'cache_hit_rate'
        value REAL NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_type ON system_metrics(metric_type);
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON system_metrics(timestamp);
    `);
  }

  /**
   * Save task execution history
   */
  saveTaskHistory(task: Omit<TaskHistory, 'id'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO task_history (skill, timestamp, status, input, output, level, confidence, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.skill,
      task.timestamp,
      task.status,
      task.input,
      task.output,
      task.level,
      task.confidence,
      task.duration_ms
    );
  }

  /**
   * Get recent task history
   */
  getRecentTasks(limit: number = 10): TaskHistory[] {
    const stmt = this.db.prepare(`
      SELECT * FROM task_history
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(limit) as TaskHistory[];
  }

  /**
   * Get task history with filters
   */
  getTaskHistory(options: {
    limit?: number;
    skill?: string;
    status?: string;
    since?: string;
  }): TaskHistory[] {
    let query = 'SELECT * FROM task_history WHERE 1=1';
    const params: any[] = [];

    if (options.skill) {
      query += ' AND skill = ?';
      params.push(options.skill);
    }

    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (options.since) {
      query += ' AND timestamp >= ?';
      params.push(options.since);
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as TaskHistory[];
  }

  /**
   * Save user feedback
   */
  saveFeedback(feedback: {
    taskId: number;
    type: 'thumbs_up' | 'thumbs_down' | 'correction';
    originalOutput?: string;
    correctedOutput?: string;
    comment?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO user_feedback (task_id, feedback_type, original_output, corrected_output, comment)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      feedback.taskId,
      feedback.type,
      feedback.originalOutput || null,
      feedback.correctedOutput || null,
      feedback.comment || null
    );
  }

  /**
   * Get feedback for analysis (learning)
   */
  getFeedback(limit: number = 100): any[] {
    const stmt = this.db.prepare(`
      SELECT f.*, t.skill, t.input, t.output
      FROM user_feedback f
      JOIN task_history t ON f.task_id = t.id
      ORDER BY f.created_at DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  /**
   * Save system metrics
   */
  saveMetric(type: string, value: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO system_metrics (metric_type, value)
      VALUES (?, ?)
    `);

    stmt.run(type, value);
  }

  /**
   * Get metrics for analysis
   */
  getMetrics(type: string, since?: string): any[] {
    let query = 'SELECT * FROM system_metrics WHERE metric_type = ?';
    const params: any[] = [type];

    if (since) {
      query += ' AND timestamp >= ?';
      params.push(since);
    }

    query += ' ORDER BY timestamp DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTasks: number;
    tasksBySkill: Record<string, number>;
    tasksByStatus: Record<string, number>;
    avgDuration: number;
    avgConfidence: number;
  } {
    const totalTasks = this.db.prepare('SELECT COUNT(*) as count FROM task_history').get() as { count: number };

    const tasksBySkill = this.db.prepare(`
      SELECT skill, COUNT(*) as count
      FROM task_history
      GROUP BY skill
    `).all() as Array<{ skill: string; count: number }>;

    const tasksByStatus = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM task_history
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    const performance = this.db.prepare(`
      SELECT AVG(duration_ms) as avgDuration, AVG(confidence) as avgConfidence
      FROM task_history
    `).get() as { avgDuration: number; avgConfidence: number };

    return {
      totalTasks: totalTasks.count,
      tasksBySkill: Object.fromEntries(tasksBySkill.map(r => [r.skill, r.count])),
      tasksByStatus: Object.fromEntries(tasksByStatus.map(r => [r.status, r.count])),
      avgDuration: performance.avgDuration || 0,
      avgConfidence: performance.avgConfidence || 0,
    };
  }

  /**
   * Clean old data
   */
  cleanup(options: {
    olderThanDays?: number;
    keepFeedback?: boolean;
  }): void {
    const days = options.olderThanDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString();

    // Clean old task history (but keep tasks with feedback)
    if (!options.keepFeedback) {
      this.db.prepare(`
        DELETE FROM task_history
        WHERE created_at < ?
      `).run(cutoff);
    } else {
      this.db.prepare(`
        DELETE FROM task_history
        WHERE created_at < ?
        AND id NOT IN (SELECT task_id FROM user_feedback)
      `).run(cutoff);
    }

    // Clean expired cache entries
    this.db.prepare(`
      DELETE FROM cache_entries
      WHERE expires_at < datetime('now')
    `).run();

    // Clean old metrics
    this.db.prepare(`
      DELETE FROM system_metrics
      WHERE timestamp < ?
    `).run(cutoff);

    // Vacuum to reclaim space
    this.db.exec('VACUUM');
  }

  /**
   * Export data for analysis
   */
  export(format: 'json' | 'csv' = 'json'): string {
    const data = {
      tasks: this.db.prepare('SELECT * FROM task_history ORDER BY created_at DESC').all(),
      feedback: this.db.prepare('SELECT * FROM user_feedback ORDER BY created_at DESC').all(),
      metrics: this.db.prepare('SELECT * FROM system_metrics ORDER BY timestamp DESC').all(),
      stats: this.getStats(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV export (simplified)
    let csv = 'skill,timestamp,status,level,confidence,duration_ms\n';
    for (const task of data.tasks as any[]) {
      csv += `${task.skill},${task.timestamp},${task.status},${task.level},${task.confidence},${task.duration_ms}\n`;
    }
    return csv;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
