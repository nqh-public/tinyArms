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

### Basic Usage

```bash
# Direct model inference (no routing)
tinyarms model run <model-name> "<prompt>" [options]

# Examples
tinyarms model run qwen2.5-coder:3b "Review this code for magic numbers"
tinyarms model run jan-nano-4b "Find TanStack Start deployment docs" --mcp github,context7
tinyarms model run embeddinggemma:300m "Classify this file type: hero-mockup.png" --embedding-only
```

### Advanced Options

```bash
# With system prompt
tinyarms model run jan-nano-4b \
  --system "You are a research assistant" \
  --prompt "Find React 19 best practices" \
  --mcp context7,web-search

# Stream output
tinyarms model run qwen2.5-coder:3b \
  --prompt "Analyze this file" \
  --stdin < src/main.ts \
  --stream

# JSON mode (for agents)
tinyarms model run jan-nano-4b \
  --prompt "Search for Prisma migrations guide" \
  --mcp context7,github \
  --json

# With file context
tinyarms model run qwen2.5-coder:3b \
  --prompt "Review against constitution" \
  --files src/components/button.tsx \
  --context .specify/memory/constitution.md
```

### Model Discovery

```bash
# List available models
tinyarms model list

# Output:
# Level 1: embeddinggemma:300m (200MB, loaded)
# Level 2: qwen2.5-coder:3b (1.9GB, loaded)
# Level 2: jan-nano-4b:q8_0 (4.3GB, unloaded)
# Level 2: gemma3-4b (2.3GB, unloaded)
# Level 3: qwen2.5-coder:7b (4.7GB, unloaded)

# Model info
tinyarms model info jan-nano-4b

# Output:
# Name: jan-nano-4b
# Level: 2/3 (research agent)
# Size: 4.3GB (Q8 quantization)
# Context: 128K tokens
# MCP-capable: Yes
# Available MCP servers: github, context7, filesystem, web-search
# Use cases: Library docs, error diagnosis, pattern search
```

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

## MCP Configuration (Claude Code)

Add to `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "tinyarms": {
      "command": "tinyarms",
      "args": ["mcp-server"],
      "description": "Direct access to local AI models"
    }
  }
}
```

---

## Use Cases

### Use Case 1: Context-Efficient Research

**Problem**: Claude Code's 200K context fills up quickly when gathering docs

**Solution**: Delegate research to jan-nano-4b

```
User: "Find TanStack Start deployment options on Railway vs Vercel"

Claude Code:
1. Calls model_infer with jan-nano-4b + context7 MCP
2. jan-nano gathers docs, synthesizes findings
3. Returns 2-page summary (vs 50 pages of raw docs)

Context saved: 180K tokens
```

---

### Use Case 2: Pre-Linting Scans

**Problem**: Linting 50 files with Claude Code is expensive

**Solution**: Use Qwen 3B for batch pre-scan

```
User: "Lint all TypeScript files for constitutional violations"

Claude Code:
1. Calls model_infer with qwen2.5-coder:3b for each file
2. Aggregates violations
3. Only escalates ambiguous cases to Claude Code

Cost saved: 49 files × 5K tokens = 245K tokens
```

---

### Use Case 3: Semantic File Search

**Problem**: Finding similar code patterns across monorepo

**Solution**: Use embeddinggemma for fast similarity search

```
User: "Find files similar to this authentication logic"

Claude Code:
1. Calls model_embed on target code
2. Compares against cached embeddings of all repo files
3. Returns top 5 matches (<100ms vs minutes of grep)

Speed: 60x faster than sequential code reading
```

---

### Use Case 4: Constitutional Principle Lookup

**Problem**: Need to check if code violates specific principles

**Solution**: Use embeddinggemma + jan-nano-4b

```
User: "Does this code violate our DRY principle?"

Claude Code:
1. Embeds code snippet (embeddinggemma, <100ms)
2. Finds similar principles in constitution.md
3. jan-nano-4b reads relevant principles + analyzes code
4. Returns verdict with line references

Context saved: Didn't load entire 1141-line constitution into Claude Code
```

---

## Implementation Strategy

### Phase 1: Basic CLI

```bash
# Minimal implementation
tinyarms model run <model> "<prompt>"
tinyarms model list
```

**Deliverable**: Working CLI with 3 models (embeddinggemma, qwen-3b, jan-nano)

---

### Phase 2: MCP Server

```typescript
// Implement 5 tools
- model_infer
- model_embed
- model_list
- model_load
- model_unload
```

**Deliverable**: Claude Code can call tinyArms models via MCP

---

### Phase 3: MCP Integration (jan-nano only)

```yaml
# Enable jan-nano to call other MCPs
jan-nano-4b:
  mcp_servers:
    - context7
    - github
    - filesystem
    - web-search
```

**Deliverable**: jan-nano-4b research agent with MCP tools

---

### Phase 4: Optimization

- Model caching (keepalive strategies)
- Batch inference (process multiple files in parallel)
- Result caching (dedupe identical queries)
- Streaming responses (show progress for long operations)

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

## Testing Strategy

### Unit Tests

```bash
# Test CLI commands
tinyarms model run embeddinggemma:300m "test" --json
tinyarms model list
tinyarms model info jan-nano-4b
```

### Integration Tests

```typescript
// Test MCP tools
describe('MCP Tool: model_infer', () => {
  it('should call jan-nano-4b with MCP servers', async () => {
    const result = await callTool('model_infer', {
      model: 'jan-nano-4b:q8_0',
      prompt: 'Find Prisma docs',
      mcp_servers: ['context7']
    });

    expect(result.success).toBe(true);
    expect(result.mcp_calls.length).toBeGreaterThan(0);
  });
});
```

### End-to-End Tests

```bash
# Simulate Claude Code workflow
echo '{"method": "tools/call", "params": {...}}' | tinyarms mcp-server
```

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
