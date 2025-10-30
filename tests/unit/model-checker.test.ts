import { describe, it, expect } from 'vitest';
import { ModelChecker } from '../../src/utils/model-checker';

describe('ModelChecker', () => {
  it('should detect if qwen2.5-coder:3b-instruct is available', async () => {
    const checker = new ModelChecker();
    const isAvailable = await checker.isModelAvailable('qwen2.5-coder:3b-instruct');
    expect(typeof isAvailable).toBe('boolean');
  });

  it('should list available models', async () => {
    const checker = new ModelChecker();
    const models = await checker.listModels();
    expect(Array.isArray(models)).toBe(true);
  });
});
