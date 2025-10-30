#!/usr/bin/env node
/**
 * tinyArms CLI entry point
 * Location: apps/tinyArms/src/cli.ts
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import { ModelChecker } from './utils/model-checker';
import { ConstitutionLoader } from './linting/constitution-loader';
import { OllamaClient } from './linting/ollama-client';
import { Linter } from './linting/linter';
import { Logger } from './logging/logger';

const program = new Command();

program
  .name('tinyarms')
  .description('🦖 Tiny AI models with helping arms - local automation')
  .version('0.1.0');

program
  .command('lint <file>')
  .description('Lint code against constitutional principles')
  .option('--constitution <path>', 'Custom constitution path')
  .action(async (filePath: string, options: { constitution?: string }) => {
    try {
      console.error('🦖 tinyArms constitutional linter\n');

      // 1. Check/pull model
      console.error('Checking Qwen2.5-Coder-3B...');
      const checker = new ModelChecker();
      await checker.pullModelIfNeeded('qwen2.5-coder:3b-instruct');

      // 2. Load constitution
      console.error('Loading constitution...');
      const loader = new ConstitutionLoader();
      const constitution = await loader.load(options.constitution);

      // 3. Read target file
      console.error(`Reading ${filePath}...\n`);
      const code = await fs.readFile(filePath, 'utf-8');

      // 4. Run linting
      console.error('Analyzing code...');
      const client = new OllamaClient('qwen2.5-coder:3b-instruct');
      const linter = new Linter(client);
      const result = await linter.lint(code, constitution);

      // 5. Output JSON to stdout (stderr for logging above)
      console.log(JSON.stringify(result, null, 2));

      // 6. Log execution
      const exitCode = result.violations.length > 0 ? 1 : 0;
      Logger.logLintExecution(filePath, result, exitCode);
      Logger.close();

      // Exit with error code if violations found
      if (result.violations.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error: ${errorMessage}`);

      // Log error execution
      try {
        const dummyResult = {
          violations: [],
          summary: `Error: ${errorMessage}`,
          confidence: 0,
          model: 'qwen2.5-coder:3b-instruct',
          latencyMs: 0,
        };
        Logger.logLintExecution(filePath, dummyResult, 1, errorMessage);
        Logger.close();
      } catch {
        // Ignore logging errors during error handling
      }

      process.exit(1);
    }
  });

program.parse();
