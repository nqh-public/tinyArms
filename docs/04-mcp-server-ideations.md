// docs/mcp-server-ideations.md
# 🦖 TinyArms MCP Server - Architecture

**Status**: Redesigned (2025-11-01) based on Anthropic's "Writing Tools for Agents"
**Reference**: https://www.anthropic.com/engineering/writing-tools-for-agents

## Overview

MCP (Model Context Protocol) server that exposes TinyArms capabilities as tools for Claude Code, Aider, Cursor, and other AI coding assistants.

## Core Philosophy

**Make TinyArms capabilities available through agent-optimized workflows**

- Consolidated tools (not granular operations) → Reduces agent decision overhead
- Token budget enforcement (25k max) → Prevents context waste
- Response format control → Agents choose verbosity
- Semantic identifiers → Principle names, not UUIDs
- Actionable errors → Fix suggestions, not error codes

---

## Available Tools (Consolidated Design)

**3 consolidated tools** (replaces 10+ granular operations):

| Tool | Consolidates | Key Features |
|------|--------------|--------------|
| `review_code` | lint_code + check_constitution + get_violations + suggest_fixes | Constitutional review with actionable fixes in ONE call |
| `organize_files` | rename_file + move_file + analyze_files | File operations with semantic context, dry-run default |
| `research_context` | query_system + analyze_changes + extract_keywords | Multi-source search with time filtering |

**Why 3 tools, not 10?**
- Anthropic research: "More tools don't guarantee better outcomes; too many options distract agents"
- Each tool = complete workflow (agent doesn't need to chain 4 calls)
- Token efficient: 1 consolidated call vs 4 separate round-trips

**Implementation**: See `src/mcp/tools/` for full schemas

---

## MCP Server Architecture

```
┌─────────────────────────────────────────────────────┐
│           Claude Code / Aider / Cursor              │
│                                                     │
│  User: "Review these files against Principle VI"   │
└─────────────────┬───────────────────────────────────┘
                  │ MCP Protocol (stdio)
                  ↓
┌─────────────────────────────────────────────────────┐
│              TinyArms MCP Server                    │
│                                                     │
│  Tools: [review_code, organize_files,              │
│          research_context]                         │
│                                                     │
│  1. Receive tool call                              │
│  2. Validate input + enforce token budget          │
│  3. Route to TieredRouter (Level 0-3)              │
│  4. Format output (concise vs detailed)            │
│  5. Return with metadata (latency, tier, tokens)   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│              TieredRouter                           │
│                                                     │
│  Level 0 (rules) → Level 1 (embedding) →           │
│  Level 2 (AI) → Level 3 (research)                 │
└─────────────────────────────────────────────────────┘
```

**Key Improvements vs Original Design**:
- 3 tools vs 5 (better consolidation)
- Token budget enforcement (25k max, like Claude Code)
- Response format enum (concise vs detailed)
- Semantic principle names ("Principle VI: Brutal Honesty" not `principle_6`)
- Metadata tracking (latency, tier used, tokens consumed)

---

## Implementation

**Location**: `apps/tinyArms/src/mcp/`

**Files created**:
- `server.ts` - Main MCP server with tool registration
- `types.ts` - TypeScript interfaces, token limits, tier info
- `tools/review-code.ts` - Consolidated code review tool
- `tools/organize-files.ts` - Consolidated file organization tool
- `tools/research-context.ts` - Consolidated research/query tool

**Dependencies**:
```json
{
  "@modelcontextprotocol/sdk": "^0.5.0"
}
```

**Run**:
```bash
node apps/tinyArms/src/mcp/server.ts
```

---

## Agent Integration

### Claude Code

```json
// ~/.config/claude-code/mcp.json
{
  "mcpServers": {
    "tinyarms": {
      "command": "node",
      "args": ["/path/to/tinyarms/src/mcp/server.ts"]
    }
  }
}
```

### Example Agent Workflow

**Before (5 tool calls, ~8k tokens wasted)**:
```typescript
// Agent needs to lint code
1. lint_code("src/auth.ts")              // 2k tokens
2. check_constitution("Principle VI")    // 1.5k tokens
3. get_violations()                      // 2k tokens
4. suggest_fixes()                       // 2.5k tokens
// Total: 4 round-trips, 8k tokens, ~6s latency
```

**After (1 tool call, ~2k tokens)**:
```typescript
// Agent uses consolidated tool
review_code({
  files: ["src/auth.ts"],
  principles: ["Principle VI: Brutal Honesty"],
  response_format: "concise"
})
// Returns: violations + fixes + metadata in ONE response
// Total: 1 round-trip, 2k tokens, ~3s latency
```

**Savings**: 50% token reduction, 50% latency reduction, 75% fewer API calls

---

## Tool Design Principles (Anthropic)

**Source**: https://www.anthropic.com/engineering/writing-tools-for-agents

### 1. Consolidated Workflows
- **Principle**: Combine related operations into single tools
- **Applied**: `review_code` = lint + check + violations + fixes
- **Benefit**: Agents make fewer decisions, reduce round-trips

### 2. Token Budget Enforcement
- **Principle**: Limit responses to 25k tokens (Claude Code standard)
- **Applied**: `TOKEN_LIMITS.MAX = 25000` in types.ts
- **Benefit**: Prevents context overflow, predictable costs

### 3. Response Format Control
- **Principle**: Let agents choose verbosity (`concise` vs `detailed`)
- **Applied**: `response_format` enum in all tools
- **Benefit**: Agents save tokens when possible, expand when needed

### 4. Semantic Identifiers
- **Principle**: Use human-readable names, not UUIDs
- **Applied**: "Principle VI: Brutal Honesty" not `principle_6`
- **Benefit**: Agents understand context better, make smarter decisions

### 5. Actionable Errors
- **Principle**: Provide fix suggestions, not error codes
- **Applied**: `error.suggestion` in all responses
- **Benefit**: Agents can self-recover, fewer user interventions

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
