#!/usr/bin/env node
/**
 * tinyArms CLI entry point
 * Location: apps/tinyArms/src/cli.ts
 *
 * @what CLI interface for tinyArms constitutional linting
 * @why Provides command-line access to linting with format control and model management
 * @usage tinyarms lint <file> [--format concise|detailed] [--constitution <path>]
 */

import fs from 'fs/promises';

import { Command } from 'commander';

import { ConstitutionLoader } from './linting/constitution-loader.js';
import { Linter } from './linting/linter.js';
import { OllamaClient } from './linting/ollama-client.js';
import { Logger } from './logging/logger.js';
import { getSkillRegistry } from './skills/index.js';
import { ModelChecker } from './utils/model-checker.js';

const program = new Command();

program
  .name('tinyarms')
  .description('🦖 Tiny AI models with helping arms - local automation')
  .version('0.1.0');

program
  .command('lint <file>')
  .description('Lint code against constitutional principles')
  .option('--constitution <path>', 'Custom constitution path')
  .option('--format <format>', 'Response format: concise or detailed', 'detailed')
  .action(async (filePath: string, options: { constitution?: string; format?: string }) => {
    try {
      console.error('🦖 tinyArms constitutional linter\n');

      // Validate format option
      const format = options.format === 'concise' ? 'concise' : 'detailed';

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
      console.error(`Analyzing code (${format} mode)...`);
      const client = new OllamaClient('qwen2.5-coder:3b-instruct');
      const linter = new Linter(client);
      const result = await linter.lint(code, constitution, format);

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

// Skills management commands
const skillsCommand = program
  .command('skills')
  .description('Manage tinyArms skills');

skillsCommand
  .command('list')
  .description('List all available skills')
  .action(() => {
    try {
      const registry = getSkillRegistry();
      const skills = registry.getAllSkills();

      const NAME_COLUMN_WIDTH = 25;
      const TOKEN_COLUMN_WIDTH = 15;
      const STREAMING_COLUMN_WIDTH = 12;
      const TABLE_WIDTH = 70;

      console.log('\n📚 Available Skills\n');
      console.log('Name'.padEnd(NAME_COLUMN_WIDTH) + 'Token Budget'.padEnd(TOKEN_COLUMN_WIDTH) + 'Streaming'.padEnd(STREAMING_COLUMN_WIDTH) + 'Batch');
      console.log('─'.repeat(TABLE_WIDTH));

      for (const skill of skills) {
        const { metadata } = skill;
        console.log(
          metadata.name.padEnd(NAME_COLUMN_WIDTH) +
          metadata.token_budget.toString().padEnd(TOKEN_COLUMN_WIDTH) +
          (metadata.supports_streaming ? '✅' : '❌').padEnd(STREAMING_COLUMN_WIDTH) +
          (metadata.batch_capable ? '✅' : '❌')
        );
      }

      console.log('\nTotal skills:', skills.length);
      console.log('Total token budget:', registry.getTotalTokenBudget().toLocaleString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${errorMessage}`);
      process.exit(1);
    }
  });

skillsCommand
  .command('info <name>')
  .description('Show detailed information about a skill')
  .action((name: string) => {
    try {
      const registry = getSkillRegistry();
      const skill = registry.getSkill(name);

      if (!skill) {
        console.error(`❌ Skill not found: ${name}`);
        console.error('\nAvailable skills:');
        registry.getSkillNames().forEach(n => console.error(`  - ${n}`));
        process.exit(1);
      }

      const { metadata, config } = skill;

      console.log(`\n📖 ${metadata.name}\n`);
      console.log('Description:', metadata.description);
      console.log('\nCapabilities:');
      console.log('  Token Budget:', metadata.token_budget.toLocaleString());
      console.log('  Streaming:', metadata.supports_streaming ? 'Yes' : 'No');
      console.log('  Batch Processing:', metadata.batch_capable ? 'Yes' : 'No');

      console.log('\nPaths:');
      console.log('  SKILL.md:', metadata.skill_md_path);
      console.log('  Directory:', metadata.skill_dir);
      if (metadata.config_path) {
        console.log('  Config:', metadata.config_path);
      }

      if (config) {
        console.log('\nConfiguration:');
        console.log('  Enabled:', config.enabled ? 'Yes' : 'No');
        if (config.model) {
          console.log('  Model:', config.model);
        }
        if (config.schedule) {
          console.log('  Schedule:', config.schedule);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${errorMessage}`);
      process.exit(1);
    }
  });

program.parse();
