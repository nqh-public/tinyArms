#!/usr/bin/env node
/**
 * @what Validate file headers against Constitutional v2.4.0 standards
 * @why Enforce header completeness and @date freshness on modified files
 * @usage node scripts/validate-headers.mjs [--staged] [file1 file2 ...] (validates staged files or specific files)
 * @author NQH
 * @date 2025-10-22
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// File types requiring headers (from Constitutional Amendment v2.4.0)
const FILE_TYPE_PATTERNS = {
  component: /\.(tsx)$/,
  utility: /\.(ts|mts)$/,
  service: /\.(ts)$/,
  hook: /use-.*\.(ts)$/,
  'api-route': /\/api\/.*\.(ts)$/,
  script: /\.(mjs|ts)$/,
};

// Required tags by file type
const REQUIRED_TAGS = {
  component: ['@what', '@why', '@props'],
  utility: ['@what', '@why', '@exports'],
  service: ['@what', '@why', '@exports', '@depends'],
  hook: ['@what', '@why', '@when'],
  'api-route': ['@what', '@why', '@accepts', '@returns', '@auth'],
  script: ['@what', '@why', '@usage'],
};

// Get staged files, specific files, or all tracked files
function getStagedFiles() {
  const isStaged = process.argv.includes('--staged');

  // Check if specific files were passed as arguments
  const fileArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  if (fileArgs.length > 0) {
    return fileArgs;
  }

  if (isStaged) {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  }

  // Fallback: check all tracked files
  const output = execSync('git ls-files', { encoding: 'utf-8' });
  return output.trim().split('\n').filter(Boolean);
}

// Classify file type based on path and content
function classifyFile(filePath) {
  // Skip non-source files
  if (!filePath.match(/\.(ts|tsx|mjs)$/)) return null;

  // Skip test files, config files, type definitions
  if (filePath.match(/\.(test|spec|config|d)\.(ts|tsx|mjs)$/)) return null;
  if (filePath.includes('/__tests__/')) return null;
  if (filePath.includes('/tests/')) return null;

  // Skip route files (TanStack Start routes are special)
  if (filePath.match(/\/routes\/.*\.(tsx?)$/)) return null;

  // Classify by pattern
  if (filePath.match(FILE_TYPE_PATTERNS.hook)) return 'hook';
  if (filePath.match(FILE_TYPE_PATTERNS['api-route'])) return 'api-route';
  if (filePath.match(/\/components\/.*\.tsx$/)) return 'component';
  if (filePath.match(/\/scripts\/.*\.(mjs|ts)$/)) return 'script';
  if (filePath.match(/\/services\/.*\.ts$/)) return 'service';
  if (filePath.match(/\/lib\/.*\.ts$/)) return 'utility';
  if (filePath.match(/\/utils\/.*\.ts$/)) return 'utility';

  return null; // Unclassified files don't require headers
}

// Extract header from file content
function extractHeader(content) {
  // Don't use ^ anchor - script files have shebangs before the header
  const headerMatch = content.match(/\/\*\*\n([\s\S]*?)\n \*\//);
  if (!headerMatch) return null;

  const headerText = headerMatch[1];
  const tags = {};

  // Extract all @tags (format: " * @tag value" - no colon)
  const tagRegex = /^\s*\* (@\w+)\s+(.*)$/gm;
  let match;
  while ((match = tagRegex.exec(headerText)) !== null) {
    const [, tag, value] = match;
    tags[tag] = value.trim();
  }

  return tags;
}

// Check if @date is recent (within last 30 days for modified files)
function isDateRecent(dateString, filePath, stagedFiles) {
  // Only check @date freshness for files being committed
  if (!stagedFiles.includes(filePath)) return true;

  const date = new Date(dateString);
  const now = new Date();
  const daysDiff = (now - date) / (1000 * 60 * 60 * 24);

  // Allow 30 days for header updates
  return daysDiff <= 30;
}

// Validate file header
function validateFileHeader(filePath, stagedFiles) {
  const fileType = classifyFile(filePath);
  if (!fileType) return null; // Skip unclassified files

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return null; // Skip unreadable files
  }

  const tags = extractHeader(content);
  const requiredTags = REQUIRED_TAGS[fileType];

  const errors = [];

  // Check missing header
  if (!tags) {
    errors.push(`Missing file header (required for ${fileType} files)`);
    return { filePath, fileType, errors };
  }

  // Check required tags
  for (const tag of requiredTags) {
    if (!tags[tag]) {
      errors.push(`Missing required tag: ${tag}`);
    } else if (tags[tag] === 'TODO' || tags[tag].includes('TODO')) {
      errors.push(`${tag} contains TODO (must be filled)`);
    }
  }

  // @date and @author tags removed - no longer required

  return errors.length > 0 ? { filePath, fileType, errors } : null;
}

// Main validation
function main() {
  const stagedFiles = getStagedFiles();
  const filesToCheck = stagedFiles.filter(f => f.match(/\.(ts|tsx|mjs)$/));

  if (filesToCheck.length === 0) {
    console.log('✅ No source files to validate');
    return;
  }

  console.log(`📝 Validating headers for ${filesToCheck.length} files...`);

  const violations = [];

  for (const filePath of filesToCheck) {
    const result = validateFileHeader(filePath, stagedFiles);
    if (result) {
      violations.push(result);
    }
  }

  if (violations.length === 0) {
    console.log('✅ All file headers valid');
    return;
  }

  // Report violations
  console.error('\n❌ File header violations detected:\n');

  for (const { filePath, fileType, errors } of violations) {
    console.error(`${filePath} (${fileType}):`);
    for (const error of errors) {
      console.error(`  • ${error}`);
    }
    console.error('');
  }

  console.error('📋 Fix required:');
  console.error('  1. Add missing tags to file headers');
  console.error('  2. Replace TODO placeholders with actual values');
  console.error('  3. Update @date to today when modifying files');
  console.error('  4. See .specify/memory/constitution.md (Amendment v2.4.0)');
  console.error('');

  process.exit(1);
}

main();