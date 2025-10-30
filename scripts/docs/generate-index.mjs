#!/usr/bin/env node
/**
 * @what Auto-generate documentation index (INDEX.md) from all markdown files in tinyArms/docs
 * @why Keep navigation current - extracts H1 titles + first paragraphs, groups by category
 * @usage node apps/tinyArms/scripts/docs/generate-index.mjs (runs from monorepo root, auto-called by pre-commit hook)
 * @author NQH
 * @date 2025-10-30
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

async function findMarkdownFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return findMarkdownFiles(path, baseDir);
    } else if (entry.name.endsWith('.md') && entry.name !== 'INDEX.md') {
      return path;
    }
    return null;
  }));
  return files.flat().filter(Boolean);
}

async function generateIndex() {
  console.log('📚 Generating documentation index...');

  // 1. Find all docs
  const files = (await findMarkdownFiles('apps/tinyArms/docs')).sort();

  // 2. Extract metadata
  const docs = await Promise.all(files.map(async (path) => {
    const content = await readFile(path, 'utf-8');
    const title = content.match(/^#\s+(.+)$/m)?.[1] || 'Untitled';
    const description = extractFirstParagraph(content);
    const lines = content.split('\n').length;

    return {
      path: path.replace('apps/tinyArms/docs/', ''),
      title,
      description,
      lines
    };
  }));

  // 3. Group by category
  const grouped = {
    core: docs.filter(d => /^\d{2}-/.test(d.path)),
    pseudocode: docs.filter(d => d.path.startsWith('pseudocode/')),
    research: docs.filter(d => d.path.startsWith('research/')),
    models: docs.filter(d => d.path.startsWith('model-research/'))
  };

  // 4. Generate markdown
  const totalLines = docs.reduce((s, d) => s + d.lines, 0);
  const index = `# tinyArms Documentation Index

**Auto-generated** • ${docs.length} files • ${totalLines.toLocaleString()} total lines

---

## Quick Start

1. [README.md](../README.md) - Project overview
2. [00-OVERVIEW.md](00-OVERVIEW.md) - What/why tinyArms
3. [00-GETTING-STARTED.md](00-GETTING-STARTED.md) - 10-minute setup

---

## Core Documentation (${grouped.core.length} files)

${grouped.core.map(d => `### [${d.title}](${d.path})

${d.description}
`).join('\n')}

---

## Pseudocode (${grouped.pseudocode.length} files)

${grouped.pseudocode.map(d => `- **[${d.title}](${d.path})** - ${d.description}`).join('\n')}

---

## Research (${grouped.research.length} files)

${grouped.research.map(d => `- **[${d.title}](${d.path})** - ${d.description}`).join('\n')}

---

## Model Research (${grouped.models.length} files)

${grouped.models.map(d => `- **[${d.title}](${d.path})** - ${d.description}`).join('\n')}

---

**Regenerate**: \`node apps/tinyArms/scripts/docs/generate-index.mjs\`
`;

  await writeFile('apps/tinyArms/docs/INDEX.md', index);
  console.log('✅ Generated INDEX.md');
}

function extractFirstParagraph(content) {
  // Skip frontmatter, title, blank lines
  const lines = content.split('\n');
  let start = 0;

  // Skip past title
  while (start < lines.length && (
    lines[start].trim() === '' ||
    lines[start].startsWith('#') ||
    lines[start].startsWith('---')
  )) {
    start++;
  }

  // Get first non-empty paragraph
  let para = '';
  while (start < lines.length && lines[start].trim() !== '') {
    para += lines[start] + ' ';
    start++;
    if (para.length > 150) break; // Cap at 150 chars
  }

  const cleaned = para.trim();
  return cleaned.length > 150 ? cleaned.substring(0, 147) + '...' : cleaned;
}

generateIndex().catch(console.error);
