/**
 * Core type definitions for tinyArms linting system
 */

export interface LintResult {
  violations: Violation[];
  summary: string;
  confidence: number;
  model: string;
  latencyMs: number;
}

export interface Violation {
  rule: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface GenerateOptions {
  prompt: string;
  system: string;
}
