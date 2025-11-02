/**
 * Ollama SDK wrapper for model inference
 * Location: apps/tinyArms/src/linting/ollama-client.ts
 *
 * @what Lightweight wrapper around Ollama SDK for model inference
 * @why Encapsulates Ollama API calls with error handling and type safety
 * @exports OllamaClient class
 */

import { Ollama } from 'ollama';
import type { GenerateOptions } from '@/types.js';

export class OllamaClient {
  private ollama = new Ollama();

  constructor(private modelName: string) {}

  async generate(opts: GenerateOptions): Promise<string> {
    try {
      const response = await this.ollama.generate({
        model: this.modelName,
        prompt: opts.prompt,
        system: opts.system,
        stream: false,
        format: 'json',
      });

      return response.response;
    } catch (error) {
      throw new Error(`Ollama generation failed: ${error}`);
    }
  }
}
