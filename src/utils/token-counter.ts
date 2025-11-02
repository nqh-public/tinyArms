/**
 * Token counting and response truncation utilities
 * Location: apps/tinyArms/src/utils/token-counter.ts
 *
 * @what Token budget enforcement for AI agent responses
 * @why Anthropic's "Writing Tools for Agents" recommends 25k token budget to prevent context overflow
 * @exports TOKEN_LIMITS, ResponseFormat, countTokens, truncateResponse
 *
 * Reference: https://www.anthropic.com/engineering/writing-tools-for-agents
 */

const CHARS_PER_TOKEN = 4; // Rough approximation: 1 token ≈ 4 chars
const MIN_VIOLATIONS_TO_SHOW = 1; // Always show at least 1 violation

export const TOKEN_LIMITS = {
  MAX_RESPONSE: 25000, // Hard limit (Claude Code standard)
  CONCISE_TARGET: 5000, // Target for concise mode
  DETAILED_TARGET: 15000, // Target for detailed mode
} as const;

export type ResponseFormat = 'concise' | 'detailed';

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 chars)
 */
export function countTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate response to fit token budget based on format
 */
export function truncateResponse<T extends { violations: unknown[]; summary: string }>(
  result: T,
  format: ResponseFormat
): T {
  const target = format === 'concise' ? TOKEN_LIMITS.CONCISE_TARGET : TOKEN_LIMITS.DETAILED_TARGET;

  if (format === 'concise') {
    // Concise: Only summary + violation count
    return {
      ...result,
      violations: [],
      summary: `${result.summary} (${result.violations.length} violations found)`,
    };
  }

  // Detailed: Truncate violations array to fit budget
  const resultStr = JSON.stringify(result);
  const currentTokens = countTokens(resultStr);

  if (currentTokens <= target) {
    return result;
  }

  // Calculate how many violations to keep
  const violationCount = Math.floor((result.violations.length * target) / currentTokens);
  const keepCount = Math.max(MIN_VIOLATIONS_TO_SHOW, violationCount);

  return {
    ...result,
    violations: result.violations.slice(0, keepCount),
    summary: `${result.summary} (showing ${keepCount} of ${result.violations.length} violations)`,
  };
}
