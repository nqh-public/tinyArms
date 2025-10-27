// src/levels/level0.ts
import path from 'path';
import { RulesConfig, FileTypeRule } from '../types';

/**
 * Level 0: Deterministic Rules
 * 
 * No AI needed - pure logic and pattern matching.
 * Target: 60-75% of tasks handled here
 * Speed: <1ms per operation
 * Accuracy: 100% (when rules match)
 */

export class Level0 {
  constructor(private rules: RulesConfig) {}

  /**
   * Format filename using deterministic rules
   */
  formatFilename(text: string): string {
    let cleaned = text.toLowerCase();

    // Remove unwanted patterns
    for (const pattern of this.rules.filename_patterns.remove) {
      cleaned = cleaned.replace(new RegExp(pattern, 'gi'), '');
    }

    // Apply replacements
    for (const replacement of this.rules.filename_patterns.replace) {
      cleaned = cleaned.replace(
        new RegExp(replacement.pattern, 'g'),
        replacement.with
      );
    }

    return cleaned.trim();
  }

  /**
   * Extract keywords using RAKE algorithm (no ML)
   */
  extractKeywords(text: string, maxKeywords = 5): string[] {
    // Simple implementation - split by common words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'um', 'uh'
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Count frequency
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // Sort by frequency and return top N
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Detect file type from extension and path
   */
  detectFileType(filePath: string): { type: string; confidence: number } | null {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();
    const dirPath = path.dirname(filePath);

    for (const [type, rule] of Object.entries(this.rules.file_types)) {
      // Check extension match
      if (rule.extensions.includes(ext)) {
        // Check if source path matches (if specified)
        if (rule.source_paths) {
          const matchesPath = rule.source_paths.some(p => 
            dirPath.includes(p.replace('~', process.env.HOME || ''))
          );
          if (!matchesPath) continue;
        }

        // Check keywords in filename
        if (rule.keywords) {
          const hasKeyword = rule.keywords.some(kw => 
            fileName.includes(kw.toLowerCase())
          );
          if (hasKeyword) {
            return { type, confidence: 1.0 };
          }
        }

        return { type, confidence: 0.9 };
      }
    }

    return null;
  }

  /**
   * Map file type to destination directory
   */
  mapDirectory(fileType: string): string | null {
    const rule = this.rules.file_types[fileType];
    if (!rule) return null;

    return rule.destination.replace('~', process.env.HOME || '');
  }

  /**
   * Infer destination from current path (keep well-organized files)
   */
  inferDirectory(sourcePath: string, fileType: string): string {
    const expandedPath = sourcePath.replace('~', process.env.HOME || '');
    
    // If file is in a project directory, keep it there
    const wellOrganizedPaths = [
      '/Projects/',
      '/CODES/',
      '/Documents/',
      '/Work/'
    ];

    for (const orgPath of wellOrganizedPaths) {
      if (expandedPath.includes(orgPath) && !expandedPath.includes('/Downloads') && !expandedPath.includes('/Desktop')) {
        return path.dirname(expandedPath);
      }
    }

    // Otherwise use type-based routing
    return this.mapDirectory(fileType) || path.dirname(expandedPath);
  }

  /**
   * Clean voice transcript (remove filler words)
   */
  cleanVoiceTranscript(text: string): string {
    const fillers = [
      'um', 'uh', 'like', 'you know', 'sort of', 'kind of',
      'basically', 'actually', 'literally', 'i mean', 'you see'
    ];

    let cleaned = text;
    for (const filler of fillers) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }

    // Clean up multiple spaces
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  /**
   * Generate filename from keywords
   */
  generateFilename(keywords: string[], extension?: string): string {
    const formatted = keywords
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .trim();

    return extension ? `${formatted}${extension}` : formatted;
  }

  /**
   * Check if text matches simple patterns (no AI needed)
   */
  hasSimpleKeywords(text: string): boolean {
    const keywords = this.extractKeywords(text);
    return keywords.length >= 2; // Need at least 2 keywords for meaningful naming
  }

  /**
   * Complete file naming workflow using only rules
   * Returns null if AI is needed (escalate to Level 1)
   */
  autoRenameFile(filePath: string, context?: string): { 
    newName: string; 
    destination: string; 
    confidence: number;
  } | null {
    // Detect file type
    const typeResult = this.detectFileType(filePath);
    if (!typeResult) return null; // Need AI to classify

    // Extract keywords from filename or context
    const text = context || path.basename(filePath, path.extname(filePath));
    
    if (!this.hasSimpleKeywords(text)) return null; // Need AI for complex names

    const keywords = this.extractKeywords(text);
    const extension = path.extname(filePath);
    const newName = this.generateFilename(keywords, extension);
    const destination = this.inferDirectory(filePath, typeResult.type);

    return {
      newName,
      destination,
      confidence: typeResult.confidence
    };
  }
}
