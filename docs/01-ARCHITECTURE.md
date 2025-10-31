# 01 - Architecture

**High-level overview of tinyArms architecture**

For detailed implementation, model decisions, configuration, and integrations, see the specialized docs linked below.

---

## System Overview

```
Activation Modes (Entry Points)
├─ CLI Handler (tinyarms lint file.ts) → Direct skill invocation
├─ Scheduler (cron/file watchers) → Automated skill execution
├─ GUI Handler (SwiftUI, future) → User-selected skill
└─ Ambiguous Requests → Routing layer (optional)
          ↓
    Routing Layer (Optional - Ambiguous Requests Only)
├─ skill-registry.ts (auto-discovers skills/)
├─ Extracts SKILL.md frontmatter (name + description)
├─ Hybrid routing: Keywords → embeddings
└─ embeddinggemma:300m for semantic matching
          ↓
    Skills Layer (Self-Contained Execution Units)
├─ code-linting/ (SKILL.md + config.yaml + index.ts + executor.ts)
├─ file-naming/ (same structure)
├─ markdown-analysis/ (same structure)
└─ audio-actions/ (same structure)
          ↓
    Tiered Routing (Per Skill, Configured in config.yaml)
├─ Level -1: Semantic Cache (Phase 03, researched, 15-25% elimination)
│  └─ Vector similarity >0.95 → return cached (<50ms)
├─ Level 0: Deterministic rules (<1ms, 60-75% of tasks)
│  └─ Keyword extraction, file type detection, kebab-case formatting
├─ Level 1: embeddinggemma 300M (<100ms, 20-25% of tasks)
│  └─ Semantic routing, intent classification (200MB)
├─ Level 2: Small specialists (2-4s, 10-15% of tasks)
│  ├─ Primary: Qwen2.5-Coder-3B-Instruct (1.9GB, code linting)
│  ├─ Answer Consistency Scoring (Phase 02, researched)
│  │  └─ Generate N=3, similarity >0.85 → accept, <0.85 → escalate
│  ├─ Secondary: Qwen3-4B-Instruct (2.5GB, general tasks, optional)
│  └─ Optional: Gemma 3 4B (2.3GB, file naming/markdown, reused from Cotypist)
├─ Level 3: Deep analysis (10-15s, optional, <5% of tasks)
│  └─ Qwen2.5-Coder 7B (4.7GB, architectural violations, weekly scans)
└─ Industry Validation: 90% aligned (FrugalGPT, RouteLLM, GitHub Copilot patterns)
          ↓
    Storage
├─ SQLite (task history, metrics, feedback)
└─ Config (YAML per skill + global settings)
          ↓
    Models (Ollama)
├─ embeddinggemma:300m (200MB, semantic routing)
├─ Qwen2.5-Coder-3B-Instruct (1.9GB, primary Level 2 for code)
├─ Qwen3-4B-Instruct (2.5GB, secondary Level 2 for general tasks, optional)
├─ Gemma 3 4B (2.3GB, optional Level 2, reused from Cotypist)
└─ Qwen2.5-Coder 7B (4.7GB, optional Level 3 for deep analysis)
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

## Skills Layer

**Status**: Architecture defined (2025-10-30)
**Implementation**: Phase 1 in progress (code-linting)

### Overview

Skills are self-contained execution units. Each skill:
- Defines WHAT it does (SKILL.md - OpenSkills format)
- Configures HOW it runs (config.yaml - runtime settings)
- Implements core logic (executor.ts - model inference)
- Exports standard interface (index.ts - execute + getConfig)

### Structure (Per Skill)

```
skills/{name}/
├── SKILL.md           # OpenSkills format (for agents)
├── config.yaml        # Runtime config (model, activation, schedule)
├── index.ts           # Exports execute() + getConfig()
├── executor.ts        # Core logic (model loading, inference)
├── scripts/           # Optional: Helper scripts
├── references/        # Optional: Docs for context
└── assets/            # Optional: Templates
```

### Interface (Flexible Per Skill)

Each skill exports:
```typescript
export async function execute(input: any): Promise<any>
export function getConfig(): SkillConfig
```

**Note**: Input/output schemas are skill-specific (not standardized)

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

### config.yaml Schema

| Section | Purpose |
|---------|---------|
| `model` | Tiered routing config (level, primary, fallback, threshold) |
| `activation` | Which modes enabled (cli, automated, gui) |
| `schedule` | Automated execution (cron, watch_patterns, batch_size) |
| `performance` | Resource limits (latency, memory, battery) |
| `prompts` | System/user templates |

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
