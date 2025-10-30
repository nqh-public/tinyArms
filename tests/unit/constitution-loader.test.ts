import { describe, it, expect } from 'vitest';
import { ConstitutionLoader } from '../../src/linting/constitution-loader';

describe('ConstitutionLoader', () => {
  it('should load constitution from default path', async () => {
    const loader = new ConstitutionLoader();
    const content = await loader.load();
    expect(content).toContain('Core Principles');
    expect(content.length).toBeGreaterThan(1000);
  });

  it('should throw error if constitution not found', async () => {
    const loader = new ConstitutionLoader();
    await expect(loader.load('/invalid/path/constitution.md')).rejects.toThrow();
  });
});
