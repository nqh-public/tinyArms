/**
 * Core type definitions for tinyArms linting system
 */

export type ResponseFormat = 'concise' | 'detailed';

export interface LintResult {
  violations: Violation[];
  summary: string;
  confidence: number;
  model: string;
  latencyMs: number;
  tokenCount?: number; // Track token usage
  format?: ResponseFormat; // Track response format used
}

export interface Violation {
  rule: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
  principle?: string; // Semantic principle name (e.g., "Principle X: File Organization Standards")
  constitutionalRef?: string; // Path to constitution section
  fix?: FixSuggestion; // Actionable fix suggestion
}

export interface FixSuggestion {
  action: string; // What to do (e.g., "Extract 2+ functions to utilities")
  suggestions?: string[]; // Specific suggestions
  example?: string; // Example reference (e.g., "See packages/i18n/core/detector.ts:1-298")
}

export interface GenerateOptions {
  prompt: string;
  system: string;
  format?: ResponseFormat; // Control response verbosity
}
