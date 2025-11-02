/**
 * Token counting and response truncation utilities
 * Location: apps/tinyArms/src/utils/token-counter.ts
 *
 * Why: Anthropic's "Writing Tools for Agents" recommends 25k token budget
 * Reference: https://www.anthropic.com/engineering/writing-tools-for-agents
 */

export const TOKEN_LIMITS = {
  MAX_RESPONSE: 25000,    // Hard limit (Claude Code standard)
  CONCISE_TARGET: 5000,   // Target for concise mode
  DETAILED_TARGET: 15000, // Target for detailed mode
} as const;

export type ResponseFormat = 'concise' | 'detailed';

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 chars)
 */
export function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate response to fit token budget based on format
 */
export function truncateResponse<T extends { violations: any[]; summary: string }>(
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
  const violationCount = Math.floor(
    (result.violations.length * target) / currentTokens
  );

  return {
    ...result,
    violations: result.violations.slice(0, Math.max(1, violationCount)),
    summary: `${result.summary} (showing ${violationCount} of ${result.violations.length} violations)`,
  };
}
