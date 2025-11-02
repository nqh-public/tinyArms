# tinyArms v0.1.0 Usage Guide

## Status: Alpha Release

**Implementation**: ~35% complete (core CLI functional)
**Production Ready**: No (requires Ollama setup)
**Last Updated**: 2025-11-02

---

## Prerequisites

### Required
1. **Node.js** 18.0.0 or higher
2. **Ollama** running locally
3. **Model**: qwen2.5-coder:3b-instruct (~1.9GB)

### Installation Steps

#### 1. Install tinyArms
```bash
# From source (current method)
git clone https://github.com/nqh-public/tinyArms.git
cd tinyArms
npm install
npm run build
npm link  # Makes 'tinyarms' command globally available
```

#### 2. Install Ollama
```bash
# macOS
curl https://ollama.ai/install.sh | sh

# Or download from https://ollama.ai
```

#### 3. Pull Required Model
```bash
ollama pull qwen2.5-coder:3b-instruct
```

This downloads ~1.9GB (one-time). Future runs are instant.

#### 4. Create Constitution File
```bash
mkdir -p ~/.tinyarms
cat > ~/.tinyarms/principles.md << 'EOF'
# Constitutional Design Principles

## Principle III: Architecture-First Development
Before writing code, search npm, GitHub, and existing patterns first.

## Principle IV: Zero Invention Policy
No new conventions or patterns without design review.

## Principle XVII: Pragmatic Atomic Composability (DRY)
Extract logic into reusable functions after 3+ duplicates.

## Principle I: Universal Reusability
Write code that could be extracted into an npm package.
EOF
```

---

## Commands

### Linting

#### Basic Usage
```bash
tinyarms lint path/to/file.ts
```

#### With Custom Constitution
```bash
tinyarms lint src/auth.ts --constitution ./my-principles.md
```

#### Concise Output (Less Tokens)
```bash
tinyarms lint src/auth.ts --format concise
```

#### Pre-commit Hook Example
```bash
#!/bin/bash
# .git/hooks/pre-commit

changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

if [ -n "$changed_files" ]; then
  for file in $changed_files; do
    echo "Linting $file..."
    tinyarms lint "$file" --format concise
    if [ $? -ne 0 ]; then
      echo "❌ Constitutional violations found in $file"
      exit 1
    fi
  done
fi
```

### Skills Management

#### List Available Skills
```bash
tinyarms skills list
```

Output:
```
✅ Discovered 1 skills

📚 Available Skills

Name                     Token Budget   Streaming   Batch
──────────────────────────────────────────────────────────────────────
code-linting-fast        15000          ❌           ✅

Total skills: 1
Total token budget: 15,000
```

#### Get Skill Details
```bash
tinyarms skills info code-linting-fast
```

### Version Check
```bash
tinyarms --version
# Output: 0.1.0
```

---

## Output Format

### JSON Output (stdout)
All linting results are printed to stdout as JSON for scripting:

```json
{
  "violations": [
    {
      "rule": "architecture-first",
      "line": 5,
      "message": "Custom email validation when validator.js exists",
      "severity": "warning",
      "principle": "Principle III: Architecture-First Development",
      "constitutionalRef": "~/.tinyarms/principles.md:5-10",
      "fix": {
        "action": "Replace custom validation with validator.js",
        "suggestions": [
          "npm install validator",
          "import validator from 'validator'; validator.isEmail(email)"
        ],
        "example": "See packages/auth/validators.ts:12-18"
      }
    }
  ],
  "summary": "Found 1 violation: custom validation without checking npm first",
  "confidence": 0.85,
  "model": "qwen2.5-coder:3b-instruct",
  "latencyMs": 2340,
  "tokenCount": 234,
  "format": "detailed"
}
```

### Progress Logs (stderr)
All progress messages go to stderr (won't interfere with piping):

```
🦖 tinyArms constitutional linter

Checking Qwen2.5-Coder-3B...
✅ Model qwen2.5-coder:3b-instruct already available
Loading constitution...
Reading test-example.ts...

Analyzing code (detailed mode)...
```

### Exit Codes
- **0**: No violations found (clean)
- **1**: Violations found OR error occurred

---

## Resource Usage

### Memory Profile
- **Base**: ~50-100MB (Node.js + tinyArms)
- **Ollama**: +1-2GB (daemon)
- **Model Loaded**: +2GB (qwen2.5-coder:3b)
- **Total**: ~3-4GB RAM

### Performance
- **First Run**: 2-5s (model loading)
- **Subsequent Runs**: 1-3s (model cached)
- **Model Download**: 5-10min (one-time, 1.9GB)

### Disk Usage
- **tinyArms**: ~2MB (source + node_modules minimal)
- **node_modules**: ~50MB (with dependencies)
- **Model**: 1.9GB (in Ollama storage)
- **Logs**: ~1-5MB (grows over time)

---

## Configuration Files

### Constitution File
**Location**: `~/.tinyarms/principles.md`
**Format**: Markdown with principle headers
**Required**: Yes (without it, linting fails)

### Database
**Location**: `~/.tinyarms/tinyarms.db`
**Format**: SQLite
**Purpose**: Lint execution history
**Created**: Automatically on first run

### Logs
**Location**: `~/.tinyarms/logs/lint-history.jsonl`
**Format**: JSON Lines (one JSON object per line)
**Purpose**: Audit trail
**Created**: Automatically on first run

---

## Troubleshooting

### "Model not found"
```bash
ollama list  # Check if model is pulled
ollama pull qwen2.5-coder:3b-instruct
```

### "Ollama connection failed"
```bash
ollama serve &  # Start Ollama daemon
```

### "Constitution not found"
Create `~/.tinyarms/principles.md` (see step 4 in Installation)

### "Command not found: tinyarms"
```bash
npm link  # From tinyArms repo directory
# Or use: node dist/cli.js lint <file>
```

### High Memory Usage
- Expected: ~3-4GB with model loaded
- VM Constraint: Requires 4GB+ RAM minimum
- Reduce: Use `--format concise` for smaller responses

---

## Development

### Run Without Building
```bash
npm run dev lint test-example.ts
```

### Watch Mode
```bash
npm run dev  # Uses tsx watch mode
```

### Linting Code
```bash
npm run lint
```

### Run Tests
```bash
npm test
# Note: Requires Ollama running
```

---

## Limitations (v0.1.0)

### Not Implemented Yet
- ❌ Tiered routing (always uses Level 2: qwen2.5-coder)
- ❌ Semantic caching (same file = same analysis time)
- ❌ MCP tools (stubs only, return placeholder data)
- ❌ File naming skill
- ❌ Markdown analysis skill
- ❌ Audio actions skill
- ❌ LaunchAgent integration (no background watching)
- ❌ Automated tests (vitest configured but needs mocking)

### Known Issues
- Model must be manually downloaded
- Constitution file must be manually created
- No progress indicators for long operations
- No setup.sh script (referenced in docs but missing)
- No CI/CD workflow

---

## What Works (v0.1.0)

### Fully Functional
- ✅ CLI framework with `--version`
- ✅ `lint <file>` command
- ✅ Constitution loading
- ✅ Ollama integration
- ✅ Token budget enforcement
- ✅ Response format control (concise/detailed)
- ✅ Skills registry with auto-discovery
- ✅ `skills list` and `skills info` commands
- ✅ Exit codes (0=clean, 1=violations)
- ✅ JSON output to stdout
- ✅ Progress logs to stderr
- ✅ Logging (SQLite + JSON Lines)
- ✅ Model availability checking

---

## Next Release (v0.2.0 Planned)

- [ ] Setup script (check prerequisites, create config)
- [ ] MCP tools implementation (wire to linter)
- [ ] CI/CD workflow (GitHub Actions)
- [ ] Integration tests (with Ollama mock)
- [ ] Progress indicators (ora/listr)
- [ ] prepublishOnly hook
- [ ] npm publishing
- [ ] Homebrew tap

---

## Support

- **Issues**: https://github.com/nqh-public/tinyArms/issues
- **Docs**: https://github.com/nqh-public/tinyArms/tree/main/docs
- **License**: MIT
