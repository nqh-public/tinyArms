#!/usr/bin/env node
// src/cli.ts
import { Command } from 'commander';
import { TieredRouter } from './router/tiered-router';
import { ConfigLoader } from './config/loader';
import { Database } from './database/db';
import { SkillExecutor } from './skills/executor';
import path from 'path';
import fs from 'fs/promises';

const program = new Command();

program
  .name('tinyarms')
  .description('🦖 TinyArms - Tiny AI models with helping arms')
  .version('0.1.0');

/**
 * RUN COMMAND
 * Execute a skill manually or via agent
 */
program
  .command('run <skill>')
  .description('Run a skill')
  .argument('[paths...]', 'Files or directories to process')
  .option('--dry-run', 'Preview changes without applying')
  .option('--json', 'Output results as JSON')
  .option('-v, --verbose', 'Verbose output')
  .option('-c, --config <path>', 'Custom config file')
  .action(async (skill: string, paths: string[], options) => {
    try {
      const config = await ConfigLoader.load(options.config);
      const router = new TieredRouter(config);
      const executor = new SkillExecutor(router, config);
      const db = new Database(config.system.paths.database);

      // Initialize
      await db.init();

      // Execute skill
      const result = await executor.execute(skill, paths, {
        dryRun: options.dryRun,
        verbose: options.verbose,
      });

      // Save to database (unless dry run)
      if (!options.dryRun) {
        await db.saveTaskHistory({
          skill,
          timestamp: new Date().toISOString(),
          status: result.status,
          input: JSON.stringify(paths),
          output: JSON.stringify(result.results),
          level: 'multiple',
          confidence: 0,
          duration_ms: result.stats.duration_ms,
        });
      }

      // Output results
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printSkillResult(result, options.dryRun);
      }

      process.exit(result.status === 'success' ? 0 : 1);
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * STATUS COMMAND
 * Show system status
 */
program
  .command('status')
  .description('Show system status')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.load();
      const router = new TieredRouter(config);
      const db = new Database(config.system.paths.database);

      await db.init();

      const status = {
        ollama: await checkOllamaStatus(config.system.ollama_host),
        models: await checkModelsStatus(config),
        cache: router.getStats(),
        recentTasks: await db.getRecentTasks(5),
        memory: process.memoryUsage(),
      };

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        printStatus(status);
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * HISTORY COMMAND
 * View task history
 */
program
  .command('history')
  .description('View task history')
  .option('--last <n>', 'Show last N tasks', '10')
  .option('--skill <name>', 'Filter by skill')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.load();
      const db = new Database(config.system.paths.database);
      await db.init();

      const tasks = await db.getTaskHistory({
        limit: parseInt(options.last),
        skill: options.skill,
      });

      if (options.json) {
        console.log(JSON.stringify(tasks, null, 2));
      } else {
        printTaskHistory(tasks);
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * LOGS COMMAND
 * View logs for a skill or all logs
 */
program
  .command('logs')
  .description('View logs')
  .option('--skill <name>', 'Show logs for specific skill')
  .option('--tail <n>', 'Show last N lines', '50')
  .option('--follow', 'Follow log output (like tail -f)')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.load();
      const logPath = options.skill
        ? path.join(config.system.paths.logs, `${options.skill}.log`)
        : path.join(config.system.paths.logs, 'tinyarms.log');

      if (options.follow) {
        // TODO: Implement log following
        console.log('Following logs (Ctrl+C to stop)...');
        console.log(`tail -f ${logPath}`);
      } else {
        const content = await fs.readFile(logPath, 'utf-8');
        const lines = content.split('\n');
        const tailCount = parseInt(options.tail);
        const tailedLines = lines.slice(-tailCount);
        console.log(tailedLines.join('\n'));
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * CONFIG COMMAND
 * Manage configuration
 */
program
  .command('config')
  .description('Manage configuration')
  .argument('<action>', 'Action: get, set, validate, show')
  .argument('[key]', 'Config key (dot notation, e.g., skills.file-naming.enabled)')
  .argument('[value]', 'Value to set')
  .option('--json', 'Output as JSON')
  .action(async (action: string, key?: string, value?: string, options?) => {
    try {
      const config = await ConfigLoader.load();

      switch (action) {
        case 'get':
          if (!key) throw new Error('Key required for get action');
          const val = getNestedValue(config, key);
          if (options.json) {
            console.log(JSON.stringify({ value: val }, null, 2));
          } else {
            console.log(val);
          }
          break;

        case 'set':
          if (!key || value === undefined) {
            throw new Error('Key and value required for set action');
          }
          setNestedValue(config, key, value);
          await ConfigLoader.save(config);
          console.log(`✓ Set ${key} = ${value}`);
          break;

        case 'validate':
          await ConfigLoader.validate(config);
          console.log('✓ Configuration is valid');
          break;

        case 'show':
          if (options.json) {
            console.log(JSON.stringify(config, null, 2));
          } else {
            printConfig(config);
          }
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * SKILLS COMMAND
 * Manage skills
 */
program
  .command('skills')
  .description('Manage skills')
  .argument('<action>', 'Action: list, info, test, enable, disable')
  .argument('[name]', 'Skill name')
  .option('--json', 'Output as JSON')
  .action(async (action: string, name?: string, options?) => {
    try {
      const config = await ConfigLoader.load();

      switch (action) {
        case 'list':
          const skills = Object.entries(config.skills).map(([name, cfg]) => ({
            name,
            enabled: cfg.enabled,
            trigger: cfg.trigger || 'scheduled',
            description: cfg.description,
          }));

          if (options.json) {
            console.log(JSON.stringify(skills, null, 2));
          } else {
            printSkillsList(skills);
          }
          break;

        case 'info':
          if (!name) throw new Error('Skill name required');
          const skillConfig = config.skills[name];
          if (!skillConfig) throw new Error(`Skill not found: ${name}`);

          if (options.json) {
            console.log(JSON.stringify(skillConfig, null, 2));
          } else {
            printSkillInfo(name, skillConfig);
          }
          break;

        case 'test':
          if (!name) throw new Error('Skill name required');
          console.log(`Testing skill: ${name}...`);
          // TODO: Implement skill testing
          break;

        case 'enable':
        case 'disable':
          if (!name) throw new Error('Skill name required');
          config.skills[name].enabled = action === 'enable';
          await ConfigLoader.save(config);
          console.log(`✓ ${name} ${action}d`);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * MODELS COMMAND
 * Manage Ollama models
 */
program
  .command('models')
  .description('Manage models')
  .argument('<action>', 'Action: list, load, unload, info')
  .argument('[model]', 'Model name')
  .option('--json', 'Output as JSON')
  .action(async (action: string, model?: string, options?) => {
    try {
      const config = await ConfigLoader.load();
      const { Ollama } = await import('ollama');
      const ollama = new Ollama({ host: config.system.ollama_host });

      switch (action) {
        case 'list':
          const models = await ollama.list();
          if (options.json) {
            console.log(JSON.stringify(models, null, 2));
          } else {
            printModelsList(models.models);
          }
          break;

        case 'load':
          if (!model) throw new Error('Model name required');
          console.log(`Loading ${model}...`);
          await ollama.generate({ model, prompt: 'hello', options: { num_predict: 1 } });
          console.log(`✓ ${model} loaded`);
          break;

        case 'unload':
          if (!model) throw new Error('Model name required');
          await ollama.generate({ model, prompt: '', keep_alive: 0 });
          console.log(`✓ ${model} unloaded`);
          break;

        case 'info':
          if (!model) throw new Error('Model name required');
          const info = await ollama.show({ model });
          console.log(JSON.stringify(info, null, 2));
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * MCP-SERVER COMMAND
 * Start MCP server for Claude Code integration
 */
program
  .command('mcp-server')
  .description('Start MCP server for Claude Code')
  .option('--port <number>', 'Port to listen on', '3000')
  .action(async (options) => {
    try {
      console.log('🦖 Starting TinyArms MCP server...');
      const { startMCPServer } = await import('./mcp/server');
      const config = await ConfigLoader.load();
      await startMCPServer(config, parseInt(options.port));
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Helper functions
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

async function checkOllamaStatus(host: string): Promise<{ running: boolean; version?: string }> {
  try {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host });
    const models = await ollama.list();
    return { running: true, version: 'unknown' };
  } catch {
    return { running: false };
  }
}

async function checkModelsStatus(config: any): Promise<any> {
  // TODO: Implement model status checking
  return { loaded: [], available: [] };
}

function printSkillResult(result: any, dryRun: boolean): void {
  console.log(`\n🦖 TinyArms - ${result.skill}`);
  console.log(`Status: ${result.status}${dryRun ? ' (dry run)' : ''}`);
  console.log(`\nResults:`);
  
  for (const item of result.results) {
    console.log(`  ${item.original} → ${item.renamed || item.action}`);
  }

  console.log(`\nStats:`);
  console.log(`  Total: ${result.stats.total_items}`);
  console.log(`  Processed: ${result.stats.processed}`);
  console.log(`  Skipped: ${result.stats.skipped}`);
  console.log(`  Errors: ${result.stats.errors}`);
  console.log(`  Duration: ${result.stats.duration_ms}ms`);
}

function printStatus(status: any): void {
  console.log('\n🦖 TinyArms Status\n');
  console.log(`Ollama: ${status.ollama.running ? '● Online' : '○ Offline'}`);
  console.log(`Cache Hit Rate: ${(status.cache.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`Memory: ${(status.memory.heapUsed / 1024 / 1024).toFixed(1)}MB`);
}

function printTaskHistory(tasks: any[]): void {
  console.log('\n🦖 Recent Tasks\n');
  for (const task of tasks) {
    console.log(`${task.timestamp} | ${task.skill} | ${task.status} | ${task.duration_ms}ms`);
  }
}

function printConfig(config: any): void {
  console.log('\n🦖 TinyArms Configuration\n');
  console.log(JSON.stringify(config, null, 2));
}

function printSkillsList(skills: any[]): void {
  console.log('\n🦖 Available Skills\n');
  for (const skill of skills) {
    const status = skill.enabled ? '●' : '○';
    console.log(`${status} ${skill.name} (${skill.trigger})`);
    console.log(`   ${skill.description}`);
  }
}

function printSkillInfo(name: string, config: any): void {
  console.log(`\n🦖 Skill: ${name}\n`);
  console.log(JSON.stringify(config, null, 2));
}

function printModelsList(models: any[]): void {
  console.log('\n🦖 Available Models\n');
  for (const model of models) {
    console.log(`  ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`);
  }
}

program.parse();
