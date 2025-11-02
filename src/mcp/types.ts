/**
 * MCP Server type definitions for tinyArms
 *
 * Follows Anthropic's tool design principles:
 * - Consolidated workflows (not granular operations)
 * - Response format control (concise vs detailed)
 * - Token budget limits (25k max like Claude Code)
 * - Semantic identifiers (names, not UUIDs)
 */

/**
 * Response format control
 * Agents can choose verbosity based on downstream needs
 */
export type ResponseFormat = 'concise' | 'detailed';

/**
 * Base response interface
 * All tools return this structure
 */
export interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    suggestion?: string; // Actionable fix guidance
  };
  metadata: {
    latencyMs: number;
    level: string; // Which tier handled this (Level 0-3)
    tokensUsed: number; // Track token consumption
  };
}

/**
 * Code review consolidated tool
 * Replaces: lint_code, check_constitution, get_violations, suggest_fixes
 */
export interface ReviewCodeInput {
  files: string[]; // Paths to review
  principles?: string[]; // Filter by specific constitutional principles (semantic names)
  response_format?: ResponseFormat;
  max_tokens?: number; // Default: 5000, max: 25000
}

export interface ReviewCodeOutput {
  violations: CodeViolation[];
  summary: string; // Brief overview
  totalFiles: number;
  totalViolations: number;
}

export interface CodeViolation {
  principle: string; // e.g., "Principle VI: Brutal Honesty"
  location: string; // e.g., "auth.ts:42"
  issue: string; // Plain English description
  fix: string; // Actionable suggestion
  severity: 'error' | 'warning';
  constitutionalReference?: string; // e.g., ".specify/memory/constitution.md:277-306"
}

/**
 * File organization consolidated tool
 * Replaces: rename_file, move_file, organize_files
 */
export interface OrganizeFilesInput {
  paths: string[]; // Files to organize
  action: 'rename' | 'move' | 'analyze'; // What to do
  context?: string; // Optional semantic context for AI
  response_format?: ResponseFormat;
  max_tokens?: number;
  dry_run?: boolean; // Default: true (safety)
}

export interface OrganizeFilesOutput {
  operations: FileOperation[];
  summary: string;
  requiresConfirmation: boolean; // True if >10 files
}

export interface FileOperation {
  from: string;
  to: string;
  reason: string; // Why this change
  confidence: number; // 0-1 scale
}

/**
 * Research context consolidated tool
 * Replaces: query_system, analyze_changes, extract_keywords
 */
export interface ResearchContextInput {
  query: string; // Natural language query
  sources?: ('constitution' | 'filesystem' | 'logs')[]; // Where to search
  response_format?: ResponseFormat;
  max_tokens?: number;
  since?: string; // For change detection (ISO date)
}

export interface ResearchContextOutput {
  findings: Finding[];
  summary: string;
  sources: string[]; // Files/docs referenced
}

export interface Finding {
  source: string; // File path or source type
  content: string; // Relevant excerpt
  relevance: number; // 0-1 confidence score
  context?: string; // Surrounding context if needed
}

/**
 * Token budget configuration
 * Enforces Anthropic's 25k limit per response
 */
export const TOKEN_LIMITS = {
  DEFAULT: 5000,
  MAX: 25000,
  CONCISE_TARGET: 2000,
  DETAILED_TARGET: 15000,
} as const;

/**
 * Tier performance characteristics
 * Used in metadata.level responses
 */
export const TIER_INFO = {
  'Level -1': 'Semantic Cache (instant)',
  'Level 0': 'Deterministic Rules (<1ms)',
  'Level 1': 'Embedding Routing (<100ms)',
  'Level 2': 'Code Analysis (2-3s)',
  'Level 3': 'Research Agent (8-12s)',
} as const;
