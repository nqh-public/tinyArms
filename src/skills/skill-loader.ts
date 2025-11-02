/**
 * @what Parse SKILL.md frontmatter and load skill configurations
 * @why Extract metadata from OpenSkills format for registry discovery
 * @exports parseFrontmatter, loadSkillMetadata, loadSkillConfig
 */

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'
import type { SkillFrontmatter, SkillMetadata, SkillConfig } from './types.js'

/**
 * Default token budgets by skill type
 */
const DEFAULT_CODE_LINTING_BUDGET = 15000
const DEFAULT_FILE_NAMING_BUDGET = 5000
const DEFAULT_MARKDOWN_ANALYSIS_BUDGET = 10000
const DEFAULT_AUDIO_ACTIONS_BUDGET = 8000
const DEFAULT_FALLBACK_BUDGET = 10000

const DEFAULT_TOKEN_BUDGETS: Record<string, number> = {
  'code-linting': DEFAULT_CODE_LINTING_BUDGET,
  'file-naming': DEFAULT_FILE_NAMING_BUDGET,
  'markdown-analysis': DEFAULT_MARKDOWN_ANALYSIS_BUDGET,
  'audio-actions': DEFAULT_AUDIO_ACTIONS_BUDGET,
}

/**
 * Parse YAML frontmatter from SKILL.md
 *
 * @param skillMdPath - Absolute path to SKILL.md
 * @returns Parsed frontmatter or null if invalid
 */
export function parseFrontmatter(skillMdPath: string): SkillFrontmatter | null {
  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8')

    // Extract frontmatter between --- markers
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) {
      return null
    }

    const frontmatter = yaml.parse(frontmatterMatch[1]) as SkillFrontmatter

    // Validate required fields
    if (!frontmatter.name || !frontmatter.description) {
      throw new Error(`Missing required fields in ${skillMdPath}`)
    }

    return frontmatter
  } catch (error) {
    console.error(`Failed to parse frontmatter from ${skillMdPath}:`, error)
    return null
  }
}

/**
 * Load skill metadata from SKILL.md
 *
 * @param skillDir - Absolute path to skill directory
 * @returns Skill metadata or null if invalid
 */
export function loadSkillMetadata(skillDir: string): SkillMetadata | null {
  const skillMdPath = path.join(skillDir, 'SKILL.md')

  if (!fs.existsSync(skillMdPath)) {
    return null
  }

  const frontmatter = parseFrontmatter(skillMdPath)
  if (!frontmatter) {
    return null
  }

  // Infer default token budget from skill name
  const defaultBudget = Object.entries(DEFAULT_TOKEN_BUDGETS).find(([key]) =>
    frontmatter.name.startsWith(key)
  )?.[1] ?? DEFAULT_FALLBACK_BUDGET

  const configPath = path.join(skillDir, 'config.yaml')

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    token_budget: frontmatter.token_budget ?? defaultBudget,
    supports_streaming: frontmatter.supports_streaming ?? false,
    batch_capable: frontmatter.batch_capable ?? false,
    config_path: fs.existsSync(configPath) ? configPath : undefined,
    skill_md_path: skillMdPath,
    skill_dir: skillDir,
  }
}

/**
 * Load skill configuration from config.yaml
 *
 * @param configPath - Absolute path to config.yaml
 * @returns Parsed configuration or undefined if missing
 */
export function loadSkillConfig(configPath: string): SkillConfig | undefined {
  if (!fs.existsSync(configPath)) {
    return undefined
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return yaml.parse(content) as SkillConfig
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error)
    return undefined
  }
}
