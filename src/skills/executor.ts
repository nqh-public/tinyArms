// src/skills/executor.ts
import { TieredRouter } from '../router/tiered-router';
import { Config, SkillResult, SkillStats } from '../types';
import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';
import { promisify } from 'util';

const globAsync = promisify(glob);

/**
 * Skill Executor
 * 
 * Orchestrates skill execution:
 * 1. Gather inputs (files, data)
 * 2. Batch if needed
 * 3. Route through TieredRouter
 * 4. Collect and format results
 */

export class SkillExecutor {
  constructor(
    private router: TieredRouter,
    private config: Config
  ) {}

  /**
   * Execute a skill with given inputs
   */
  async execute(
    skillName: string,
    inputs: string[],
    options: {
      dryRun?: boolean;
      verbose?: boolean;
    } = {}
  ): Promise<SkillResult> {
    const startTime = Date.now();
    const skillConfig = this.config.skills[skillName];

    if (!skillConfig) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    if (!skillConfig.enabled) {
      return {
        status: 'skipped',
        skill: skillName,
        timestamp: new Date().toISOString(),
        results: [],
        stats: {
          total_items: 0,
          processed: 0,
          skipped: 0,
          errors: 0,
          duration_ms: Date.now() - startTime,
        },
      };
    }

    try {
      // Gather files/data based on skill type
      const items = await this.gatherInputs(skillName, inputs);

      if (options.verbose) {
        console.log(`Found ${items.length} items to process`);
      }

      // Process items
      const results = await this.processItems(
        skillName,
        items,
        options
      );

      // Calculate statistics
      const stats: SkillStats = {
        total_items: items.length,
        processed: results.filter(r => r.status === 'success').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
        duration_ms: Date.now() - startTime,
      };

      return {
        status: stats.errors > 0 ? 'error' : 'success',
        skill: skillName,
        timestamp: new Date().toISOString(),
        results,
        stats,
      };
    } catch (error) {
      return {
        status: 'error',
        skill: skillName,
        timestamp: new Date().toISOString(),
        results: [],
        stats: {
          total_items: 0,
          processed: 0,
          skipped: 0,
          errors: 1,
          duration_ms: Date.now() - startTime,
        },
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Gather inputs based on skill and paths provided
   */
  private async gatherInputs(
    skillName: string,
    inputs: string[]
  ): Promise<any[]> {
    const skillConfig = this.config.skills[skillName];

    switch (skillName) {
      case 'file-naming': {
        // Gather files from provided paths or watch paths
        const paths = inputs.length > 0 ? inputs : skillConfig.watch_paths || [];
        const files: string[] = [];

        for (const p of paths) {
          const expanded = p.replace('~', process.env.HOME || '');
          
          // Check if path is a directory or glob pattern
          if (p.includes('*')) {
            const matches = await globAsync(expanded);
            files.push(...matches);
          } else {
            try {
              const stat = await fs.stat(expanded);
              if (stat.isDirectory()) {
                // Get all files in directory (non-recursive)
                const dirFiles = await fs.readdir(expanded);
                files.push(...dirFiles.map(f => path.join(expanded, f)));
              } else {
                files.push(expanded);
              }
            } catch {
              // Path doesn't exist, skip
            }
          }
        }

        // Filter out already well-named files
        return files.filter(f => this.shouldRename(f));
      }

      case 'code-linting': {
        // Gather code files
        const paths = inputs.length > 0 ? inputs : [process.cwd()];
        const files: string[] = [];

        for (const p of paths) {
          const expanded = p.replace('~', process.env.HOME || '');
          
          if (p.includes('*')) {
            const matches = await globAsync(expanded);
            files.push(...matches.filter(f => this.isCodeFile(f)));
          } else {
            try {
              const stat = await fs.stat(expanded);
              if (stat.isDirectory()) {
                // Find all code files recursively
                const codeFiles = await globAsync(path.join(expanded, '**/*.{ts,tsx,js,jsx,py}'));
                files.push(...codeFiles);
              } else if (this.isCodeFile(expanded)) {
                files.push(expanded);
              }
            } catch {
              // Skip
            }
          }
        }

        return files;
      }

      case 'markdown-analysis': {
        // Gather markdown files from watch paths
        const paths = skillConfig.watch_paths || [];
        const files: string[] = [];

        for (const p of paths) {
          const expanded = p.replace('~', process.env.HOME || '');
          const mdFiles = await globAsync(path.join(expanded, '**/*.md'));
          files.push(...mdFiles);
        }

        // Check which files changed recently (git diff or mtime)
        const changedFiles = await this.getChangedMarkdownFiles(files);
        return changedFiles;
      }

      default:
        return inputs;
    }
  }

  /**
   * Process items through router
   */
  private async processItems(
    skillName: string,
    items: any[],
    options: { dryRun?: boolean; verbose?: boolean }
  ): Promise<any[]> {
    const results: any[] = [];
    const batchSize = this.config.skills[skillName].batch_size || 1;

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      for (const item of batch) {
        try {
          const result = await this.processItem(skillName, item, options);
          results.push(result);
        } catch (error) {
          results.push({
            status: 'error',
            item,
            error: (error as Error).message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Process single item
   */
  private async processItem(
    skillName: string,
    item: any,
    options: { dryRun?: boolean; verbose?: boolean }
  ): Promise<any> {
    switch (skillName) {
      case 'file-naming': {
        const filePath = item;
        const routerInput = {
          skill: 'file-naming',
          data: {
            filePath,
            context: path.basename(filePath),
          },
        };

        const routerResult = await this.router.route(routerInput);

        if (routerResult.confidence < 0.75) {
          return {
            status: 'needs_review',
            original: filePath,
            suggested: routerResult.output.newName,
            confidence: routerResult.confidence,
          };
        }

        // Apply rename (unless dry run)
        if (!options.dryRun && routerResult.output.newName) {
          const newPath = path.join(
            routerResult.output.destination || path.dirname(filePath),
            routerResult.output.newName
          );
          await fs.rename(filePath, newPath);
        }

        return {
          status: 'success',
          original: path.basename(filePath),
          renamed: routerResult.output.newName,
          destination: routerResult.output.destination,
          confidence: routerResult.confidence,
          level: routerResult.level,
        };
      }

      case 'code-linting': {
        const filePath = item;
        const code = await fs.readFile(filePath, 'utf-8');
        const constitutionPath = this.config.skills['code-linting'].constitution_path;

        const routerInput = {
          skill: 'code-linting',
          data: {
            filePath,
            code,
          },
          context: {
            constitutionPath,
          },
        };

        const routerResult = await this.router.route(routerInput);

        return {
          status: 'success',
          file: filePath,
          issues: routerResult.output.issues,
          summary: routerResult.output.summary,
          confidence: routerResult.confidence,
          level: routerResult.level,
        };
      }

      case 'markdown-analysis': {
        // Get file changes
        const changes = await this.getFileChanges(item);

        const routerInput = {
          skill: 'markdown-analysis',
          data: {
            changes: [
              {
                file: item,
                additions: changes.additions,
                deletions: changes.deletions,
              },
            ],
          },
        };

        const routerResult = await this.router.route(routerInput);

        return {
          status: 'success',
          file: item,
          summary: routerResult.output.summary,
          suggestions: routerResult.output.suggestions,
          confidence: routerResult.confidence,
          level: routerResult.level,
        };
      }

      default:
        throw new Error(`Unknown skill: ${skillName}`);
    }
  }

  /**
   * Check if file should be renamed
   */
  private shouldRename(filePath: string): boolean {
    const basename = path.basename(filePath);

    // Skip hidden files
    if (basename.startsWith('.')) return false;

    // Skip already well-named files
    if (/^[a-z0-9-]+\.[a-z0-9]+$/.test(basename)) return false;

    // Needs renaming if it has patterns we want to remove
    const patternsToRemove = this.config.rules.filename_patterns.remove;
    return patternsToRemove.some(pattern => 
      new RegExp(pattern, 'i').test(basename)
    );
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.swift', '.java'];
    return codeExtensions.includes(ext);
  }

  /**
   * Get markdown files that changed recently
   */
  private async getChangedMarkdownFiles(files: string[]): Promise<string[]> {
    // Simple implementation: check mtime in last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const changed: string[] = [];

    for (const file of files) {
      try {
        const stat = await fs.stat(file);
        if (stat.mtimeMs > oneDayAgo) {
          changed.push(file);
        }
      } catch {
        // Skip files that can't be accessed
      }
    }

    return changed;
  }

  /**
   * Get file changes (simplified - could use git diff)
   */
  private async getFileChanges(filePath: string): Promise<{
    additions: string[];
    deletions: string[];
  }> {
    // Simplified: Just return recent lines
    // In real implementation, would use git diff or compare with cached version
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Return last 10 lines as "additions" (simplified)
    return {
      additions: lines.slice(-10),
      deletions: [],
    };
  }
}
