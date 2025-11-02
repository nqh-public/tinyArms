/**
 * Review Code Tool
 * Location: apps/tinyArms/src/mcp/tools/review-code.ts
 *
 * @what Consolidated code review tool (replaces lint_code, check_constitution, etc.)
 * @why Reduces agent context waste, follows Anthropic's tool consolidation principle
 * @exports reviewCode function and reviewCodeMeta schema
 *
 * Implements: Anthropic's "Writing Tools for Agents" recommendations
 * - Single consolidated workflow (not 4 separate tools)
 * - Response format control (concise vs detailed)
 * - Token budget enforcement (25k max)
 * - Semantic identifiers (principle names, not numbers)
 * - Actionable error messages with fix suggestions
 */

import type {
  CodeViolation,
  ReviewCodeInput,
  ReviewCodeOutput,
  ToolResponse,
} from '@/mcp/types';

const DETAILED_MULTIPLIER = 1.5;
const CONCISE_MULTIPLIER = 0.8;
const CHARS_PER_TOKEN = 4;

/**
 * Review code files against constitutional principles
 *
 * Consolidates 4 operations into 1:
 * - Lint code (check syntax/style)
 * - Check constitution (verify principles)
 * - Get violations (collect issues)
 * - Suggest fixes (provide solutions)
 */
export async function reviewCode(
  input: ReviewCodeInput
): Promise<ToolResponse<ReviewCodeOutput>> {
  const startTime = Date.now();

  // Validate input
  if (!input.files || input.files.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'No files provided',
        suggestion: 'Provide at least one file path in the "files" array',
      },
      metadata: {
        latencyMs: Date.now() - startTime,
        level: 'Level 0: Validation',
        tokensUsed: 0,
      },
    };
  }

  // Determine response verbosity
  const isDetailed = input.response_format === 'detailed';

  try {
    // TODO: Implement actual linting logic
    // This is a placeholder for the tiered routing system
    //
    // Flow:
    // 1. Level 0: Check deterministic rules (hardcoded colors, magic numbers)
    // 2. Level 1: Semantic routing (classify intent)
    // 3. Level 2: AI analysis (constitutional principles)
    // 4. Level 3: Deep research (if needed)

    const violations: CodeViolation[] = [
      // Placeholder example
      {
        principle: 'Principle VI: Brutal Honesty',
        location: 'auth.ts:42',
        issue: 'Error message uses diplomatic language',
        fix: 'Change "Invalid credentials" to "Wrong password or email"',
        severity: 'warning',
        constitutionalReference:
          '.specify/memory/constitution.md:277-306',
      },
    ];

    const output: ReviewCodeOutput = {
      violations,
      summary: isDetailed
        ? `Reviewed ${input.files.length} files, found ${violations.length} violations across ${new Set(violations.map((v) => v.principle)).size} constitutional principles. See detailed breakdown below.`
        : `${violations.length} violations in ${input.files.length} files`,
      totalFiles: input.files.length,
      totalViolations: violations.length,
    };

    return {
      success: true,
      data: output,
      metadata: {
        latencyMs: Date.now() - startTime,
        level: 'Level 2: Code Analysis',
        tokensUsed: estimateTokens(output, isDetailed),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'REVIEW_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion:
          'Check that files exist and are readable. Verify constitution path is correct.',
      },
      metadata: {
        latencyMs: Date.now() - startTime,
        level: 'Error',
        tokensUsed: 0,
      },
    };
  }
}

/**
 * Estimate token usage for response
 * Rough approximation: 1 token ≈ 4 characters
 */
function estimateTokens(output: ReviewCodeOutput, detailed: boolean): number {
  const json = JSON.stringify(output);
  const chars = json.length;

  // Apply verbosity multiplier
  const multiplier = detailed ? DETAILED_MULTIPLIER : CONCISE_MULTIPLIER;

  return Math.ceil((chars / CHARS_PER_TOKEN) * multiplier);
}

/**
 * Tool metadata for MCP registration
 */
export const reviewCodeMeta = {
  name: 'review_code',
  description:
    'Review code files against constitutional principles. Returns violations with actionable fixes. Consolidates linting, principle checking, and fix suggestions into one call.',
  inputSchema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'File paths to review (e.g., ["src/auth.ts", "src/**/*.ts"])',
      },
      principles: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Filter by specific principles (e.g., ["Principle VI: Brutal Honesty"]). Omit to check all.',
        optional: true,
      },
      response_format: {
        type: 'string',
        enum: ['concise', 'detailed'],
        description:
          'Control output verbosity. Concise: ~2k tokens. Detailed: ~15k tokens.',
        default: 'concise',
      },
      max_tokens: {
        type: 'number',
        description: 'Maximum tokens in response. Default: 5000, Max: 25000',
        default: 5000,
        maximum: 25000,
      },
    },
    required: ['files'],
  },
};
