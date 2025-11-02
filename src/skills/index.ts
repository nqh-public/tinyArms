/**
 * @what Barrel exports for skill registry system
 * @why Single import point for registry, loader, and types
 * @exports All skill registry exports
 */

export {
  SkillRegistry,
  getSkillRegistry,
  resetSkillRegistry,
} from './registry.js'

export {
  parseFrontmatter,
  loadSkillMetadata,
  loadSkillConfig,
} from './skill-loader.js'

export type {
  Skill,
  SkillMetadata,
  SkillFrontmatter,
  SkillConfig,
} from './types.js'
