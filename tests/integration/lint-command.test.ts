import { describe, it, expect, beforeAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

describe('tinyarms lint command', () => {
  const testFile = path.join('/tmp', 'tinyarms-test.ts');

  beforeAll(async () => {
    // Create test file with violations
    await fs.writeFile(testFile, `const timeout = 5000;`);
  });

  it('should lint file and return JSON output', async () => {
    const { stdout } = await execAsync(
      `cd /Users/huy/CODES/nqh/apps/tinyArms && npx tsx src/cli.ts lint ${testFile}`
    );

    const json = JSON.parse(stdout);

    expect(json.violations).toBeDefined();
    expect(Array.isArray(json.violations)).toBe(true);
    expect(json.summary).toBeDefined();
    expect(json.confidence).toBeGreaterThan(0);
    expect(json.model).toBe('qwen2.5-coder:3b-instruct');
    expect(json.latencyMs).toBeGreaterThan(0);
  }, 60000); // 60s timeout for full CLI execution
});
