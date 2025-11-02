/**
 * @what Auto-discover and register tinyArms skills from skills/ directory
 * @why Provide skill lookup for CLI and MCP server integration
 * @exports SkillRegistry, getSkillRegistry, resetSkillRegistry
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSkillMetadata, loadSkillConfig } from './skill-loader.js'
import type { Skill, SkillMetadata } from './types.js'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = path.dirname(currentFilePath)

/**
 * Skill registry singleton
 */
export class SkillRegistry {
  private skills: Map<string, Skill> = new Map()
  private skillsDir: string

  constructor(skillsDir?: string) {
    // Default to apps/tinyArms/skills/
    this.skillsDir = skillsDir ?? path.resolve(currentDirPath, '../../skills')
  }

  /**
   * Discover all skills in skills/ directory
   * Scans for directories containing SKILL.md
   */
  discoverSkills(): void {
    if (!fs.existsSync(this.skillsDir)) {
      throw new Error(`Skills directory not found: ${this.skillsDir}`)
    }

    const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const skillDir = path.join(this.skillsDir, entry.name)
      const metadata = loadSkillMetadata(skillDir)

      if (!metadata) {
        console.warn(`Skipping ${entry.name}: invalid or missing SKILL.md`)
        continue
      }

      const config = metadata.config_path
        ? loadSkillConfig(metadata.config_path)
        : undefined

      this.skills.set(metadata.name, { metadata, config })
    }

    console.log(`✅ Discovered ${this.skills.size} skills`)
  }

  /**
   * Get skill by name
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name)
  }

  /**
   * Get all registered skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  /**
   * Get all skill names
   */
  getSkillNames(): string[] {
    return Array.from(this.skills.keys())
  }

  /**
   * Get skill metadata only (no config)
   */
  getSkillMetadata(name: string): SkillMetadata | undefined {
    return this.skills.get(name)?.metadata
  }

  /**
   * Check if skill exists
   */
  hasSkill(name: string): boolean {
    return this.skills.has(name)
  }

  /**
   * Get skills by capability
   */
  getSkillsByCapability(capability: 'streaming' | 'batch'): Skill[] {
    return this.getAllSkills().filter((skill) => {
      if (capability === 'streaming') {
        return skill.metadata.supports_streaming
      }
      if (capability === 'batch') {
        return skill.metadata.batch_capable
      }
      return false
    })
  }

  /**
   * Get total token budget across all skills
   */
  getTotalTokenBudget(): number {
    return this.getAllSkills().reduce(
      (sum, skill) => sum + skill.metadata.token_budget,
      0
    )
  }
}

/**
 * Global registry instance
 */
let globalRegistry: SkillRegistry | null = null

/**
 * Get or create global skill registry
 */
export function getSkillRegistry(skillsDir?: string): SkillRegistry {
  if (!globalRegistry) {
    globalRegistry = new SkillRegistry(skillsDir)
    globalRegistry.discoverSkills()
  }
  return globalRegistry
}

/**
 * Reset global registry (for testing)
 */
export function resetSkillRegistry(): void {
  globalRegistry = null
}
