// src/levels/level1.ts
import { Ollama } from 'ollama';
import { ModelConfig } from '../types';

/**
 * Level 1: Small Generalist (Gemma 3 4B)
 * 
 * Use for: Complex file naming, intent extraction, general reasoning
 * Speed: 2-4s on M2
 * Accuracy: 85-90%
 * Memory: ~3GB when loaded
 */

export class Level1 {
  private ollama: Ollama;

  constructor(
    private modelConfig: ModelConfig,
    ollamaHost: string = 'http://localhost:11434'
  ) {
    this.ollama = new Ollama({ host: ollamaHost });
  }

  /**
   * Generate a filename from messy input
   */
  async generateFilename(input: {
    originalName: string;
    fileType?: string;
    context?: string;
  }): Promise<{ filename: string; confidence: number }> {
    const prompt = `You are a file naming expert. Generate a clean, descriptive filename.

Input:
- Original: ${input.originalName}
${input.fileType ? `- Type: ${input.fileType}` : ''}
${input.context ? `- Context: ${input.context}` : ''}

Rules:
1. Use kebab-case (lowercase with hyphens)
2. Be descriptive but concise (3-5 words max)
3. Remove dates, "screenshot", "untitled"
4. Include only the file name, no extension

Examples:
- "Screenshot 2024-10-27.png" → "hero-mockup-mobile"
- "Untitled design.fig" → "dashboard-redesign"
- "IMG_1234.jpg" → "golden-gate-sunset"

Output ONLY the filename, nothing else.`;

    const response = await this.ollama.generate({
      model: this.modelConfig.path,
      prompt,
      options: {
        temperature: this.modelConfig.temperature,
        num_predict: 50, // Short output
      },
    });

    const filename = response.response.trim().toLowerCase();
    
    // Estimate confidence based on output quality
    const confidence = this.estimateConfidence(filename, input.originalName);

    return { filename, confidence };
  }

  /**
   * Extract intent from voice transcript or text
   */
  async extractIntent(text: string): Promise<{
    intent: string;
    action: string;
    parameters: Record<string, any>;
    confidence: number;
  }> {
    const prompt = `Extract the user's intent from this text.

Text: "${text}"

Output as JSON with this structure:
{
  "intent": "brief description of what user wants",
  "action": "specific action to take (e.g., 'rename_file', 'move_file', 'create_note')",
  "parameters": {
    "key": "value"
  }
}

Output ONLY the JSON, no explanation.`;

    const response = await this.ollama.generate({
      model: this.modelConfig.path,
      prompt,
      options: {
        temperature: 0.3, // Lower for structured output
        num_predict: 200,
      },
    });

    try {
      const parsed = JSON.parse(this.cleanJSONResponse(response.response));
      const confidence = this.estimateJSONConfidence(response.response, parsed);
      return {
        ...parsed,
        confidence,
      };
    } catch (error) {
      throw new Error(`Failed to parse intent: ${error}`);
    }
  }

  /**
   * Analyze markdown changes and suggest actions
   */
  async analyzeMarkdownChanges(changes: Array<{
    file: string;
    additions: string[];
    deletions: string[];
  }>): Promise<{
    summary: string;
    suggestions: string[];
    confidence: number;
  }> {
    const changesText = changes.map(c => 
      `File: ${c.file}\nAdded:\n${c.additions.join('\n')}\nRemoved:\n${c.deletions.join('\n')}`
    ).join('\n\n');

    const prompt = `Analyze these markdown file changes and suggest actions.

Changes:
${changesText}

Provide:
1. Brief summary (1 sentence)
2. Suggested actions (3-5 bullet points)

Format as JSON:
{
  "summary": "...",
  "suggestions": ["...", "..."]
}

Output ONLY the JSON.`;

    const response = await this.ollama.generate({
      model: this.modelConfig.path,
      prompt,
      options: {
        temperature: 0.5,
        num_predict: 300,
      },
    });

    try {
      const parsed = JSON.parse(this.cleanJSONResponse(response.response));
      const confidence = this.estimateJSONConfidence(response.response, parsed, {
        requiredFields: ['summary', 'suggestions'],
        minSuggestions: 1,
      });
      return {
        ...parsed,
        confidence,
      };
    } catch (error) {
      throw new Error(`Failed to parse markdown analysis: ${error}`);
    }
  }

  /**
   * Classify file type when rules fail
   */
  async classifyFileType(
    filename: string,
    content?: string
  ): Promise<{ type: string; confidence: number }> {
    const prompt = `Classify this file type.

Filename: ${filename}
${content ? `Content preview: ${content.slice(0, 200)}...` : ''}

Valid types: design, code, document, screenshot, photo, video, audio, archive, other

Output ONLY the type, nothing else.`;

    const response = await this.ollama.generate({
      model: this.modelConfig.path,
      prompt,
      options: {
        temperature: 0.2,
        num_predict: 10,
      },
    });

    const type = response.response.trim().toLowerCase();

    // Estimate confidence based on output quality
    const validTypes = ['design', 'code', 'document', 'screenshot', 'photo', 'video', 'audio', 'archive', 'other'];
    let confidence = validTypes.includes(type) ? 0.90 : 0.50;

    // Penalize if response is too verbose (should be single word)
    if (type.split(' ').length > 1) confidence -= 0.3;

    // Bonus if we have content to verify against
    if (content && type === 'code' && /^(function|class|const|import)/.test(content)) {
      confidence += 0.05;
    }

    return { type, confidence: Math.max(0.3, Math.min(1.0, confidence)) };
  }

  /**
   * Estimate confidence based on output quality
   */
  private estimateConfidence(generated: string, original: string): number {
    let confidence = 0.85; // Base confidence for Level 1

    // Penalize if output is too similar to input (model didn't process well)
    if (generated === original.toLowerCase().replace(/\s+/g, '-')) {
      confidence -= 0.2;
    }

    // Penalize if output is too long
    if (generated.split('-').length > 5) {
      confidence -= 0.1;
    }

    // Penalize if output contains weird characters
    if (!/^[a-z0-9-]+$/.test(generated)) {
      confidence -= 0.15;
    }

    // Bonus if output looks clean
    if (generated.length > 10 && generated.length < 40 && /^[a-z0-9-]+$/.test(generated)) {
      confidence += 0.05;
    }

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  /**
   * Estimate confidence for JSON-based responses
   */
  private estimateJSONConfidence(
    rawResponse: string,
    parsed: any,
    options?: {
      requiredFields?: string[];
      minSuggestions?: number;
    }
  ): number {
    let confidence = 0.80; // Base for Level 1

    // Check if response has uncertainty markers
    if (rawResponse.toLowerCase().includes('not sure') ||
        rawResponse.toLowerCase().includes('maybe') ||
        rawResponse.toLowerCase().includes('unclear')) {
      confidence -= 0.25;
    }

    // Check required fields are present
    if (options?.requiredFields) {
      const missingFields = options.requiredFields.filter(f => !parsed[f]);
      confidence -= missingFields.length * 0.15;
    }

    // Check array lengths if specified
    if (options?.minSuggestions && parsed.suggestions) {
      if (parsed.suggestions.length < options.minSuggestions) {
        confidence -= 0.20;
      } else if (parsed.suggestions.length >= 3) {
        confidence += 0.05; // Bonus for detailed output
      }
    }

    // Bonus if output is well-structured
    if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      confidence += 0.05;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  /**
   * Clean JSON response from LLM (remove markdown, extra text)
   */
  private cleanJSONResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return cleaned.trim();
  }

  /**
   * Check if model is loaded and ready
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
   * Load model into memory
   */
  async load(): Promise<void> {
    // Trigger model load by running a tiny inference
    await this.ollama.generate({
      model: this.modelConfig.path,
      prompt: 'hello',
      options: { num_predict: 1 },
    });
  }

  /**
   * Unload model from memory
   */
  async unload(): Promise<void> {
    // Ollama doesn't have explicit unload, but we can call keep_alive: 0
    await this.ollama.generate({
      model: this.modelConfig.path,
      prompt: '',
      keep_alive: 0,
    });
  }
}
