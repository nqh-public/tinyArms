import { describe, it, expect } from 'vitest';
import { OllamaClient } from '../../src/linting/ollama-client';

describe('OllamaClient', () => {
  it('should create client with model name', () => {
    const client = new OllamaClient('qwen2.5-coder:3b-instruct');
    expect(client).toBeDefined();
  });

  it('should generate response from prompt', async () => {
    const client = new OllamaClient('qwen2.5-coder:3b-instruct');
    const response = await client.generate({
      prompt: 'Return JSON: {"test": true}',
      system: 'You return JSON only'
    });
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  }, 30000); // 30s timeout for model inference
});
