# Contributing to tinyArms

Thank you for your interest in contributing to tinyArms! 🦖

---

## Project Status

**Current Phase**: Early development (~15% implemented)

tinyArms is in active design/architecture phase. Most code is skeleton/placeholder. See [README.md](README.md) for implementation status.

---

## Ways to Contribute

### 1. Code Implementation

**High Priority** (Week 1-4):
- Tiered routing system (Level 0-3)
- Skill implementations (code-linting, file-naming)
- MCP server tools (review_code, organize_files, research_context)
- Test coverage improvements

**Medium Priority** (Week 5-8):
- Prompt evolution system
- LaunchAgent integration
- Semantic caching
- Answer consistency scoring

See [Next Steps](README.md#next-steps) for detailed roadmap.

### 2. Documentation

- Fix broken links or unclear sections
- Add usage examples
- Improve installation guides
- Write tutorials for specific use cases

### 3. Research & Validation

- Benchmark models on your hardware (report results)
- Test latency assumptions (actual vs documented)
- Validate expected impact claims (e.g., "20-30% reduction")
- Contribute production evidence from similar systems

### 4. Bug Reports & Feature Requests

Use [GitHub Issues](https://github.com/nqh-public/tinyArms/issues) with:
- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- System info (macOS version, RAM, Ollama version)

---

## Development Setup

### Prerequisites

- **macOS 12.0+** (Linux support planned)
- **Node.js 18+**
- **Ollama** (`brew install ollama`)
- **16GB RAM** recommended (8GB minimum)

### Installation

```bash
# Clone repo
git clone https://github.com/nqh-public/tinyArms.git
cd tinyArms

# Install dependencies
npm install

# Pull required models
ollama pull embeddinggemma:300m
ollama pull qwen2.5-coder:3b

# Run tests
npm test

# Watch mode for development
npm run dev
```

---

## Coding Standards

### File Structure

```
src/
├── cli/           # CLI interface
├── linting/       # Code linting (constitution-loader, linter, ollama-client)
├── logging/       # SQLite metrics
├── mcp/           # MCP server integration
├── skills/        # Skill registry and loaders
└── utils/         # Shared utilities
```

### File Naming

- **Files**: `kebab-case.ts` (e.g., `constitution-loader.ts`)
- **Components**: `PascalCase` (e.g., `ConstitutionLoader`)
- **Variables**: `camelCase` (e.g., `defaultPath`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `DEFAULT_CONFIDENCE`)

### Code Quality

- **TypeScript strict mode**: All code must type-check
- **ESLint**: Run `npm run lint` before committing
- **File size**: Keep files under 350 LOC (split if larger)
- **Tests**: Add tests for new features (target: 70% coverage)
- **Comments**: Explain non-obvious logic (not what, but why)

### File Headers

All files should include JSDoc headers:

```typescript
/**
 * @what Brief description of what this file does
 * @why Why this file exists (problem it solves)
 * @exports Main exports from this file
 */
```

---

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test -- constitution-loader.test.ts

# Coverage report
npm test -- --coverage
```

### Writing Tests

- Use **Vitest** framework
- Test files: `*.test.ts` next to source files
- Focus on:
  - Core logic (routing, linting, scoring)
  - Edge cases (empty input, malformed JSON)
  - Integration tests (CLI commands, MCP tools)

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { ConstitutionLoader } from './constitution-loader';

describe('ConstitutionLoader', () => {
  it('should load principles from default path', async () => {
    const loader = new ConstitutionLoader();
    const content = await loader.load();
    expect(content).toContain('Principle');
  });
});
```

---

## Pull Request Process

### 1. Fork & Branch

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/tinyArms.git
cd tinyArms

# Create feature branch
git checkout -b feature/my-feature
```

### 2. Make Changes

- Follow coding standards above
- Add tests for new features
- Update documentation if needed
- Keep commits focused and atomic

### 3. Commit Messages

Use conventional commits:

```
feat(linting): add magic number detection to Level 0 rules
fix(mcp): handle missing file errors in review_code tool
docs(readme): update installation instructions for M1 Macs
test(router): add edge cases for tiered routing
```

Format:
```
<type>(<scope>): <short description>

<optional body with details>

<file.ts:line-numbers> (if code change)
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`

### 4. Test & Lint

```bash
# Run all checks
npm test
npm run lint
npm run build

# All should pass before submitting PR
```

### 5. Submit PR

- **Title**: Clear, descriptive (e.g., "Add semantic caching to Level -1 router")
- **Description**:
  - What changed
  - Why (problem solved)
  - How to test
  - Related issues (if any)
- **Screenshots**: For UI changes or CLI output

### 6. Code Review

- Be responsive to feedback
- Make requested changes
- Squash commits if asked
- Keep PR focused (one feature/fix per PR)

---

## Architecture Decisions

### Design Philosophy

1. **Offline-first**: No cloud dependencies unless explicitly optional
2. **Memory-efficient**: Optimized for 8-16GB Macs (not data centers)
3. **Fast rules before AI**: Level 0 (deterministic) handles 60-75% of tasks
4. **Evidence-based**: All performance claims cite research or benchmarks
5. **User privacy**: Code/files never leave machine

### When to Use Each Tier

- **Level 0**: Regex, AST parsing, hardcoded rules (<1ms)
- **Level 1**: Semantic routing via embeddings (<100ms, 20-25% coverage)
- **Level 2**: Code analysis with Qwen2.5-Coder (2-3s, 10-15% coverage)
- **Level 3**: Research via jan-nano-4b + MCP (8-12s, <5% coverage)

### Adding New Skills

Skills follow [OpenSkills format](https://github.com/numman/openskills):

```
skills/
└── my-skill/
    ├── SKILL.md           # Manifest with YAML frontmatter
    ├── config.yaml        # Model config, prompts
    ├── index.ts           # Export execute() + getConfig()
    └── executor.ts        # Inference logic
```

See `skills/code-linting/` for reference implementation.

---

## Research Contributions

### How to Contribute Research

1. **Benchmarks**: Run models on your hardware, report:
   - Model name/size
   - Hardware (M1/M2/M3, RAM)
   - Latency (p50, p95, p99)
   - Accuracy (if applicable)
   - Memory usage

2. **Production Evidence**: Share similar systems you've built:
   - Architecture pattern used
   - Scale (requests/day, users)
   - Observed metrics (latency, cost, accuracy)
   - Lessons learned

3. **Academic Papers**: Cite relevant research:
   - Link to paper (arXiv, ACL, NeurIPS, etc.)
   - Key findings applicable to tinyArms
   - How it validates/contradicts current design

### Documentation Standards

- **Cite sources**: All claims need references (research file + line number)
- **Quantify impact**: Use numbers ("20-30% reduction"), not vague ("significant")
- **Mark assumptions**: If unvalidated, mark as "Assumed (needs validation)"
- **Production examples**: Prefer real-world evidence over theory

---

## Community

### Code of Conduct

- **Be respectful**: Constructive criticism only
- **Be patient**: Maintainers are volunteers
- **Be helpful**: Share knowledge, assist others
- **Be inclusive**: Welcome all skill levels

### Getting Help

- **Questions**: [GitHub Discussions](https://github.com/nqh-public/tinyArms/discussions)
- **Bugs**: [GitHub Issues](https://github.com/nqh-public/tinyArms/issues)
- **Feature requests**: [GitHub Issues](https://github.com/nqh-public/tinyArms/issues) with `enhancement` label

---

## Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md) (coming soon)
- Credited in release notes
- Mentioned in documentation for major features

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make tinyArms better! 🦖
