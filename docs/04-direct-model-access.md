# Direct Model Access API

**Purpose**: Expose tinyArms models directly to coding agents (Claude Code, Aider, Cursor) for context-efficient operations

**Status**: Design phase (0% implemented)

---

## Architecture

```
Coding Agent (Claude Code)
  ↓
tinyArms MCP Server
  ↓
Direct Model Access API
  ↓
┌─────────────────────────────────────┐
│ Model Router                        │
│ ├─ embeddinggemma (Level 1)        │
│ ├─ Qwen2.5-Coder-3B (Level 2)      │
│ ├─ jan-nano-4b (Level 2/3)         │
│ ├─ Gemma 3 4B (Level 2 specialist) │
│ └─ Qwen2.5-Coder 7B (Level 3)      │
└─────────────────────────────────────┘
  ↓
Ollama (local inference)
```

---

## CLI Interface

### CLI Examples (3 common patterns)

```bash
# 1. Direct inference (no routing)
tinyarms model run qwen2.5-coder:3b "Review for magic numbers"

# 2. Research with MCP tools (jan-nano only)
tinyarms model run jan-nano-4b "Find Prisma guide" --mcp context7,github

# 3. List/info commands
tinyarms model list
tinyarms model info jan-nano-4b
```

**Full 65-line bash examples deleted** (lines 34-98). See Git history for all options (--stream, --json, --files, etc.)

---

## MCP Server Tools

### Tool 1: `model_infer`

**Purpose**: Direct model inference without routing

**Input Schema**:
```typescript
{
  model: string;           // Model name (e.g., "qwen2.5-coder:3b")
  prompt: string;          // User prompt
  system?: string;         // Optional system prompt
  context?: string[];      // Optional context files
  stream?: boolean;        // Stream response (default: false)
  mcp_servers?: string[];  // MCP servers to enable (jan-nano only)
  temperature?: number;    // Sampling temperature (0-2)
  max_tokens?: number;     // Max output tokens
}
```

**Output**:
```typescript
{
  success: boolean;
  model: string;
  response: string;        // Model output
  tokens_used: number;
  latency_ms: number;
  mcp_calls?: Array<{      // If MCP enabled
    server: string;
    tool: string;
    result: any;
  }>;
}
```

**Example** (Claude Code calling):
```typescript
// User: "Use jan-nano to find Prisma migration best practices"

// Claude Code calls:
model_infer({
  model: "jan-nano-4b:q8_0",
  prompt: "Find Prisma migration best practices and common pitfalls",
  mcp_servers: ["context7", "github"],
  temperature: 0.3,
  max_tokens: 4000
})

// Response:
{
  success: true,
  model: "jan-nano-4b:q8_0",
  response: "Based on Context7 docs and GitHub analysis:\n\n1. Always use `prisma migrate dev` locally...",
  tokens_used: 3847,
  latency_ms: 8421,
  mcp_calls: [
    { server: "context7", tool: "get-library-docs", result: "Prisma v5 migration guide" },
    { server: "github", tool: "search_code", result: "15 example migrations" }
  ]
}
```

---

### Tool 2: `model_embed`

**Purpose**: Generate embeddings (Level 1 only)

**Input Schema**:
```typescript
{
  text: string | string[];  // Single text or batch
  model?: string;           // Default: embeddinggemma:300m
}
```

**Output**:
```typescript
{
  success: boolean;
  embeddings: number[][];   // 768-dim vectors
  latency_ms: number;
}
```

**Example**:
```typescript
// User: "Find constitutional principles similar to this code"

// Claude Code calls:
model_embed({
  text: "const primaryColor = '#FF5733'; // Hardcoded color"
})

// Then searches constitution.md embeddings for similarity
```

---

### Tool 3: `model_list`

**Purpose**: Query available models and their status

**Input Schema**:
```typescript
{
  level?: string;          // Filter by level (1, 2, 3)
  loaded_only?: boolean;   // Show only loaded models
}
```

**Output**:
```typescript
{
  models: Array<{
    name: string;
    level: string;
    size_gb: number;
    loaded: boolean;
    mcp_capable: boolean;
    use_cases: string[];
  }>;
}
```

---

### Tool 4: `model_load`

**Purpose**: Pre-load model into memory

**Input Schema**:
```typescript
{
  model: string;
  keepalive?: string;      // Duration (e.g., "30m", "2h")
}
```

**Output**:
```typescript
{
  success: boolean;
  loaded: boolean;
  ram_used_gb: number;
}
```

**Example**:
```typescript
// User: "I'm about to do deep code review, load Qwen 7B"

// Claude Code calls:
model_load({
  model: "qwen2.5-coder:7b",
  keepalive: "1h"
})
```

---

### Tool 5: `model_unload`

**Purpose**: Free memory by unloading model

**Input Schema**:
```typescript
{
  model: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  ram_freed_gb: number;
}
```

---

## MCP Configuration

**See**: `04-mcp-server-ideations.md` for full MCP setup (Claude Code, Aider, Cursor)

---

## Use Cases (4 examples)

| Use Case | Problem | Solution | Impact |
|----------|---------|----------|--------|
| **Context-efficient research** | Claude Code 200K context fills fast | jan-nano-4b + MCP gathers docs | Save 180K tokens |
| **Pre-linting scans** | Linting 50 files expensive | Qwen 3B batch scan | Save 245K tokens |
| **Semantic file search** | Finding similar code slow | embeddinggemma similarity | 60x faster |
| **Constitutional lookup** | Checking principles loads full doc | embeddinggemma + jan-nano | Save full constitution load |

**Full 76-line use case descriptions deleted** (lines 241-316). See table for summary.

---

## Implementation Phases (Note: See ROADMAP.md Future)

**4 phases removed** (Phase 1-4 detailed implementation plans)

**Note**: Direct model access is future work. See ROADMAP.md for phased rollout strategy.

---

## Security Considerations

### 1. Input Validation

```typescript
// Validate model names (prevent injection)
const ALLOWED_MODELS = [
  'embeddinggemma:300m',
  'qwen2.5-coder:3b',
  'jan-nano-4b:q8_0',
  'gemma3-4b',
  'qwen2.5-coder:7b'
];

if (!ALLOWED_MODELS.includes(model)) {
  throw new Error('Invalid model name');
}
```

### 2. Rate Limiting

```yaml
rate_limits:
  model_infer: 60 calls/minute
  model_embed: 300 calls/minute
  model_load: 5 calls/minute
```

### 3. Context File Access

```typescript
// Whitelist directories
const ALLOWED_DIRS = [
  '~/CODES/nqh/',
  '~/.specify/memory/',
  '~/.config/tinyarms/'
];

// Reject path traversal
if (file_path.includes('..')) {
  throw new Error('Path traversal not allowed');
}
```

---

## Performance Targets

| Operation | Target Latency | Model |
|-----------|---------------|-------|
| Embedding | <100ms | embeddinggemma |
| Code linting | 2-3s/file | qwen2.5-coder:3b |
| Research (simple) | 3-8s | jan-nano-4b |
| Research (complex) | 8-15s | jan-nano-4b |
| Deep analysis | 10-15s/file | qwen2.5-coder:7b |

**Memory usage**:
- embeddinggemma: ~300MB
- Qwen 3B: ~3.2GB
- jan-nano-4b: ~6GB
- Qwen 7B: ~9GB

**Concurrent loading**:
- Max 2 models loaded simultaneously (16GB RAM constraint)
- LRU eviction when memory limit reached

---

## Testing Strategy (Summary)

**3 levels**: Unit (CLI commands), Integration (MCP tools), E2E (Claude Code workflow)

**Full 38-line testing examples deleted**. See standard testing patterns for MCP servers.

---

## Configuration Example

```yaml
# ~/.config/tinyarms/config.yaml

models:
  level1: embeddinggemma:300m
  level2-code: qwen2.5-coder:3b
  level2-research: jan-nano-4b:q8_0
  level2-specialist: gemma3-4b
  level3: qwen2.5-coder:7b

direct_access:
  enabled: true
  mcp_server:
    port: 3000
    timeout: 30000  # 30s

  model_config:
    jan-nano-4b:
      mcp_servers:
        - context7
        - github
        - filesystem
        - web-search
      temperature: 0.3
      max_tokens: 4000
      keepalive: "30m"

    qwen2.5-coder:3b:
      temperature: 0.1
      max_tokens: 2000
      keepalive: "1h"

  rate_limits:
    model_infer: 60  # per minute
    model_embed: 300
    model_load: 5

  allowed_directories:
    - ~/CODES/nqh/
    - ~/.specify/memory/
    - ~/.config/tinyarms/
```

---

## References

- **MCP client for Ollama**: https://github.com/jonigl/mcp-client-for-ollama
- **jan-nano-4b docs**: https://menloresearch.github.io/deep-research/
- **Ollama API**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **MCP protocol**: https://modelcontextprotocol.io

---

**Last updated**: 2025-10-27
**Status**: Design phase (0% implemented)
**Next steps**: Implement Phase 1 (basic CLI)
