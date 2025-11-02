/**
 * Main linting logic using constitutional principles
 * Location: apps/tinyArms/src/linting/linter.ts
 *
 * @what Constitutional code linter focusing on principles NOT enforced by pre-commit
 * @why Pre-commit handles TypeScript/ESLint/file-size; this catches architectural anti-patterns
 * @exports Linter class
 *
 * Focuses on principles NOT enforced by pre-commit:
 * - Principle III: Architecture-First (search npm before custom code)
 * - Principle IV: Zero Invention (approval before new patterns)
 * - Principle XVII: DRY Enforcement (extract after 3+ duplicates)
 * - Universal Reusability (can someone else use this?)
 */

import type { LintResult, ResponseFormat } from '../types.js';
import { countTokens, TOKEN_LIMITS, truncateResponse } from '../utils/token-counter.js';
import { OllamaClient } from './ollama-client.js';


const DEFAULT_CONFIDENCE = 0.85;
const CONSTITUTION_EXCERPT_CHARS = 2000; // ~500 tokens

export class Linter {
  constructor(private client: OllamaClient) {}

  async lint(
    code: string,
    constitution: string,
    format: ResponseFormat = 'detailed'
  ): Promise<LintResult> {
    const startTime = Date.now();

    const systemPrompt = this.buildSystemPrompt(constitution, format);
    const userPrompt = this.buildUserPrompt(code);

    try {
      const rawResponse = await this.client.generate({
        system: systemPrompt,
        prompt: userPrompt,
        format,
      });

      const parsed = JSON.parse(rawResponse);

      let result: LintResult = {
        violations: parsed.violations || [],
        summary: parsed.summary || 'No violations found',
        confidence: parsed.confidence || DEFAULT_CONFIDENCE,
        model: 'qwen2.5-coder:3b-instruct',
        latencyMs: Date.now() - startTime,
        tokenCount: countTokens(rawResponse),
        format,
      };

      // Enforce token budget
      if (result.tokenCount! > TOKEN_LIMITS.MAX_RESPONSE) {
        result = truncateResponse(result, format);
        result.tokenCount = countTokens(JSON.stringify(result));
      }

      return result;
    } catch (error) {
      throw new Error(`Linting failed: ${error}`);
    }
  }

  private buildSystemPrompt(constitution: string, format: ResponseFormat): string {
    // Truncate constitution to fit context window (2000 chars = ~500 tokens)
    const excerpt = constitution.slice(0, CONSTITUTION_EXCERPT_CHARS);

    const verbosityGuidance =
      format === 'concise'
        ? 'Return minimal JSON (summary + violation count only).'
        : 'Return detailed JSON with actionable fixes and constitutional references.';

    return `You are a constitutional code linter focusing on principles NOT enforced by automated tools.

FOCUS ON:
1. **Principle III: Architecture-First Development**: Did developer search npm/GitHub first or invent custom solution?
2. **Principle XVII: Pragmatic Atomic Composability (DRY)**: Same logic/pattern appears 3+ times without extraction
3. **Principle I: Universal Reusability**: Is this code reusable by others or too app-specific?
4. **Principle IV: Zero Invention Policy**: New patterns without approval (design tokens, conventions)

Design principles excerpt (full version at ~/.tinyarms/principles.md):
${excerpt}

IGNORE (pre-commit already handles):
- TypeScript errors
- ESLint import aliases
- File size >350 LOC
- Prettier formatting

${verbosityGuidance}

Return JSON format:
{
  "violations": [
    {
      "rule": "architecture-first" | "dry-violation" | "universal-reusability" | "zero-invention",
      "line": <line_number>,
      "message": "<specific issue>",
      "severity": "error" | "warning",
      "principle": "Principle III: Architecture-First Development",
      "constitutionalRef": "~/.tinyarms/principles.md:151-202",
      "fix": {
        "action": "<what to do>",
        "suggestions": ["<specific fix 1>", "<specific fix 2>"],
        "example": "See packages/i18n/core/detector.ts:1-298"
      }
    }
  ],
  "summary": "<1-2 sentence overview>",
  "confidence": <0.0-1.0>
}`;
  }

  private buildUserPrompt(code: string): string {
    return `Analyze this code for constitutional violations:

\`\`\`
${code}
\`\`\`

Return JSON with violations found. If no violations, return empty violations array.`;
  }
}
