// src/config/loader.ts
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { Config } from '../types';
import { z } from 'zod';

/**
 * Configuration Loader
 * 
 * Loads, validates, and manages TinyArms configuration
 */

// Zod schema for validation
const ConfigSchema = z.object({
  skills: z.record(z.object({
    enabled: z.boolean(),
    schedule: z.string().optional(),
    trigger: z.enum(['manual', 'scheduled', 'watch']).optional(),
    watch_paths: z.array(z.string()).optional(),
    model: z.string(),
    description: z.string(),
    batch_size: z.number().optional(),
    constitution_path: z.string().optional(),
    max_file_size_kb: z.number().optional(),
    transcription_path: z.string().optional(),
  })),
  system: z.object({
    ollama_host: z.string(),
    log_level: z.enum(['debug', 'info', 'warn', 'error']),
    require_ac_power: z.boolean(),
    max_memory_mb: z.number(),
    notification: z.boolean(),
    models: z.record(z.object({
      path: z.string(),
      context_length: z.number(),
      temperature: z.number(),
    })),
    routing: z.object({
      level0_confidence: z.number(),
      level1_confidence: z.number(),
      level2_confidence: z.number(),
      fallback: z.enum(['ask_user', 'skip', 'error']),
    }),
    cache: z.object({
      enabled: z.boolean(),
      ttl_hours: z.number(),
      max_entries: z.number(),
    }),
    paths: z.object({
      logs: z.string(),
      database: z.string(),
      skills: z.string(),
      cache: z.string(),
    }),
  }),
  rules: z.object({
    file_types: z.record(z.object({
      extensions: z.array(z.string()),
      keywords: z.array(z.string()).optional(),
      source_paths: z.array(z.string()).optional(),
      destination: z.string(),
    })),
    filename_patterns: z.object({
      remove: z.array(z.string()),
      replace: z.array(z.object({
        pattern: z.string(),
        with: z.string(),
      })),
    }),
  }),
});

export class ConfigLoader {
  private static defaultConfigPath = path.join(
    process.env.HOME || '~',
    '.config/tinyarms/config.yaml'
  );

  /**
   * Load configuration from file
   */
  static async load(configPath?: string): Promise<Config> {
    const filePath = configPath || this.defaultConfigPath;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config = yaml.load(content) as Config;

      // Validate
      await this.validate(config);

      // Expand paths
      this.expandPaths(config);

      return config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('Config not found, creating default...');
        return await this.createDefault(filePath);
      }
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  static async validate(config: Config): Promise<void> {
    try {
      ConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`Configuration validation failed:\n${messages.join('\n')}`);
      }
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  static async save(config: Config, configPath?: string): Promise<void> {
    const filePath = configPath || this.defaultConfigPath;

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Convert to YAML
    const content = yaml.dump(config, {
      indent: 2,
      lineWidth: 100,
      noRefs: true,
    });

    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Create default configuration
   */
  static async createDefault(targetPath: string): Promise<Config> {
    // Copy from package's default config
    const defaultConfigPath = path.join(__dirname, '../../config/default.yaml');
    const content = await fs.readFile(defaultConfigPath, 'utf-8');
    const config = yaml.load(content) as Config;

    // Customize for user's home directory
    this.expandPaths(config);

    // Save to user's config directory
    await this.save(config, targetPath);

    console.log(`✓ Created default config at ${targetPath}`);
    return config;
  }

  /**
   * Expand ~ to home directory in all paths
   */
  private static expandPaths(config: Config): void {
    const home = process.env.HOME || '';

    // Expand skill watch paths
    for (const skill of Object.values(config.skills)) {
      if (skill.watch_paths) {
        skill.watch_paths = skill.watch_paths.map(p => p.replace('~', home));
      }
      if (skill.constitution_path) {
        skill.constitution_path = skill.constitution_path.replace('~', home);
      }
      if (skill.transcription_path) {
        skill.transcription_path = skill.transcription_path.replace('~', home);
      }
    }

    // Expand system paths
    config.system.paths.logs = config.system.paths.logs.replace('~', home);
    config.system.paths.database = config.system.paths.database.replace('~', home);
    config.system.paths.skills = config.system.paths.skills.replace('~', home);
    config.system.paths.cache = config.system.paths.cache.replace('~', home);

    // Expand rule file type destinations
    for (const rule of Object.values(config.rules.file_types)) {
      rule.destination = rule.destination.replace('~', home);
      if (rule.source_paths) {
        rule.source_paths = rule.source_paths.map(p => p.replace('~', home));
      }
    }
  }

  /**
   * Get config value by dot notation
   */
  static getValue(config: Config, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], config as any);
  }

  /**
   * Set config value by dot notation
   */
  static setValue(config: Config, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, config as any);
    target[lastKey] = value;
  }

  /**
   * Merge partial config (for updates)
   */
  static merge(base: Config, partial: Partial<Config>): Config {
    return {
      ...base,
      skills: { ...base.skills, ...partial.skills },
      system: { ...base.system, ...partial.system },
      rules: { ...base.rules, ...partial.rules },
    };
  }
}
