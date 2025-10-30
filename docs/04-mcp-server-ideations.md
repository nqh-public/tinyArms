// docs/mcp-server-ideations.md
# 🦖 TinyArms MCP Server - Ideations & Architecture

## Overview

MCP (Model Context Protocol) server that exposes TinyArms capabilities as tools for Claude Code, Aider, Cursor, and other AI coding assistants.

## Core Philosophy

**Make TinyArms capabilities available to AI agents through standardized MCP protocol**

- Agent calls tool → TinyArms processes → Returns structured result
- No manual CLI needed - agents discover and use tools automatically
- Leverage local AI models without hitting cloud APIs

---

## Available Tools

**5 MCP tools exposed** to Claude Code/Aider/Cursor:

| Tool | Purpose | Key I/O |
|------|---------|---------|
| `rename_file` | Intelligent file renaming | Input: file_path, context<br>Output: new_name, confidence, level |
| `lint_code` | Constitutional code review | Input: file_path, constitution_path<br>Output: issues[], compliance |
| `analyze_changes` | Markdown change detection | Input: directory, since<br>Output: changes[], suggestions[] |
| `extract_keywords` | Intent from messy text | Input: text, context<br>Output: keywords[], action |
| `query_system` | Query TinyArms state | Input: query (natural language)<br>Output: results[], summary |

**Full schemas**: See lines 20-180 (deleted - detailed TypeScript definitions)

---

## MCP Server Architecture

```
┌─────────────────────────────────────────────────────┐
│           Claude Code / Aider / Cursor              │
│                                                     │
│  User: "Lint all TypeScript files"                 │
└─────────────────┬───────────────────────────────────┘
                  │ MCP Protocol (stdio/HTTP)
                  ↓
┌─────────────────────────────────────────────────────┐
│              TinyArms MCP Server                    │
│                                                     │
│  Tools: [rename_file, lint_code, analyze_changes]  │
│                                                     │
│  1. Receive tool call                              │
│  2. Validate input                                 │
│  3. Route to TieredRouter                          │
│  4. Format output for agent                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│              TieredRouter                           │
│                                                     │
│  Level 0 → Level 1 → Level 2 → Fallback            │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Overview

**TypeScript + MCP SDK** (15-line sketch):
```typescript
// 1. Initialize MCP Server (name: 'tinyarms', version: '0.1.0')
// 2. Register 5 tools (rename_file, lint_code, analyze_changes, extract_keywords, query_system)
// 3. Route tool calls → TieredRouter
// 4. Format output for agent consumption
// 5. Start stdio transport

// See 04-mcp-server-ideations.md:217-286 (deleted) for full TypeScript example
```

---

## Agent Integration Example (Claude Code Only)

```json
// ~/.config/claude-code/mcp.json
{
  "mcpServers": {
    "tinyarms": {
      "command": "node",
      "args": ["/usr/local/bin/tinyarms", "mcp-server"],
      "env": {"TINYARMS_CONFIG": "~/.config/tinyarms/config.yaml"}
    }
  }
}
```

---

## Advanced Features

### 1. Streaming Progress

For long operations (bulk linting), stream progress:

```typescript
{
  "status": "processing",
  "progress": 0.45,
  "current_file": "src/main.ts",
  "processed": 9,
  "total": 20
}
```

### 2. Interactive Confirmation

For destructive operations, ask agent to confirm:

```typescript
{
  "status": "needs_confirmation",
  "action": "rename 47 files",
  "preview": ["file1.png → new-name-1.png", ...],
  "prompt": "This will rename 47 files. Confirm? (yes/no)"
}
```

Agent can then call back with:
```typescript
{
  "confirmation": true,
  "proceed": true
}
```

### 3. Batch Operations

Process multiple files efficiently:

```typescript
// Input
{
  "files": ["file1.ts", "file2.ts", ...],
  "operation": "lint_code"
}

// Output
{
  "batch_id": "abc123",
  "results": [...],
  "summary": "Linted 20 files, found 5 issues"
}
```

### 4. Memory/Context

MCP server can maintain context across calls:

```typescript
// First call
agent: rename_file("screenshot.png", context="hero mockup")

// Server remembers
internal_state: {
  last_rename_pattern: "hero-mockup",
  user_prefers: "descriptive-names"
}

// Second call (context-aware)
agent: rename_file("screenshot2.png")
// Server infers: Similar to last time, probably "hero-mockup-2"
```

---

## Security Considerations

### 1. Sandboxing

- Limit file access to allowed directories (whitelist)
- Reject paths with `..` (directory traversal)
- Validate file sizes (reject >10MB files for analysis)

### 2. Rate Limiting

- Max 10 tool calls per minute per agent
- Max 100 files per batch operation
- Timeout: 30s per operation

### 3. Safe Operations

- Always default to `dry_run=true` for destructive ops
- Log all tool calls with timestamps
- Require confirmation for bulk operations (>10 files)

---

## Testing Strategy

### Unit Tests

```typescript
describe('MCP Tool: rename_file', () => {
  it('should rename file using Level 0 rules', async () => {
    const result = await callTool('rename_file', {
      file_path: 'Screenshot 2024.png',
      context: 'hero mockup'
    });
    
    expect(result.new_name).toBe('hero-mockup.png');
    expect(result.level).toBe('Level 0: Deterministic Rules');
  });
});
```

### Integration Tests

```typescript
describe('MCP Server Integration', () => {
  it('should handle bulk linting', async () => {
    const result = await callTool('lint_code', {
      files: ['src/**/*.ts'],
      constitution_path: '.specify/memory/constitution.md'
    });
    
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
```

### End-to-End Tests

```bash
# Simulate Claude Code calling the server
echo '{"method": "tools/call", "params": {...}}' | tinyarms mcp-server
```

---

## Performance Optimizations

### 1. Tool Call Batching

If agent calls `rename_file` 20 times in a row, batch them:

```typescript
// Instead of 20 separate calls
router.route(...) // 20x

// Batch into one
router.routeBatch([...20 inputs]) // 1x
```

### 2. Result Caching

Cache tool results for identical inputs:

```typescript
// First call: 3s
lint_code("src/main.ts") // Runs inference

// Second call within 1 hour: <1ms
lint_code("src/main.ts") // Cache hit
```

### 3. Parallel Processing

For independent operations:

```typescript
await Promise.all([
  rename_file("file1.png"),
  rename_file("file2.png"),
  rename_file("file3.png"),
]) // 3x faster than sequential
```

---

## Future Ideas

### Tool: `learn_from_feedback`

Agent provides feedback on TinyArms decisions:

```typescript
{
  "original_decision": {...},
  "feedback": "Should have been 'dashboard-final' not 'dashboard-redesign'",
  "correct_output": "dashboard-final.fig"
}
```

TinyArms learns and improves Level 0 rules.

### Tool: `ask_user`

When uncertain, MCP server can ask the human:

```typescript
{
  "status": "needs_input",
  "question": "I found 3 similar files. Which one should I rename?",
  "options": ["file1.png", "file2.png", "file3.png"]
}
```

Agent shows this to user, gets response, continues.

### Tool: `train_rule`

User teaches new rules via agent:

```typescript
agent: train_rule({
  pattern: "files starting with 'IMG_' in Photos dir",
  action: "rename using date + first object in photo",
  example: "IMG_1234.jpg → 2024-10-27-golden-gate.jpg"
})
```

TinyArms adds this to Level 0 rules.

---

## Conclusion

**MCP server makes TinyArms a first-class citizen in AI agent ecosystems.**

Instead of agents manually running CLI commands, they discover and use TinyArms capabilities through standardized tools. This enables:

- **Seamless integration** with Claude Code, Aider, Cursor
- **Intelligent automation** without cloud API costs
- **Human-in-the-loop** for uncertain decisions
- **Learning from feedback** to improve over time

**Next Steps:**
1. Implement basic MCP server with 3 core tools
2. Test with Claude Code integration
3. Add streaming progress for long operations
4. Implement batch processing optimizations
