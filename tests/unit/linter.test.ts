import { describe, it, expect } from 'vitest';
import { Linter } from '../../src/linting/linter';
import { OllamaClient } from '../../src/linting/ollama-client';

describe('Linter', () => {
  const mockConstitution = `
# Constitutional Principles

## Principle I: No Hardcoded Design Values
- NO hardcoded colors: #ff0000, rgb(255,0,0)
- NO hardcoded spacing: 16px, 2rem

## Principle II: Magic Numbers
- Allowed: [0, 1, -1, 2, 12, 16, 24, 60, 100, 1000]
- All others require named constants
`;

  it('should detect hardcoded color violation', async () => {
    const client = new OllamaClient('qwen2.5-coder:3b-instruct');
    const linter = new Linter(client);
    const code = `const style = { color: '#ff0000' };`;

    const result = await linter.lint(code, mockConstitution);

    expect(result.violations).toBeDefined();
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some(v => v.rule.includes('color'))).toBe(true);
  }, 30000);

  it('should detect magic number violation', async () => {
    const client = new OllamaClient('qwen2.5-coder:3b-instruct');
    const linter = new Linter(client);
    const code = `const timeout = 5000;`;

    const result = await linter.lint(code, mockConstitution);

    expect(result.violations).toBeDefined();
    expect(result.violations.some(v => v.rule.includes('magic'))).toBe(true);
  }, 30000);

  it('should return no violations for clean code', async () => {
    const client = new OllamaClient('qwen2.5-coder:3b-instruct');
    const linter = new Linter(client);
    const code = `const PRIMARY_COLOR = tokens.colors.primary;`;

    const result = await linter.lint(code, mockConstitution);

    expect(result.violations).toBeDefined();
    expect(result.summary).toContain('No violations');
  }, 30000);
});
