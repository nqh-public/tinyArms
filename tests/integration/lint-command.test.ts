import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { describe, it, expect, beforeAll } from 'vitest';

const execAsync = promisify(exec);

describe('tinyarms lint command', () => {
  const testFile = path.join('/tmp', 'tinyarms-test.ts');

  beforeAll(async () => {
    // Create test file with violations
    await fs.writeFile(testFile, `const timeout = 5000;`);
  });

  it('should lint file and return JSON output', async () => {
    const principlesPath = path.join(__dirname, '../fixtures/test-principles.md');
    const { stdout } = await execAsync(
      `cd ${process.cwd()} && npx tsx src/cli.ts lint ${testFile} --constitution ${principlesPath}`
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
