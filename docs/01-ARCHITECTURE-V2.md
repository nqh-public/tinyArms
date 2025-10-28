# tinyArms Architecture v2 - Refined with jan-nano-4b Integration

**Last updated**: 2025-10-27
**Status**: Design phase (0% implemented)
**Changes**: Added jan-nano-4b as research agent, hardcoded delegation rules, direct model access

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    Entry Points                                 │
│  ├─ CLI (tinyarms command)                                     │
│  ├─ MCP Server (for Claude Code/Aider/Cursor)                  │
│  ├─ Direct Model Access (new: bypass routing)                  │
│  └─ LaunchAgents (scheduled automation)                        │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                 Tiered Router (Hardcoded Rules)                │
│                                                                 │
│  Level 0: Deterministic Rules (<1ms, 60-75% coverage)          │
│  ├─ Keyword extraction (RAKE)                                  │
│  ├─ File type detection (extension + path)                     │
│  ├─ Kebab-case formatting                                      │
│  └─ Simple pattern matching                                    │
│           ↓ No match                                            │
│  Level 1: embeddinggemma (semantic routing, <100ms, 20-25%)    │
│  ├─ Classify task type                                         │
│  ├─ Intent extraction                                          │
│  ├─ Confidence scoring                                         │
│  └─ Route to Level 2/3/4 via HARDCODED RULES                   │
│           ↓ Route decision                                      │
│  Level 2/3: jan-nano-4b (research agent, 3-12s, 5-10%)         │
│  ├─ MCP-based research (Context7, GitHub, Filesystem, Web)     │
│  ├─ Multi-source synthesis                                     │
│  ├─ Constitutional principle lookup                            │
│  └─ Shared code discovery                                      │
│           ↓ OR                                                  │
│  Level 4: Specialized Models (2-15s, 5-10%)                    │
│  ├─ qwen2.5-coder:3b (code linting, fast)                      │
│  ├─ gemma3-4b (file naming, markdown, audio)                   │
│  └─ qwen2.5-coder:7b (deep architectural analysis, optional)   │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                         Storage                                 │
│  ├─ SQLite (task history, metrics, cache)                      │
│  ├─ Config (YAML for humans, JSON for agents)                  │
│  └─ Vector Store (embeddings cache for Level 1)                │
└────────────────────────────────────────────────────────────────┘
```

---

## Key Changes from v1

### 1. jan-nano-4b Role Clarification

**v1**: General orchestrator (executes OR delegates)
**v2**: **Research agent only** (uses MCP servers for multi-source research)

**Why**: Keep architecture simple, leverage jan-nano-4b's strength (MCP tool calling)

---

### 2. Hardcoded Delegation Rules

**v1**: jan-nano-4b decides autonomously
**v2**: **embeddinggemma + hardcoded rules** decide delegation

**Implementation**:
```typescript
// src/router/delegation-rules.ts

interface RoutingDecision {
  task_type: string;
  confidence: number;
  route_to: 'jan-nano-4b' | 'qwen-3b' | 'gemma-4b' | 'qwen-7b' | 'none';
}

function decide_route(task: Task, embedding_result: EmbeddingResult): RoutingDecision {
  // Rule 1: Code analysis → qwen-3b or qwen-7b
  if (task.type === 'code_linting' || task.skill === 'code-linting-fast') {
    if (task.file_size_loc > 200 || task.complexity === 'high') {
      return { task_type: 'code_linting_deep', confidence: 0.95, route_to: 'qwen-7b' };
    }
    return { task_type: 'code_linting_fast', confidence: 0.95, route_to: 'qwen-3b' };
  }

  // Rule 2: Research tasks → jan-nano-4b
  if (task.type === 'research' || task.intent.includes('find') || task.intent.includes('search')) {
    if (task.requires_multi_source || task.mcp_servers?.length > 0) {
      return { task_type: 'research_multi_source', confidence: 0.90, route_to: 'jan-nano-4b' };
    }
  }

  // Rule 3: Constitutional lookup → jan-nano-4b
  if (task.type === 'constitutional_lookup' || embedding_result.similar_to === 'constitution.md') {
    return { task_type: 'constitutional_lookup', confidence: 0.92, route_to: 'jan-nano-4b' };
  }

  // Rule 4: Shared code discovery → jan-nano-4b
  if (task.type === 'code_search' && task.scope === 'packages/') {
    return { task_type: 'shared_code_discovery', confidence: 0.88, route_to: 'jan-nano-4b' };
  }

  // Rule 5: File naming → gemma-4b (if complex)
  if (task.type === 'file_naming' && embedding_result.confidence < 0.75) {
    return { task_type: 'file_naming_complex', confidence: 0.80, route_to: 'gemma-4b' };
  }

  // Rule 6: Markdown analysis → gemma-4b
  if (task.type === 'markdown_analysis' || task.file_ext === '.md') {
    return { task_type: 'markdown_analysis', confidence: 0.85, route_to: 'gemma-4b' };
  }

  // Rule 7: Audio actions → gemma-4b
  if (task.type === 'audio_actions' || task.source === 'macwhisper') {
    return { task_type: 'audio_actions', confidence: 0.87, route_to: 'gemma-4b' };
  }

  // Fallback: Low confidence or unknown → reject
  return { task_type: 'unknown', confidence: 0.0, route_to: 'none' };
}
```

**Why hardcoded rules**:
- ✅ Predictable (no AI black box for routing)
- ✅ Fast (no LLM inference for routing decision)
- ✅ Testable (unit tests for each rule)
- ✅ Debuggable (clear why task routed to X)

---

### 3. Direct Model Access

**New feature**: CLI/MCP to call models directly (bypass routing)

**Use cases**:
- Claude Code needs research → calls jan-nano-4b directly
- User wants deep analysis → calls qwen-7b directly
- Pre-linting scans → calls qwen-3b directly

**See**: `docs/research/direct-model-access-api.md`

---

## Routing Flow (Detailed)

### Flow 1: Code Linting (Fast)

```
User: "tinyarms run code-linting-fast src/button.tsx"
  ↓
Level 0: Check file size
  - button.tsx = 142 LOC → Within limits
  - No deterministic violations found
  ↓
Level 1: embeddinggemma
  - Embed file content
  - Classify: task_type = "code_linting", confidence = 0.93
  ↓
Hardcoded Rule: code_linting + LOC < 200 → qwen-3b
  ↓
Level 4: qwen2.5-coder:3b
  - Load constitution principles
  - Analyze code
  - Detect: 1 hardcoded color (#FF5733)
  ↓
Return: {
  violations: [{ line: 23, rule: "no-hardcoded-colors", severity: "error" }],
  latency: "2.3s"
}
```

---

### Flow 2: Research (Multi-Source)

```
User: "Find TanStack Start deployment on Railway"
  ↓
Level 0: No deterministic match
  ↓
Level 1: embeddinggemma
  - Classify: task_type = "research", intent = "find deployment guide"
  - Confidence = 0.89
  ↓
Hardcoded Rule: research + multi_source → jan-nano-4b
  ↓
Level 2/3: jan-nano-4b (with MCP)
  - MCP: Context7 → Fetch TanStack Start docs
  - MCP: GitHub → Search railway deployment examples
  - MCP: Filesystem → Check local .specify/memory/ for notes
  - Synthesize findings
  ↓
Return: {
  summary: "TanStack Start on Railway: Use railway.json...",
  sources: ["Context7: TanStack docs", "GitHub: 3 examples"],
  latency: "8.2s"
}
```

---

### Flow 3: Constitutional Lookup

```
User: "Does this code violate DRY principle?"
  ↓
Level 1: embeddinggemma
  - Embed code snippet
  - Classify: task_type = "constitutional_lookup"
  - Similarity to constitution.md = 0.87
  ↓
Hardcoded Rule: constitutional_lookup → jan-nano-4b
  ↓
Level 2/3: jan-nano-4b (with MCP)
  - MCP: Filesystem → Read constitution.md (Principle XV: DRY)
  - Compare code against principle
  - Find: SAME logic appears in 2+ files
  ↓
Return: {
  violation: true,
  principle: "XV. DRY Enforcement",
  evidence: "auth.ts:42, user.ts:67 (identical validation)",
  recommendation: "Extract to @nqh/shared/validation"
}
```

---

### Flow 4: Shared Code Discovery

```
User: "Search for existing date formatting utilities"
  ↓
Level 1: embeddinggemma
  - Classify: task_type = "code_search", scope = "packages/"
  - Confidence = 0.91
  ↓
Hardcoded Rule: code_search in packages/ → jan-nano-4b
  ↓
Level 2/3: jan-nano-4b (with MCP)
  - MCP: Filesystem → Search packages/**/*date*.ts
  - MCP: SQLite → Query REGISTRY.md embeddings
  - Find: packages/shared/utils/format-date.ts
  ↓
Return: {
  found: true,
  location: "packages/shared/utils/format-date.ts:12-34",
  import: "@nqh/shared/utils",
  usage_examples: [...]
}
```

---

### Flow 5: Direct Model Access (No Routing)

```
Claude Code: "Use jan-nano to research React 19 changes"
  ↓
MCP call: model_infer({
  model: "jan-nano-4b:q8_0",
  prompt: "What changed in React 19 hooks?",
  mcp_servers: ["context7", "github"]
})
  ↓
tinyArms: SKIP routing, call jan-nano-4b directly
  ↓
jan-nano-4b: Execute with MCP
  ↓
Return: { response: "React 19 hook changes: ...", mcp_calls: [...] }
```

**Why bypass routing**:
- Claude Code already knows which model it needs
- Saves 100ms routing overhead
- Direct control over model selection

---

## Model Configuration

```yaml
# ~/.config/tinyarms/config.yaml

models:
  level1: embeddinggemma:300m           # 200MB, semantic routing
  level2-research: jan-nano-4b:q8_0    # 4.3GB, research agent
  level4-code-fast: qwen2.5-coder:3b   # 1.9GB, fast code linting
  level4-specialist: gemma3-4b         # 2.3GB, file naming/markdown/audio
  level4-code-deep: qwen2.5-coder:7b   # 4.7GB, deep analysis (optional)

routing:
  # Hardcoded delegation rules
  rules:
    code_linting:
      condition: "task.type == 'code_linting' AND file_size_loc <= 200"
      route_to: level4-code-fast
      priority: 2  # Pre-commit compatible (<5s)

    code_linting_deep:
      condition: "task.type == 'code_linting' AND (file_size_loc > 200 OR complexity == 'high')"
      route_to: level4-code-deep
      priority: 4  # Weekly scans only

    research_multi_source:
      condition: "task.type == 'research' AND requires_multi_source"
      route_to: level2-research
      priority: 3

    constitutional_lookup:
      condition: "task.type == 'constitutional_lookup' OR similar_to('constitution.md') > 0.80"
      route_to: level2-research
      priority: 3

    shared_code_discovery:
      condition: "task.type == 'code_search' AND scope == 'packages/'"
      route_to: level2-research
      priority: 3

    file_naming_complex:
      condition: "task.type == 'file_naming' AND confidence < 0.75"
      route_to: level4-specialist
      priority: 3

    markdown_analysis:
      condition: "task.type == 'markdown_analysis' OR file_ext == '.md'"
      route_to: level4-specialist
      priority: 3

    audio_actions:
      condition: "task.type == 'audio_actions'"
      route_to: level4-specialist
      priority: 3

# MCP servers for jan-nano-4b
jan-nano-4b:
  mcp_servers:
    context7:
      enabled: true
      priority: 1

    github:
      enabled: true
      priority: 2

    filesystem:
      enabled: true
      allowed_paths:
        - ~/CODES/nqh/
        - ~/.specify/memory/
        - ~/.config/tinyarms/

    web-search:
      enabled: false  # Requires Serper API key
      api_key: ${SERPER_API_KEY}

  model_config:
    temperature: 0.3
    max_tokens: 4000
    keepalive: "30m"
    timeout: 15000  # 15s

# Direct model access
direct_access:
  enabled: true
  mcp_tools:
    - model_infer
    - model_embed
    - model_list
    - model_load
    - model_unload

# Skills (match routing rules)
skills:
  code-linting-fast:
    enabled: true
    model: level4-code-fast        # qwen2.5-coder:3b
    priority: 2
    constitution_path: ~/.specify/memory/constitution.md

  code-linting-deep:
    enabled: false                  # Optional, enable manually
    model: level4-code-deep         # qwen2.5-coder:7b
    schedule: "0 2 * * 0"          # Sunday 2am

  file-naming:
    enabled: true
    model: level4-specialist        # gemma3-4b
    schedule: "*/5 * * * *"        # Every 5 mins

  markdown-analysis:
    enabled: true
    model: level4-specialist
    schedule: "0 */2 * * *"        # Every 2 hours

  audio-actions:
    enabled: true
    model: level4-specialist
    watch_paths:
      - ~/Documents/Transcriptions/
```

---

## Performance Characteristics

### Latency by Level

| Level | Model | Operation | Latency | Coverage |
|-------|-------|-----------|---------|----------|
| 0 | Rules | Pattern matching | <1ms | 60-75% |
| 1 | embeddinggemma | Semantic routing | <100ms | 20-25% |
| 2/3 | jan-nano-4b | Research (simple) | 3-8s | 3-5% |
| 2/3 | jan-nano-4b | Research (complex) | 8-15s | 2-3% |
| 4 | qwen-3b | Code linting (fast) | 2-3s | 5-8% |
| 4 | gemma-4b | File naming | 2-4s | 1-2% |
| 4 | qwen-7b | Deep analysis | 10-15s | <1% |

**Total coverage**: 100% (all tasks handled)

---

### Memory Usage (16GB RAM)

| State | Models Loaded | RAM Used | Free RAM | Safe? |
|-------|--------------|----------|----------|-------|
| Idle | embeddinggemma | ~300MB | ~15.7GB | ✅ |
| Code linting | embeddinggemma + qwen-3b | ~3.5GB | ~12.5GB | ✅ |
| Research | embeddinggemma + jan-nano-4b | ~6.3GB | ~9.7GB | ✅ |
| Deep analysis | embeddinggemma + qwen-7b | ~9.3GB | ~6.7GB | ✅ |
| **Peak** | embeddinggemma + jan-nano + qwen-3b | ~9.5GB | ~6.5GB | ✅ |

**Concurrent loading**: Max 2 large models (>3GB) at once

**LRU eviction**: Unload least recently used model when memory > 12GB

---

### Storage Requirements

**Core install** (required):
```
embeddinggemma:300m         200MB
qwen2.5-coder:3b          1,900MB
Infrastructure            1,000MB
─────────────────────────────────
Total                     3,100MB (3.1GB)
Free                     16,900MB (16.9GB)
```

**Core + jan-nano-4b** (research agent):
```
Core                      3,100MB
jan-nano-4b:q8_0          4,300MB
─────────────────────────────────
Total                     7,400MB (7.4GB)
Free                     12,600MB (12.6GB)
```

**All models** (complete install):
```
Core + jan-nano           7,400MB
gemma3-4b                 2,300MB (reused from Cotypist)
qwen2.5-coder:7b          4,700MB
─────────────────────────────────
Total                    14,400MB (14.4GB)
Free                      5,600MB (5.6GB)
```

---

## Testing Strategy

### Unit Tests: Delegation Rules

```typescript
describe('Delegation Rules', () => {
  it('should route code linting to qwen-3b if LOC < 200', () => {
    const task = { type: 'code_linting', file_size_loc: 142 };
    const result = decide_route(task, { confidence: 0.93 });

    expect(result.route_to).toBe('qwen-3b');
    expect(result.confidence).toBeGreaterThan(0.90);
  });

  it('should route research to jan-nano-4b', () => {
    const task = { type: 'research', requires_multi_source: true };
    const result = decide_route(task, { confidence: 0.89 });

    expect(result.route_to).toBe('jan-nano-4b');
  });

  it('should route constitutional lookup to jan-nano-4b', () => {
    const task = { type: 'constitutional_lookup' };
    const embedding = { similar_to: 'constitution.md', confidence: 0.87 };
    const result = decide_route(task, embedding);

    expect(result.route_to).toBe('jan-nano-4b');
  });
});
```

---

### Integration Tests: Full Flow

```typescript
describe('End-to-End Routing', () => {
  it('should complete code linting flow', async () => {
    const result = await tinyarms_run({
      skill: 'code-linting-fast',
      file: 'src/button.tsx'
    });

    expect(result.level).toBe('Level 4: qwen-3b');
    expect(result.latency_ms).toBeLessThan(3000);
    expect(result.violations).toBeDefined();
  });

  it('should complete research flow with MCP', async () => {
    const result = await tinyarms_run({
      skill: 'research',
      prompt: 'Find TanStack Start deployment on Railway'
    });

    expect(result.level).toBe('Level 2/3: jan-nano-4b');
    expect(result.mcp_calls.length).toBeGreaterThan(0);
    expect(result.sources).toContain('Context7');
  });
});
```

---

## Migration from v1 to v2

### Breaking Changes

1. **jan-nano-4b role**: General orchestrator → Research agent only
2. **Delegation**: AI-decided → Hardcoded rules
3. **Direct access**: Not available → MCP tools for direct model access

### Migration Path

**Phase 1**: Update routing logic with hardcoded rules
**Phase 2**: Integrate jan-nano-4b with MCP servers
**Phase 3**: Add direct model access tools
**Phase 4**: Optimize model loading/unloading

---

## Future Enhancements

### 1. Learning from Feedback

```yaml
# User feedback → update delegation rules
feedback:
  - task: "Code linting missed DRY violation"
    route: "qwen-3b"
    should_route_to: "qwen-7b"
    reason: "Complex semantic duplication"

# System learns: Update rule
code_linting_deep:
  condition: "... OR semantic_complexity == 'high'"
```

---

### 2. Dynamic Rule Adjustment

```typescript
// Auto-adjust confidence thresholds based on accuracy
if (model_accuracy < 0.85) {
  increase_confidence_threshold();  // Route fewer tasks to this model
}
```

---

### 3. Cost Optimization

```yaml
# Track $ per task (if using cloud models)
cost_tracking:
  jan-nano-4b: $0.00  # Local
  qwen-3b: $0.00      # Local
  claude-code: $0.03/1K tokens  # Cloud fallback
```

---

## References

- **v1 Architecture**: `docs/01-ARCHITECTURE.md`
- **jan-nano-4b use cases**: `docs/research/jan-nano-4b-use-cases.md`
- **Direct model access**: `docs/research/direct-model-access-api.md`
- **MCP integration**: `docs/04-mcp-server-ideations.md`

---

**Status**: Design phase (0% implemented)
**Next steps**: Implement Phase 1 (basic routing with hardcoded rules)
