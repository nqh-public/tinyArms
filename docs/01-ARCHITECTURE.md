# 01 - Architecture

**High-level overview of tinyArms architecture**

For detailed implementation, model decisions, configuration, and integrations, see the specialized docs linked below.

---

## System Overview (Apple Ecosystem)

```
Platform Entry Points
├─ macOS: LaunchAgent Daemon (FSEvents, always running)
├─ iOS: Share Extension (user taps "Share → tinyArms")
├─ iPadOS: Drag & Drop (batch file processing)
└─ All: Shortcuts (Siri voice commands)
          ↓
    Platform Detection (#if os(macOS) / os(iOS))
├─ macOS → OllamaModelClient (Qwen, Gemma via HTTP)
├─ iOS → CoreMLModelClient (SmolLM2, MobileBERT on-device)
└─ CloudKit sync (share results cross-platform)
          ↓
    Skill Registry (SkillRegistry.swift)
├─ Auto-discovers skills/ directory
├─ Parses SKILL.md frontmatter (name, description)
├─ Routes: Direct (known skill) OR Semantic (embedding match)
          ↓
    Skills Layer (TinyArmsKit protocols)
├─ code-linting/ (SkillExecutor conformance)
├─ visual-intelligence/ (Vision framework, iOS+macOS)
├─ camera-intelligence/ (iOS only, AVFoundation)
└─ voice-to-action/ (iOS only, Shortcuts integration)
          ↓
    Tiered Routing (Per Skill, Platform-Aware)
├─ Level -1: Semantic Cache (GRDB vector search, CloudKit)
├─ Level 0: Swift rules (regex, pattern matching)
├─ Level 1: MobileBERT (iOS, 100MB) OR embeddinggemma (macOS, 200MB)
├─ Level 2a: Core ML (iOS: SmolLM2-360M, 250MB on-device)
├─ Level 2b: Ollama (macOS: Qwen2.5-Coder-3B, 1.9GB)
└─ Level 3: macOS only (Qwen2.5-Coder-7B, 4.7GB)
          ↓
    Storage (TinyArmsKit.Storage protocol)
├─ Local: GRDB.swift (SQLite wrapper)
├─ Sync: CloudKit (public database)
└─ Cache: UserDefaults (skill configs)
          ↓
    Models (Platform-Specific)
macOS (Ollama):                iOS/iPadOS (Core ML):
├─ embeddinggemma:300m         ├─ MobileBERT (embeddings, 100MB)
├─ Qwen2.5-Coder-3B            ├─ SmolLM2-360M (text, 250MB)
├─ Qwen3-4B (optional)         ├─ CLIP ViT-B/32 (vision, 340MB)
└─ Qwen2.5-Coder-7B (optional) └─ Apple FM ~3B (if macOS Sequoia+)
```

---

## Tiered Routing System

### Philosophy

**Use the smallest/fastest model that meets accuracy requirements.**

60-75% of tasks should be handled by Level 0 (rules, no models). Only escalate to AI when truly necessary!

---

### Level -1: Semantic Cache

**Purpose**: Return cached answers for similar queries (<50ms)
**Status**: Researched (Phase 03)
**Expected Impact**: 15-25% query elimination

**How it works**:
- Embed incoming query (reuse embeddinggemma from Level 1)
- Search vector DB for similar cached queries
- Similarity >0.95 → Return cached response (~60ms)
- Similarity ≤0.95 → Continue to Level 0

**Performance**:
- Cache hit: ~60ms (40x faster than Level 2)
- Cache miss overhead: +50ms (minimal impact on 2-3s total)
- Memory: 500-800MB for 100K cached entries

**Full details**: See [research/03-semantic-caching-design.md](research/03-semantic-caching-design.md)

---

### Level 0: Deterministic Rules

**Purpose**: Instant responses for pattern-matching tasks (<1ms)
**Target**: Handle 60-75% of tasks here
**Status**: ⚠️ Coverage % assumed (needs validation)

**Examples**:
- Filename formatting (kebab-case)
- Keyword extraction (RAKE algorithm)
- File type detection (extension + path)
- Directory mapping (lookup tables)

**Characteristics**:
- Speed: <1ms
- Accuracy: 100% (when rules match)
- Size: 0 bytes
- Research range: 10-40% in production systems (Semantic Router, Intercom)

**Full details**: See [03-INTEGRATIONS.md - Rules Engine section]

---

### Level 1: Tiny Embeddings

**Purpose**: Semantic understanding layer for routing (NOT generative)
**Model**: embeddinggemma:300m (200MB)
**Speed**: <15ms per embedding on M2
**Target**: Handle 20-25% of tasks here

**Use Cases**:
- File type classification
- Intent extraction from voice
- Constitutional principle similarity search

**Characteristics**:
- Speed: <100ms
- Accuracy: 85-90% (classification) ⚠️ ASSUMED
- Output: 768-dimensional vectors

**Full details**: See [01-MODELS.md - Level 1 section](01-MODELS.md#level-1-embeddinggemma300m--decided)

---

### Level 2: Small Generalists

**Purpose**: Complex reasoning and generation
**Primary**: Qwen2.5-Coder-3B-Instruct (1.9GB, code linting)
**Speed**: 2-3s per file ⚠️ NEEDS M2 AIR TESTING
**Target**: Handle 10-15% of tasks here

**What it detects**:
- Hardcoded colors, magic numbers
- File size violations (>350 LOC)
- Import alias violations
- Missing line references
- Simple DRY violations

**Accuracy**: 85% (15% miss rate on complex violations) ⚠️ ASSUMED

**Optional specialists**:
- Qwen3-4B-Instruct (2.5GB) - General instruction-following tasks
- Gemma 3 4B (2.3GB) - File naming, markdown, audio (reused from Cotypist)

**Full details**: See [01-MODELS.md - Level 2 section](01-MODELS.md#level-2-primary-qwen25-coder-3b-instruct--decided)

---

### Level 3: Code Specialists

**Purpose**: Deep architectural analysis (optional)
**Model**: Qwen2.5-Coder 7B (4.7GB)
**Speed**: 10-15s per file ⚠️ NEEDS M2 AIR TESTING
**Target**: Handle <5% of tasks here

**What it catches (vs Level 2)**:
- Architectural anti-patterns (God objects, circular deps)
- Complex DRY violations (semantic duplication)
- Cross-file pattern analysis
- Component decomposition issues

**Accuracy**: 95% (vs 85% for Level 2) ⚠️ ASSUMED

**When to install**:
- Level 2 misses >10% violations
- Need architectural enforcement
- Want weekly deep scans (not pre-commit blocking)

**Full details**: See [01-MODELS.md - Level 3 section](01-MODELS.md#level-3-qwen25-coder-7b--optional)

## Confidence Scoring

**Status**: Researched (Phase 02)
**Expected Impact**: 20-30% reduction in Level 3 escalations
**Implementation**: Week 3

**Problem**: Level 2 doesn't know when its answer is good enough vs when to escalate to Level 3

**Solution**: Answer Consistency Scoring
- Generate N=3 responses with temperature=0.7
- Measure semantic similarity between all 3
- Threshold: >0.85 → accept Level 2, <0.85 → escalate to Level 3

**Why this works**: LLMs produce consistent answers when confident, inconsistent when uncertain

**Trade-offs**:
- Latency: +500ms at Level 2
- Accuracy: Prevents false confidence
- Cost: 20-30% fewer expensive Level 3 calls

**Industry validation**: AutoMix (NeurIPS 2024) achieves 50%+ cost reduction via self-verification

**Full details**: See [research/02-confidence-scoring-patterns.md](research/02-confidence-scoring-patterns.md)

---

## Token Budget Enforcement Strategy

**Status**: Utilities implemented (2025-10-30), enforcement points documented (2025-11-01)
**Implementation**: src/utils/token-counter.ts:1-66 (ready), integration pending

### Overview

Token budgets prevent context overflow and ensure predictable performance. Based on Anthropic's "Writing Tools for Agents" (2025-11-01), all responses MUST enforce maximum token limits.

**Reference**: https://www.anthropic.com/engineering/writing-tools-for-agents

### Budget Limits

| Response Format | Target Tokens | Max Tokens | Use Case |
|----------------|---------------|------------|----------|
| **concise** | 5,000 | 25,000 | CLI quick checks, pre-commit hooks |
| **detailed** | 15,000 | 25,000 | MCP tools, interactive debugging |
| **streaming** | N/A | 25,000 | Long operations (batch linting) |

**Hard Limit**: 25,000 tokens (Claude Code standard, enforced via truncation)

### Enforcement Points

#### 1. Linter (Level 2 AI)
**File**: src/linting/linter.ts:52-60
**Status**: ✅ Implemented

```typescript
// Truncate if budget exceeded
if (estimatedTokens > tokenLimits.MAX) {
  result.violations = truncateViolations(result.violations, format, tokenLimits)
}
```

**Behavior**:
- Concise: Return first 10 violations + summary
- Detailed: Return first 20 violations with full context
- Always include metadata: `truncated: true, total_violations: 47`

#### 2. MCP Tools
**File**: src/mcp/types.ts:118-123
**Status**: ⚠️ Defined, not enforced

```typescript
export const TOKEN_LIMITS = {
  MAX_RESPONSE: 25000,
  CONCISE_TARGET: 5000,
  DETAILED_TARGET: 15000
}
```

**Integration Needed**: Apply `truncateResponse()` in review-code.ts, organize-files.ts, research-context.ts (when router connects)

#### 3. Tiered Router (Future)
**File**: src/router/tiered-router.ts (not implemented)
**Status**: ❌ Design only

**Expected Logic**:
```typescript
async route(input: Input, format: ResponseFormat) {
  const result = await levelN.execute(input)

  if (countTokens(result) > TOKEN_LIMITS.MAX_RESPONSE) {
    return truncateResponse(result, format)
  }

  return { ...result, metadata: { tokens: countTokens(result) } }
}
```

#### 4. Skill Registry (This Implementation)
**File**: src/skills/registry.ts (in progress)
**Status**: 🔄 Building now

**Metadata Tracking**:
```typescript
interface SkillMetadata {
  token_budget: number  // Per-skill limit (5k-25k)
  // Used by CLI/MCP to enforce budgets BEFORE execution
}
```

**Example**:
- `code-linting-fast`: 15,000 tokens (detailed violations)
- `file-naming`: 5,000 tokens (concise suggestions)
- `markdown-analysis`: 10,000 tokens (change summaries)

### Truncation Strategy

**Utility**: src/utils/token-counter.ts:33-65

**Rules**:
1. **Preserve metadata** (latency, level, total count)
2. **Slice arrays** (violations, suggestions, files)
3. **Add truncation notice** (`truncated: true, showing: 10, total: 47`)
4. **Maintain JSON structure** (no broken objects)

**Example Output**:
```json
{
  "violations": [ /* First 10 only */ ],
  "metadata": {
    "truncated": true,
    "showing": 10,
    "total": 47,
    "tokens": 25000
  }
}
```

### Industry Validation

- **Claude Code**: 25k token limit per tool response (Anthropic standard)
- **FrugalGPT**: Token budgets reduce costs 98% (LLM Cascade paper)
- **AutoMix**: Self-verification with token limits prevents waste

### Testing Requirements

**Unit Tests** (src/utils/token-counter.test.ts):
- ✅ countTokens() accuracy within 5%
- ✅ truncateViolations() preserves metadata
- ✅ Token limits enforced (concise: 5k, detailed: 15k, max: 25k)

**Integration Tests** (when router exists):
- [ ] Level 2 response truncated at 25k
- [ ] MCP tools enforce skill-specific budgets
- [ ] CLI shows truncation warnings

---

## Skills Layer

**Status**: Architecture defined (2025-10-30)
**Implementation**: Phase 1 in progress (code-linting)

### Overview

Skills are self-contained execution units. Each skill:
- Defines WHAT it does (SKILL.md - OpenSkills format)
- Configures HOW it runs (config.yaml - runtime settings)
- Implements core logic (executor.ts - model inference)
- Exports standard interface (index.ts - execute + getConfig)

### Structure (Per Skill) - Swift

```
skills/{name}/
├── SKILL.md              # OpenSkills format (documentation)
├── Package.swift         # Swift Package Manager
├── Sources/
│   ├── Executor.swift    # SkillExecutor conformance
│   ├── Config.swift      # SkillConfig (Codable)
│   └── Models.swift      # Input/output types
├── Tests/
│   └── ExecutorTests.swift
└── Resources/            # Optional: prompts, templates
```

### Protocol (TinyArmsKit)

```swift
// TinyArmsKit/Sources/Protocols/SkillExecutor.swift
public protocol SkillExecutor {
    associatedtype Input: Codable
    associatedtype Output: Codable

    func execute(_ input: Input) async throws -> Output
    var config: SkillConfig { get }
}

// Example: code-linting skill
struct CodeLintingExecutor: SkillExecutor {
    typealias Input = FileInput
    typealias Output = LintResult

    func execute(_ input: FileInput) async throws -> LintResult {
        // Level 0: Swift regex rules
        if let result = try? rulesEngine.check(input.path) {
            return result
        }

        // Level 2: Ollama (macOS) OR Core ML (iOS)
        #if os(macOS)
        return try await ollamaClient.lint(input)
        #else
        return try await coreMLClient.lint(input)
        #endif
    }

    var config: SkillConfig {
        SkillConfig(
            name: "code-linting",
            model: .qwen25Coder3B,  // macOS only
            fallback: .smolLM2_360M // iOS fallback
        )
    }
}
```

**Note**: Associated types allow type-safe, skill-specific schemas

### SKILL.md Frontmatter = Routing Triggers

**No duplication**: config.yaml does NOT include triggers

**skill-registry extracts**:
```markdown
---
name: code-linting
description: Lint code against constitutional principles using Qwen2.5-Coder-3B
---
```

**Used for**:
- Direct lookup: CLI maps "lint" → "code-linting"
- Semantic routing: Ambiguous requests match via description

### config.yaml Schema (Design Spec - Not Implemented)

| Section | Purpose |
|---------|---------|
| `model` | Tiered routing config (level, primary, fallback, threshold) |
| `activation` | Which modes enabled (cli, automated, gui) |
| `schedule` | Automated execution (cron, watch_patterns, batch_size) |
| `performance` | Resource limits (latency, memory, battery) |
| `prompts` | System/user templates |

⚠️ **Status**: Architecture design only. Exact field names, structure, and validation rules TBD during Phase 1 implementation.

**Full schema**: See [research/04-openskills-integration-decision.md](research/04-openskills-integration-decision.md)

---

## Activation Modes

**Status**: Architecture defined (2025-10-30)
**Implementation**: Phase 2 (infrastructure)

### When Routing is Needed

**Direct invocation (NO routing)**:
- ✅ CLI: `tinyarms lint file.ts` → Knows skill = code-linting
- ✅ Scheduler: Reads config.yaml → Knows which skill
- ✅ GUI: User selects from menu → Knows which skill

**Ambiguous requests (routing needed)**:
- ❌ "help me with this file" → skill-registry routes via embeddings

### 1. CLI Handler (`src/activation/cli-handler.ts`)

⚠️ **Design Flow** (Not Implemented): Flow below shows intended architecture. Actual implementation TBD.

**Flow**:
```
tinyarms lint file.ts
  ↓
Parse: command="lint", args={file}
  ↓
Map: "lint" → "code-linting"
  ↓
Load: skills/code-linting/index.ts
  ↓
Execute: execute({file})
```

**No routing** - Direct command mapping

### 2. Scheduler (`src/core/scheduler.ts`)

⚠️ **Design Flow** (Not Implemented): Flow below shows intended architecture. Actual implementation TBD.

**Flow**:
```
On startup: Read all config.yaml
  ↓
Find: activation.automated = true
  ↓
Schedule: cron OR file watchers
  ↓
On trigger: Execute skill directly
  ↓
Log to SQLite
```

**No routing** - Config specifies skill

### 3. GUI Handler (`src/activation/gui-handler.ts`)

**Status**: Future (SwiftUI menu bar)

**Flow**:
```
User clicks menu → Selects skill → Execute directly
```

**No routing** - User chooses skill

### 4. Ambiguous Request Handler

⚠️ **Design Flow** (Not Implemented): Flow below shows intended architecture. Actual implementation TBD.

**Flow**:
```
Input: "help me with this file"
  ↓
skill-registry.route(input)
  ↓
Extract all SKILL.md descriptions
  ↓
embeddinggemma: Semantic match
  ↓
Return: Best matching skill name
  ↓
Load + execute skill
```

**Uses routing** - Doesn't know skill upfront

---

## Industry Validation

**90% aligned** with industry best practices (FrugalGPT, RouteLLM, GitHub Copilot).

**See research/01-industry-validation.md for complete analysis** (25+ papers, 8 projects, 6 case studies)

## Skills (Implementation Status)

| Skill | Status | Model | Use Case |
|-------|--------|-------|----------|
| code-linting | Phase 1 (SKILL.md generated) | Qwen2.5-Coder-3B | Pre-commit hooks |
| file-naming | Planned (Phase 3) | Gemma 3 4B | Batch rename |
| markdown-analysis | Planned (Phase 3) | Gemma 3 4B | Track .specify/ |
| audio-actions | Planned (Phase 3) | Gemma 3 4B | Voice → actions |

**Architecture details**: See [research/04-openskills-integration-decision.md](research/04-openskills-integration-decision.md)
**Skill configuration**: See [03-SKILLS.md](03-SKILLS.md)

## Next Steps

**For detailed information**:
1. **Models**: See [01-MODELS.md](01-MODELS.md) - Model decisions, benchmarks, performance
2. **Configuration**: See [02-CONFIGURATION.md](02-CONFIGURATION.md) - Setup, storage, config system
3. **Integrations**: See [03-INTEGRATIONS.md](03-INTEGRATIONS.md) - MCP, LaunchAgent, MacWhisper, SwiftUI
4. **Skills**: See [03-SKILLS.md](03-SKILLS.md) - Detailed skill configuration and usage
5. **Research**: See [research/*.md](research/) - Industry validation, implementation patterns

---

**Note**: This is a reference implementation (0% executable code). Architecture shown is for design illustration, not actual execution.
