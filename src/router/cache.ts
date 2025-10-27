// src/router/cache.ts
import crypto from 'crypto';
import { RouterInput, RouterResult } from '../types';

/**
 * Router Cache
 * 
 * Cache routing decisions to avoid redundant AI inference
 * Example: If you rename 20 similar screenshots, cache the first result
 */

interface CacheEntry {
  result: Omit<RouterResult, 'cached'>;
  timestamp: number;
  expiresAt: number;
}

export class RouterCache {
  private cache: Map<string, CacheEntry>;
  private stats: {
    hits: number;
    misses: number;
    levelCounts: Record<string, number>;
  };

  constructor(
    private enabled: boolean,
    private ttlHours: number,
    private maxEntries: number
  ) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      levelCounts: {},
    };
  }

  /**
   * Generate cache key from input
   */
  private getCacheKey(input: RouterInput): string {
    // For file naming: hash based on filename pattern and type
    if (input.skill === 'file-naming') {
      const pattern = this.normalizeFilename(input.data.filePath);
      return crypto
        .createHash('md5')
        .update(`${input.skill}:${pattern}:${input.data.fileType || ''}`)
        .digest('hex');
    }

    // For code linting: hash based on file path and content hash
    if (input.skill === 'code-linting') {
      const contentHash = crypto
        .createHash('md5')
        .update(input.data.code)
        .digest('hex');
      return `${input.skill}:${input.data.filePath}:${contentHash}`;
    }

    // Default: hash the entire input
    return crypto
      .createHash('md5')
      .update(JSON.stringify(input))
      .digest('hex');
  }

  /**
   * Normalize filename to detect similar patterns
   * "Screenshot 2024-10-27.png" → "screenshot-date.png"
   * "IMG_1234.jpg" → "img-number.jpg"
   */
  private normalizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/\d{4}-\d{2}-\d{2}/g, 'date') // Dates
      .replace(/\d{2}:\d{2}:\d{2}/g, 'time') // Times
      .replace(/\d+/g, 'number') // Numbers
      .replace(/[^a-z0-9.-]/g, '-'); // Special chars
  }

  /**
   * Get cached result
   */
  get(input: RouterInput): RouterResult | null {
    if (!this.enabled) return null;

    const key = this.getCacheKey(input);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.result as RouterResult;
  }

  /**
   * Set cache entry
   */
  set(input: RouterInput, result: RouterResult): void {
    if (!this.enabled) return;

    // Don't cache low-confidence results
    if (result.confidence < 0.75) return;

    // Don't cache fallback results
    if (result.level.includes('Fallback')) return;

    const key = this.getCacheKey(input);
    const now = Date.now();
    const expiresAt = now + this.ttlHours * 60 * 60 * 1000;

    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      result: {
        output: result.output,
        confidence: result.confidence,
        level: result.level,
        latencyMs: result.latencyMs,
      },
      timestamp: now,
      expiresAt,
    });

    // Track level statistics
    this.stats.levelCounts[result.level] = 
      (this.stats.levelCounts[result.level] || 0) + 1;
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get distribution of which levels were used
   */
  getLevelDistribution(): Record<string, number> {
    const total = Object.values(this.stats.levelCounts).reduce((a, b) => a + b, 0);
    const distribution: Record<string, number> = {};

    for (const [level, count] of Object.entries(this.stats.levelCounts)) {
      distribution[level] = total > 0 ? count / total : 0;
    }

    return distribution;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      levelCounts: {},
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxEntries,
      hitRate: this.getHitRate(),
      hits: this.stats.hits,
      misses: this.stats.misses,
      levelDistribution: this.getLevelDistribution(),
    };
  }

  /**
   * Clean expired entries (run periodically)
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
