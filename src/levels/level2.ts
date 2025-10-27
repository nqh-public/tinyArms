// src/levels/level2.ts
import { Ollama } from 'ollama';
import { ModelConfig } from '../types';
import fs from 'fs/promises';

/**
 * Level 2: Code Specialist (Qwen2.5-Coder 7B)
 * 
 * Use for: Constitutional code linting ONLY
 * Speed: 10-15s for 350 LOC on M2
 * Accuracy: 88.4% HumanEval
 * Memory: ~6GB when loaded
 */

export class Level2 {
  private ollama: Ollama;

  constructor(
    private modelConfig: ModelConfig,
    ollamaHost: string = 'http://localhost:11434'
  ) {
    this.ollama = new Ollama({ host: ollamaHost });
  }

  /**
   * Lint code against constitutional principles
   */
  async lintCode(input: {
    filePath: string;
    code: string;
    constitutionPath?: string;
  }): Promise<{
    issues: CodeIssue[];
    summary: string;
    confidence: number;
  }> {
    // Load constitution if provided
    let constitution = '';
    if (input.constitutionPath) {
      try {
        constitution = await fs.readFile(input.constitutionPath, 'utf-8');
      } catch (error) {
        console.warn(`Failed to load constitution from ${input.constitutionPath}`);
      }
    }

    const prompt = this.buildLintingPrompt(input.code, input.filePath, constitution);

    const response = await this.ollama.generate({
      model: this.modelConfig.path,
      prompt,
      options: {
        temperature: this.modelConfig.temperature,
        num_predict: 2000,
      },
    });

    try {
      const parsed = JSON.parse(this.cleanJSONResponse(response.response));
      const confidence = this.estimateCodeConfidence(
        response.response,
        parsed,
        { hasIssues: (parsed.issues?.length || 0) > 0 }
      );
      return {
        issues: parsed.issues || [],
        summary: parsed.summary || 'No issues found',
        confidence,
      };
    } catch (error) {
      throw new Error(`Failed to parse linting results: ${error}`);
    }
  }

  /**
   * Suggest code improvements based on context
   */
  async suggestImprovements(input: {
    code: string;
    filePath: string;
    context?: string;
  }): Promise<{
    suggestions: CodeSuggestion[];
    confidence: number;
  }> {
    const prompt = `You are a code review expert. Analyze this code and suggest improvements.

File: ${input.filePath}
${input.context ? `Context: ${input.context}` : ''}

Code:
\`\`\`
${input.code}
\`\`\`

Provide suggestions for:
1. Code quality (naming, structure, readability)
2. Performance optimizations
3. Security concerns
4. Best practices

Format as JSON:
{
  "suggestions": [
    {
      "line": <line_number>,
      "type": "quality|performance|security|best-practice",
      "severity": "info|warning|error",
      "message": "...",
      "suggestion": "..."
    }
  ]
}

Output ONLY the JSON.`;

    const response = await this.ollama.generate({
      model: this.modelConfig.path,
      prompt,
      options: {
        temperature: 0.3,
        num_predict: 1500,
      },
    });

    try {
      const parsed = JSON.parse(this.cleanJSONResponse(response.response));
      const confidence = this.estimateCodeConfidence(
        response.response,
        parsed,
        { hasSuggestions: (parsed.suggestions?.length || 0) > 0 }
      );
      return {
        suggestions: parsed.suggestions || [],
        confidence,
      };
    } catch (error) {
      throw new Error(`Failed to parse improvement suggestions: ${error}`);
    }
  }

  /**
   * Check if code follows specific patterns/principles
   */
  async checkPrinciples(input: {
    code: string;
    principles: string[];
  }): Promise<{
    violations: PrincipleViolation[];
    compliance: number; // 0-1 score
    confidence: number;
  }> {
    const principlesText = input.principles.map((p, i) => `${i + 1}. ${p}`).join('\n');

    const prompt = `Check if this code follows these principles:

Principles:
${principlesText}

Code:
\`\`\`
${input.code}
\`\`\`

For each violation, specify:
- Which principle is violated
- Where in the code (line number if possible)
- How to fix it

Format as JSON:
{
  "violations": [
    {
      "principle": "...",
      "line": <number>,
      "description": "...",
      "fix": "..."
    }
  ],
  "compliance": <0.0-1.0 score>
}

Output ONLY the JSON.`;

    const response = await this.ollama.generate({
      model: this.modelConfig.path,
      prompt,
      options: {
        temperature: 0.2, // Very low for principle checking
        num_predict: 1000,
      },
    });

    try {
      const parsed = JSON.parse(this.cleanJSONResponse(response.response));
      const confidence = this.estimateCodeConfidence(
        response.response,
        parsed,
        { hasViolations: (parsed.violations?.length || 0) > 0, hasCompliance: !!parsed.compliance }
      );
      return {
        violations: parsed.violations || [],
        compliance: parsed.compliance || 1.0,
        confidence,
      };
    } catch (error) {
      throw new Error(`Failed to parse principle check: ${error}`);
    }
  }

  /**
   * Build a comprehensive linting prompt
   */
  private buildLintingPrompt(code: string, filePath: string, constitution: string): string {
    return `You are a constitutional code linter. Review this code against the provided principles.

File: ${filePath}

${constitution ? `Constitution:\n${constitution}\n` : ''}

Code:
\`\`\`
${code}
\`\`\`

Find issues related to:
1. Violations of constitutional principles
2. Code quality problems
3. Potential bugs
4. Security vulnerabilities

Format as JSON:
{
  "issues": [
    {
      "line": <line_number>,
      "severity": "error|warning|info",
      "category": "constitutional|quality|bug|security",
      "message": "...",
      "suggestion": "..."
    }
  ],
  "summary": "Brief overview of findings"
}

Output ONLY the JSON, no explanation.`;
  }

  /**
   * Estimate confidence for code analysis responses
   */
  private estimateCodeConfidence(
    rawResponse: string,
    parsed: any,
    context?: {
      hasIssues?: boolean;
      hasSuggestions?: boolean;
      hasViolations?: boolean;
      hasCompliance?: boolean;
    }
  ): number {
    let confidence = 0.85; // Base for Level 2 (code specialist)

    // Check uncertainty markers
    if (rawResponse.toLowerCase().includes('not sure') ||
        rawResponse.toLowerCase().includes('uncertain') ||
        rawResponse.toLowerCase().includes('might be')) {
      confidence -= 0.25;
    }

    // Verify expected structure
    if (context?.hasIssues !== undefined && parsed.issues) {
      if (parsed.issues.length === 0 && context.hasIssues) {
        confidence -= 0.15; // Expected issues but found none
      }
      // Bonus for detailed issues with line numbers
      if (parsed.issues.some((i: any) => i.line && i.severity && i.message)) {
        confidence += 0.05;
      }
    }

    if (context?.hasSuggestions !== undefined && parsed.suggestions) {
      // Bonus for actionable suggestions
      if (parsed.suggestions.some((s: any) => s.suggestion && s.message)) {
        confidence += 0.05;
      }
    }

    if (context?.hasCompliance && typeof parsed.compliance === 'number') {
      if (parsed.compliance >= 0 && parsed.compliance <= 1) {
        confidence += 0.05; // Valid compliance score
      }
    }

    // Penalize if output is too short (likely incomplete)
    if (rawResponse.length < 50) {
      confidence -= 0.30;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  /**
   * Clean JSON response from LLM
   */
  private cleanJSONResponse(response: string): string {
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return cleaned.trim();
  }

  /**
   * Check if model is ready
   */
  async isReady(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      return models.models.some(m => m.name === this.modelConfig.path);
    } catch {
      return false;
    }
  }

  /**
   * Load model (heavy operation)
   */
  async load(): Promise<void> {
    console.log('Loading Qwen 7B (this may take 10-15 seconds)...');
    await this.ollama.generate({
      model: this.modelConfig.path,
      prompt: 'hello',
      options: { num_predict: 1 },
    });
  }

  /**
   * Unload model to free memory
   */
  async unload(): Promise<void> {
    await this.ollama.generate({
      model: this.modelConfig.path,
      prompt: '',
      keep_alive: 0,
    });
    console.log('Qwen 7B unloaded from memory');
  }
}

// Type definitions
export interface CodeIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  category: 'constitutional' | 'quality' | 'bug' | 'security';
  message: string;
  suggestion: string;
}

export interface CodeSuggestion {
  line: number;
  type: 'quality' | 'performance' | 'security' | 'best-practice';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
}

export interface PrincipleViolation {
  principle: string;
  line: number;
  description: string;
  fix: string;
}
