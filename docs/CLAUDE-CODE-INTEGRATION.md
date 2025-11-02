# Integrating tinyArms with Claude Code

**Last Updated**: 2025-11-02
**Status**: Design phase - MCP server not yet implemented

---

## Overview

tinyArms can be integrated with Claude Code (and other MCP-compatible AI assistants) to provide lightweight, offline AI capabilities for constitutional code review, file organization, and context research.

**Key Benefits**:
- 🔒 **100% Offline** - All processing happens locally via Ollama
- ⚡ **Fast** - Tiered routing uses rules first, AI only when needed
- 💰 **Zero Cost** - No API calls, runs on your machine
- 🎯 **Specialized** - Focused on code quality, file naming, and research

---

## Quick Start

### Prerequisites

1. **Install Ollama**: `brew install ollama`
2. **Pull required models**:
   ```bash
   ollama pull embeddinggemma:300m
   ollama pull qwen2.5-coder:3b
   ```
3. **Install tinyArms**: `npm install -g tinyarms` (not available yet)

### Add to Claude Code

Add to your MCP configuration file (`~/.config/claude-code/mcp.json`):

```json
{
  "mcpServers": {
    "tinyarms": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/tinyarms/src/mcp/server.ts"]
    }
  }
}
```

**Alternative** (if installed globally):
```json
{
  "mcpServers": {
    "tinyarms": {
      "command": "tinyarms",
      "args": ["mcp"]
    }
  }
}
```

Restart Claude Code to load the server.

---

## Available Tools

tinyArms exposes **3 consolidated tools** designed for AI agent efficiency:

### 1. `review_code` - Constitutional Code Review

**Purpose**: Lint code against design principles with actionable fixes

**Parameters**:
- `files`: Array of file paths to review
- `principles`: Optional array of principle names (e.g., "Universal Reusability")
- `response_format`: "concise" (default) or "detailed"

**Example Usage** (in Claude Code):
```
User: Review auth.ts against principle "Universal Reusability"

Claude uses tinyarms/review_code:
{
  "files": ["src/auth.ts"],
  "principles": ["Universal Reusability"],
  "response_format": "concise"
}

Returns:
{
  "violations": [
    {
      "file": "src/auth.ts",
      "line": 42,
      "principle": "Universal Reusability",
      "issue": "Hardcoded OAuth config - not reusable across apps",
      "suggestion": "Extract to shared @org/auth package"
    }
  ],
  "metadata": {
    "tier_used": "Level 2 (Qwen2.5-Coder-3B)",
    "latency_ms": 2341,
    "tokens_consumed": 1850
  }
}
```

**Why consolidated?**: Replaces 4+ separate calls (lint → check → get violations → suggest fixes) with ONE tool call, saving tokens and latency.

---

### 2. `organize_files` - Intelligent File Operations

**Purpose**: Rename/move files with semantic understanding

**Parameters**:
- `operations`: Array of `{action: "rename"|"move", source: string, target: string}`
- `dry_run`: Boolean (default: true) - Preview changes before applying
- `context`: Optional string explaining the reorganization goal

**Example Usage**:
```
User: Rename Screenshot_2025.png intelligently

Claude uses tinyarms/organize_files:
{
  "operations": [
    {
      "action": "rename",
      "source": "~/Downloads/Screenshot_2025.png",
      "target": "" // Empty = ask tinyArms to suggest
    }
  ],
  "dry_run": true,
  "context": "User downloaded a design mockup screenshot"
}

Returns:
{
  "suggestions": [
    "landing-page-hero-mobile-v1.png",
    "website-mockup-screenshot.png",
    "design-draft-2025-11-02.png"
  ],
  "dry_run": true // No changes applied yet
}
```

**Why consolidated?**: Combines rename + move + analysis in one call, with built-in dry-run safety.

---

### 3. `research_context` - Multi-Source Research

**Purpose**: Search across documentation, codebase, and change history

**Parameters**:
- `query`: Search query string
- `sources`: Array of sources to search: `["docs", "code", "git_history"]`
- `time_filter`: Optional time range (e.g., "last_week", "last_month")
- `max_results`: Number of results (default: 10)

**Example Usage**:
```
User: How has authentication changed in the last week?

Claude uses tinyarms/research_context:
{
  "query": "authentication implementation",
  "sources": ["code", "git_history"],
  "time_filter": "last_week",
  "max_results": 5
}

Returns:
{
  "results": [
    {
      "type": "git_commit",
      "file": "src/auth/oauth.ts",
      "commit": "a3b2c1",
      "date": "2025-10-28",
      "summary": "Migrated from Auth0 to better-auth library",
      "diff_excerpt": "- import Auth0 from 'auth0'\n+ import { betterAuth } from 'better-auth'"
    }
  ],
  "metadata": {
    "tier_used": "Level 3 (jan-nano-4b research)",
    "sources_searched": ["filesystem", "git_log"],
    "latency_ms": 8234
  }
}
```

**Why consolidated?**: Searches multiple sources (docs, code, git) in one call, with intelligent ranking.

---

## Configuration

### Basic Configuration

tinyArms reads from `~/.tinyarms/config.yaml`:

```yaml
models:
  embedding: embeddinggemma:300m
  code_analysis: qwen2.5-coder:3b
  research: jan-nano-4b # Optional

routing:
  level_0_cache_ttl: 3600 # 1 hour
  level_2_timeout: 5000   # 5s max for code analysis
  level_3_timeout: 15000  # 15s max for research

mcp:
  max_tokens: 25000        # Token budget per request
  default_format: concise  # concise | detailed
```

### Skill-Specific Settings

Enable/disable specific tinyArms skills:

```yaml
skills:
  code-linting:
    enabled: true
    auto_fix: false # Suggest fixes but don't apply

  file-naming:
    enabled: true
    learn_from_choices: true # Prompt evolution

  markdown-analysis:
    enabled: false # Disable if not needed
```

---

## Usage Patterns

### Pattern 1: Pre-Commit Review

```bash
# In your git pre-commit hook
tinyarms review-code --files $(git diff --cached --name-only)

# Or via Claude Code:
# User: "Review my staged changes before I commit"
# Claude uses tinyarms/review_code automatically
```

### Pattern 2: Batch File Renaming

```bash
# Via Claude Code:
# User: "Rename all screenshots in Downloads/ intelligently"
# Claude:
#   1. Lists files in ~/Downloads/*.png
#   2. Calls tinyarms/organize_files with dry_run=true
#   3. Shows suggestions to user
#   4. If approved, calls again with dry_run=false
```

### Pattern 3: Research-Driven Development

```bash
# User: "How do we handle authentication in this codebase?"
# Claude uses tinyarms/research_context:
#   - Searches code for auth patterns
#   - Checks git history for auth changes
#   - Summarizes current implementation
```

---

## Troubleshooting

### Issue: MCP Server Not Found

**Symptom**: Claude Code says "tinyarms server not available"

**Fix**:
1. Check Ollama is running: `ollama list`
2. Verify MCP config path: `~/.config/claude-code/mcp.json`
3. Restart Claude Code after config changes

### Issue: Slow Response Times

**Symptom**: tinyArms tools take >10s to respond

**Fix**:
1. Check which tier was used (metadata.tier_used)
2. Level 3 (research) is slow by design (8-12s)
3. Increase timeout in config if needed
4. Consider disabling Level 3 for faster responses

### Issue: Low Quality Suggestions

**Symptom**: File naming suggestions are generic

**Fix**:
1. Enable `learn_from_choices: true` in config
2. Use tinyArms more - prompt evolution improves over time
3. Provide more context in requests (e.g., "This is a landing page hero")

---

## Advanced Integration

### Custom Principles

Add your own code review principles:

```yaml
# ~/.tinyarms/principles.yaml
custom_principles:
  - name: "API Versioning"
    description: "All API endpoints must include /v1/, /v2/ prefix"
    examples:
      good: "/api/v1/users"
      bad: "/api/users"
    severity: error
```

tinyArms will check these alongside built-in principles.

### Prompt Evolution Monitoring

Track how tinyArms prompts improve over time:

```bash
tinyarms stats --skill file-naming

Output:
  Prompt Version: 3
  Accuracy: 89% (improved from 78%)
  User Votes: 42 total
  Last Evolution: 2025-10-15
```

---

## Comparison with Other Tools

| Feature | tinyArms | Copilot | Cursor | Aider |
|---------|----------|---------|--------|-------|
| Offline | ✅ 100% | ❌ Cloud | ❌ Cloud | ⚠️ Hybrid |
| Cost | ✅ $0/mo | ❌ $10/mo | ❌ $20/mo | ⚠️ Varies |
| Constitutional Review | ✅ Built-in | ❌ No | ❌ No | ❌ No |
| File Naming | ✅ Learns | ❌ No | ❌ No | ❌ No |
| Prompt Evolution | ✅ Auto | ❌ Static | ❌ Static | ❌ Static |
| MCP Integration | ✅ Native | ❌ No | ⚠️ Via plugins | ⚠️ Limited |

**Use tinyArms when**: Privacy, cost, and offline-first are priorities
**Use Copilot/Cursor when**: You want maximum code completion accuracy (cloud LLMs)

---

## Further Reading

- [tinyArms Architecture](01-ARCHITECTURE.md) - How tiered routing works
- [Model Selection](01-MODELS.md) - Why Qwen2.5-Coder vs alternatives
- [Prompt Evolution System](05-prompt-evolution-system.md) - How suggestions improve
- [MCP Server Ideations](04-mcp-server-ideations.md) - Design decisions

---

## Contributing

tinyArms MCP integration is **not yet implemented** (design phase only).

**Help wanted**:
- Implement MCP server (see `src/mcp/server.ts` skeleton)
- Add tool schemas (see `src/mcp/tools/`)
- Test with Claude Code, Cursor, Aider
- Document usage patterns

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## License

MIT - See [LICENSE](../LICENSE)
