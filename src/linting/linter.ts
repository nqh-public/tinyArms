/**
 * Main linting logic using constitutional principles
 * Location: apps/tinyArms/src/linting/linter.ts
 *
 * Focuses on principles NOT enforced by pre-commit:
 * - Principle III: Architecture-First (search npm before custom code)
 * - Principle IV: Zero Invention (approval before new patterns)
 * - Principle XVII: DRY Enforcement (extract after 3+ duplicates)
 * - Universal Reusability (can someone else use this?)
 */

import { OllamaClient } from './ollama-client';
import type { LintResult } from '../types';

export class Linter {
  constructor(private client: OllamaClient) {}

  async lint(code: string, constitution: string): Promise<LintResult> {
    const startTime = Date.now();

    const systemPrompt = this.buildSystemPrompt(constitution);
    const userPrompt = this.buildUserPrompt(code);

    try {
      const rawResponse = await this.client.generate({
        system: systemPrompt,
        prompt: userPrompt,
      });

      const parsed = JSON.parse(rawResponse);

      return {
        violations: parsed.violations || [],
        summary: parsed.summary || 'No violations found',
        confidence: parsed.confidence || 0.85,
        model: 'qwen2.5-coder:3b-instruct',
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`Linting failed: ${error}`);
    }
  }

  private buildSystemPrompt(constitution: string): string {
    // Truncate constitution to fit context window (2000 chars = ~500 tokens)
    const excerpt = constitution.slice(0, 2000);

    return `You are a constitutional code linter focusing on principles NOT enforced by automated tools.

FOCUS ON:
1. **Architecture-First**: Did developer search npm/GitHub first or invent custom solution?
2. **DRY Violations**: Same logic/pattern appears 3+ times without extraction
3. **Universal Reusability**: Is this code reusable by others or too app-specific?
4. **Zero Invention**: New patterns without approval (design tokens, conventions)

Constitution excerpt (full version at ~/.specify/memory/constitution.md):
${excerpt}

IGNORE (pre-commit already handles):
- TypeScript errors
- ESLint import aliases
- File size >350 LOC
- Prettier formatting

Return JSON format:
{
  "violations": [
    {
      "rule": "architecture-first" | "dry-violation" | "universal-reusability" | "zero-invention",
      "line": <line_number>,
      "message": "<specific issue>",
      "severity": "error" | "warning"
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
