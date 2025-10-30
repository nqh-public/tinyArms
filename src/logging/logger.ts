/**
 * Main logger for tracking lint executions
 * Location: apps/tinyArms/src/logging/logger.ts
 *
 * Logs to:
 * 1. SQLite database (~/.tinyarms/tinyarms.db)
 * 2. JSON Lines file (~/.tinyarms/logs/lint-history.jsonl)
 */

import fs from 'fs';
import path from 'path';
import { LintDatabase } from './db';
import type { LintResult } from '../types';

const LOGS_DIR = path.join(process.env.HOME!, '.tinyarms', 'logs');
const JSONL_PATH = path.join(LOGS_DIR, 'lint-history.jsonl');

export interface LogEntry {
  timestamp: string; // ISO 8601
  file_path: string;
  violations_count: number;
  confidence: number;
  model: string;
  latency_ms: number;
  exit_code: number;
  error?: string;
}

export class Logger {
  private static db: LintDatabase | null = null;

  static init(): void {
    if (!this.db) {
      this.db = new LintDatabase();

      // Ensure logs directory exists
      if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }
    }
  }

  static logLintExecution(
    filePath: string,
    result: LintResult,
    exitCode: number,
    error?: string
  ): void {
    this.init();

    const timestamp = new Date().toISOString();

    const entry: LogEntry = {
      timestamp,
      file_path: filePath,
      violations_count: result.violations.length,
      confidence: result.confidence,
      model: result.model,
      latency_ms: result.latencyMs,
      exit_code: exitCode,
      ...(error && { error }),
    };

    try {
      // 1. Write to database
      this.db!.insertLintExecution({
        timestamp,
        file_path: filePath,
        violations_count: result.violations.length,
        violations_json: JSON.stringify(result.violations),
        confidence: result.confidence,
        model: result.model,
        latency_ms: result.latencyMs,
        exit_code: exitCode,
        user_decision: null,
      });

      // 2. Append to JSONL
      const jsonLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(JSONL_PATH, jsonLine, 'utf-8');
    } catch (err) {
      // Silent failure - don't crash the CLI if logging fails
      console.error('Warning: Failed to log execution:', err);
    }
  }

  static close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
