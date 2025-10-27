// src/router/tiered-router.ts
import os from 'os';
import { Level0 } from '../levels/level0';
import { Level1 } from '../levels/level1';
import { Level2 } from '../levels/level2';
import { RouterInput, RouterResult, Config } from '../types';
import { RouterCache } from './cache';

/**
 * Tiered Router
 * 
 * Philosophy: Try cheapest/fastest solution first, escalate only when needed
 * 
 * Level 0: Deterministic rules (0ms, 100% accuracy when matched)
 * Level 1: Gemma 3 4B (2-4s, 85-90% accuracy)
 * Level 2: Qwen 7B (10-15s, 88% accuracy - code only)
 * Fallback: Ask user (uncertain cases)
 */

export class TieredRouter {
  private level0: Level0;
  private level1: Level1;
  private level2: Level2;
  private cache: RouterCache;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.level0 = new Level0(config.rules);
    this.level1 = new Level1(
      config.system.models.gemma3,
      config.system.ollama_host
    );
    this.level2 = new Level2(
      config.system.models['qwen-coder'],
      config.system.ollama_host
    );
    this.cache = new RouterCache(
      config.system.cache.enabled,
      config.system.cache.ttl_hours,
      config.system.cache.max_entries
    );
  }

  /**
   * Route a task through the tiered system
   */
  async route(input: RouterInput): Promise<RouterResult> {
    // Check cache first
    const cached = this.cache.get(input);
    if (cached) {
      return { ...cached, cached: true };
    }

    const levels = [
      {
        name: 'Level 0: Deterministic Rules',
        threshold: this.config.system.routing.level0_confidence,
        execute: () => this.tryLevel0(input),
      },
      {
        name: 'Level 1: Gemma 3 4B',
        threshold: this.config.system.routing.level1_confidence,
        execute: () => this.tryLevel1(input),
      },
      {
        name: 'Level 2: Qwen 7B',
        threshold: this.config.system.routing.level2_confidence,
        execute: () => this.tryLevel2(input),
      },
    ];

    // Try each level in order
    for (const level of levels) {
      // Check memory before expensive operations
      if (level.name.includes('Level 1') || level.name.includes('Level 2')) {
        const memoryCheck = this.checkMemoryAvailability(level.name);
        if (!memoryCheck.ok) {
          console.warn(memoryCheck.message);
          continue; // Skip to next level
        }
      }

      const startTime = Date.now();

      try {
        const result = await level.execute();
        const latencyMs = Date.now() - startTime;

        // If confidence meets threshold, return result
        if (result && result.confidence >= level.threshold) {
          const finalResult: RouterResult = {
            output: result.output,
            confidence: result.confidence,
            level: level.name,
            latencyMs,
          };

          // Cache successful results
          this.cache.set(input, finalResult);

          return finalResult;
        }

        // Log escalation
        if (result) {
          console.log(
            `${level.name} confidence ${result.confidence.toFixed(2)} below threshold ${level.threshold}, escalating...`
          );
        }
      } catch (error) {
        console.error(`${level.name} failed:`, error);
        // Continue to next level
      }
    }

    // All levels failed - return fallback
    return this.handleFallback(input);
  }

  /**
   * Level 0: Try deterministic rules
   */
  private async tryLevel0(input: RouterInput): Promise<{ output: any; confidence: number } | null> {
    switch (input.skill) {
      case 'file-naming': {
        const result = this.level0.autoRenameFile(
          input.data.filePath,
          input.data.context
        );
        return result ? { output: result, confidence: result.confidence } : null;
      }

      case 'voice-actions': {
        const cleaned = this.level0.cleanVoiceTranscript(input.data.text);
        if (this.level0.hasSimpleKeywords(cleaned)) {
          const keywords = this.level0.extractKeywords(cleaned);
          return {
            output: { cleaned, keywords, action: 'extract_keywords' },
            confidence: 1.0,
          };
        }
        return null;
      }

      default:
        return null; // No Level 0 handler for this skill
    }
  }

  /**
   * Level 1: Try Gemma 3 4B
   */
  private async tryLevel1(input: RouterInput): Promise<{ output: any; confidence: number } | null> {
    switch (input.skill) {
      case 'file-naming': {
        const result = await this.level1.generateFilename({
          originalName: input.data.filePath,
          fileType: input.data.fileType,
          context: input.data.context,
        });
        
        // Get destination using Level 0 rules
        const typeResult = this.level0.detectFileType(input.data.filePath);
        const destination = typeResult 
          ? this.level0.mapDirectory(typeResult.type)
          : null;

        return {
          output: {
            newName: result.filename,
            destination,
          },
          confidence: result.confidence,
        };
      }

      case 'markdown-analysis': {
        const result = await this.level1.analyzeMarkdownChanges(input.data.changes);
        return {
          output: result,
          confidence: result.confidence,
        };
      }

      case 'voice-actions': {
        const result = await this.level1.extractIntent(input.data.text);
        return {
          output: result,
          confidence: result.confidence,
        };
      }

      default:
        return null;
    }
  }

  /**
   * Level 2: Try Qwen 7B (code only)
   */
  private async tryLevel2(input: RouterInput): Promise<{ output: any; confidence: number } | null> {
    if (input.skill !== 'code-linting') {
      return null; // Level 2 is only for code
    }

    // Ensure model is loaded
    if (!(await this.level2.isReady())) {
      await this.level2.load();
    }

    const result = await this.level2.lintCode({
      filePath: input.data.filePath,
      code: input.data.code,
      constitutionPath: input.context?.constitutionPath,
    });

    return {
      output: result,
      confidence: result.confidence,
    };
  }

  /**
   * Handle fallback when all levels fail
   */
  private handleFallback(input: RouterInput): RouterResult {
    const fallbackStrategy = this.config.system.routing.fallback;

    switch (fallbackStrategy) {
      case 'ask_user':
        return {
          output: {
            status: 'needs_review',
            message: `I'm not confident about processing this ${input.skill} task. Please review manually.`,
            data: input.data,
          },
          confidence: 0.0,
          level: 'Fallback: Ask User',
          latencyMs: 0,
        };

      case 'skip':
        return {
          output: {
            status: 'skipped',
            message: 'Task skipped due to low confidence',
          },
          confidence: 0.0,
          level: 'Fallback: Skip',
          latencyMs: 0,
        };

      case 'error':
        throw new Error(`All routing levels failed for skill: ${input.skill}`);

      default:
        throw new Error(`Unknown fallback strategy: ${fallbackStrategy}`);
    }
  }

  /**
   * Check if enough memory is available for model loading
   */
  private checkMemoryAvailability(levelName: string): { ok: boolean; message: string } {
    const freeMemGB = os.freemem() / (1024 ** 3);
    const totalMemGB = os.totalmem() / (1024 ** 3);
    const usedMemGB = totalMemGB - freeMemGB;

    // Memory thresholds for each level
    const thresholds = {
      'Level 1': 4.0,  // Need 4GB free for Gemma 3 4B (3GB model + 1GB KV cache)
      'Level 2': 7.0,  // Need 7GB free for Qwen 7B (6GB model + 1GB KV cache)
    };

    const requiredGB = levelName.includes('Level 2')
      ? thresholds['Level 2']
      : thresholds['Level 1'];

    if (freeMemGB < requiredGB) {
      return {
        ok: false,
        message: `⚠️  Low memory: ${freeMemGB.toFixed(1)}GB free, need ${requiredGB}GB for ${levelName}. Skipping to avoid thrashing.`,
      };
    }

    // Additional warning if approaching limit
    if (freeMemGB < requiredGB + 1) {
      console.warn(
        `⚠️  Memory tight: ${freeMemGB.toFixed(1)}GB free (${usedMemGB.toFixed(1)}GB used of ${totalMemGB.toFixed(1)}GB total)`
      );
    }

    return {
      ok: true,
      message: `✓ Memory OK: ${freeMemGB.toFixed(1)}GB free`,
    };
  }

  /**
   * Get routing statistics
   */
  getStats(): {
    cacheHitRate: number;
    levelDistribution: Record<string, number>;
  } {
    return {
      cacheHitRate: this.cache.getHitRate(),
      levelDistribution: this.cache.getLevelDistribution(),
    };
  }

  /**
   * Clear routing cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload models (optional, for faster first run)
   */
  async preloadModels(): Promise<void> {
    console.log('Preloading Gemma 3 4B...');
    await this.level1.load();
    console.log('✓ Gemma 3 4B ready');
  }

  /**
   * Unload heavy models to save memory
   */
  async unloadHeavyModels(): Promise<void> {
    await this.level2.unload();
  }
}
