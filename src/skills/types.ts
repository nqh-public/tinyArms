/**
 * @what Type definitions for tinyArms skill registry system
 * @why Enable auto-discovery and metadata tracking for skills
 * @exports SkillMetadata, SkillFrontmatter, SkillConfig, Skill
 */

/**
 * Skill metadata extracted from SKILL.md frontmatter
 */
export interface SkillMetadata {
  /** Unique skill identifier (e.g., "code-linting-fast") */
  name: string

  /** Human-readable description (e.g., "Constitutional code review") */
  description: string

  /** Maximum tokens per execution (5k-25k) */
  token_budget: number

  /** Supports streaming progress updates for long operations */
  supports_streaming: boolean

  /** Can process multiple inputs in one execution */
  batch_capable: boolean

  /** Absolute path to config.yaml (if exists) */
  config_path?: string

  /** Absolute path to SKILL.md */
  skill_md_path: string

  /** Absolute path to skill directory */
  skill_dir: string
}

/**
 * SKILL.md frontmatter structure
 */
export interface SkillFrontmatter {
  name: string
  description: string
  token_budget?: number
  supports_streaming?: boolean
  batch_capable?: boolean
}

/**
 * Skill configuration loaded from config.yaml
 */
export interface SkillConfig {
  enabled: boolean
  model?: string
  schedule?: string
  watch_paths?: string[]
  [key: string]: unknown
}

/**
 * Complete skill information (metadata + config)
 */
export interface Skill {
  metadata: SkillMetadata
  config?: SkillConfig
}
