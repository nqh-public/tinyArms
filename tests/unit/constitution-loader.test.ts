import path from 'path';
import { describe, it, expect } from 'vitest';
import { ConstitutionLoader } from '../../src/linting/constitution-loader';

describe('ConstitutionLoader', () => {
  const testPrinciplesPath = path.join(__dirname, '../fixtures/test-principles.md');

  it('should load constitution from custom path', async () => {
    const loader = new ConstitutionLoader();
    const content = await loader.load(testPrinciplesPath);
    expect(content).toContain('Core Principles');
    expect(content.length).toBeGreaterThan(100);
  });

  it('should throw error if constitution not found', async () => {
    const loader = new ConstitutionLoader();
    await expect(loader.load('/invalid/path/constitution.md')).rejects.toThrow();
  });
});
