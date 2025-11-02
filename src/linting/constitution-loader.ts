/**
 * @what Loads and filters design principles for AI-based code linting
 * @why Pre-commit hooks handle syntax/formatting; this loads principles for semantic analysis
 * @exports ConstitutionLoader class
 *
 * Pre-commit already enforces:
 * - TypeScript errors
 * - ESLint import aliases
 * - File size >350 LOC
 * - Prettier formatting
 *
 * This loads OTHER principles for AI linting (DRY, Architecture-First, etc.)
 */

import fs from 'fs/promises';
import path from 'path';

export class ConstitutionLoader {
  private defaultPath = path.join(
    process.env.HOME!,
    '.tinyarms/principles.md'
  );

  async load(customPath?: string): Promise<string> {
    const filePath = customPath || this.defaultPath;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.filterForAILinting(content);
    } catch (error) {
      throw new Error(`Failed to load constitution from ${filePath}: ${error}`);
    }
  }

  /**
   * Extract principles NOT enforced by pre-commit hooks
   * Focus: DRY, Architecture-First, Component patterns, Universal Reusability
   */
  private filterForAILinting(content: string): string {
    // For Week 1: Return full constitution (will optimize in Week 2)
    // TODO: Extract specific principles (III, IV, XVII) that need AI analysis
    return content;
  }
}
