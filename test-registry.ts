/**
 * @what Test script for skill registry discovery
 * @why Validate skill auto-discovery and metadata parsing
 * @usage npx tsx test-registry.ts
 */

import { getSkillRegistry } from './src/skills/index.js';

try {
  console.log('🔍 Testing skill registry...\n');

  const registry = getSkillRegistry();
  const skillNames = registry.getSkillNames();

  console.log('✅ Skills discovered:', skillNames.length);
  console.log('   Names:', skillNames.join(', '));
  console.log('   Total token budget:', registry.getTotalTokenBudget().toLocaleString(), '\n');

  // Test code-linting-fast skill
  const skill = registry.getSkill('code-linting-fast');
  if (skill) {
    console.log('📖 code-linting-fast metadata:');
    console.log('   Description:', skill.metadata.description);
    console.log('   Token budget:', skill.metadata.token_budget.toLocaleString());
    console.log('   Streaming:', skill.metadata.supports_streaming ? 'Yes' : 'No');
    console.log('   Batch capable:', skill.metadata.batch_capable ? 'Yes' : 'No');
    console.log('   SKILL.md path:', skill.metadata.skill_md_path);
    console.log('\n✅ All tests passed!');
  } else {
    console.error('❌ code-linting-fast not found');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}
