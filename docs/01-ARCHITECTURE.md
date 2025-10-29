# 01 - Architecture

**Complete technical architecture for tinyArms**

---

## System Overview

```
Human & AI Agent Interfaces
├─ CLI (tinyarms command)
├─ MCP Server (for Claude Code integration)
├─ SwiftUI Menu Bar App (planned)
└─ LaunchAgents (scheduled automation)
          ↓
    Core Engine (Tiered Router with Confidence Scoring)
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
    Skills
├─ code-linting-fast (pre-commit, Level 2: Qwen2.5-Coder-3B-Instruct, priority 2)
├─ code-linting-deep (weekly scan, Level 3: Qwen 7B, optional)
├─ file-naming (batch every 5 mins, Level 2: optional specialist)
├─ markdown-analysis (every 2 hours, .specify/memory/)
└─ audio-actions (MacWhisper → SUGGEST ACTIONS not summary)
          ↓
    Storage
├─ SQLite (task history, metrics, feedback)
└─ Config (YAML for humans, JSON API for agents)
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

### Level 0: Deterministic Rules (<1ms)

**Purpose**: Instant responses for pattern-matching tasks

**Examples**:
- Filename formatting (kebab-case)
- Keyword extraction (RAKE algorithm)
- File type detection (extension + path)
- Directory mapping (lookup tables)
- Voice transcript cleaning

**Characteristics**:
- Speed: <1ms
- Accuracy: 100% (when rules match)
- Size: 0 bytes
- **Target: Handle 60-75% of tasks here**

**Implementation**:
```typescript
// Pseudo code
function level0Router(task: Task): Result | null {
  // Try deterministic rules first
  if (task.type === 'file_naming' && hasSimplePattern(task.filename)) {
    return formatFilename(task.filename); // <1ms
  }

  // If no rule matches, escalate to Level 1
  return null;
}
```

### Level 1: Tiny Embeddings (<100ms)

**Purpose**: Semantic understanding layer for routing (NOT generative)

**Model**: embeddinggemma:300m (200MB)
**Speed**: <15ms per embedding on M2
**Output**: 768-dimensional vectors

**Use Cases**:
1. **File type classification**
   - Input: "Screenshot of mobile app"
   - Output: `{type: "screenshot", confidence: 0.92}`
   - If confidence >= 0.80 → Use Level 0 rules
   - If confidence < 0.80 → Escalate to Level 2

2. **Intent extraction from voice**
   - Input: "um, like, rename this to hero mockup"
   - Output: `{intent: "rename_file", confidence: 0.88}`
   - If confidence >= 0.80 → Execute rename action
   - If confidence < 0.80 → Ask user for clarification

3. **Constitutional principle similarity search**
   - Input: Code snippet with potential violation
   - Output: Top 3 matching constitutional principles
   - Pass to Level 3 as context

**Why Level 1?**
- Catches 20-25% of tasks that rules can't handle but don't need full LLM
- Saves 2-4 seconds per task vs jumping straight to Level 2
- Provides semantic understanding WITHOUT generating text

**Characteristics**:
- Speed: <100ms
- Accuracy: 85-90% (classification)
- Size: 200MB
- **Target: Handle 20-25% of tasks here**

**Full details**: See [EMBEDDINGGEMMA.md - Level 1 section]

### Level 2: Small Generalists (2-4s)

**Purpose**: Complex reasoning and generation

**Multi-Model Architecture**:

#### Primary: Qwen2.5-Coder-3B-Instruct (Code Linting)
- **Size**: 1.9GB
- **Role**: Constitutional code linting, pattern detection
- **Benchmarks**: 84.1% HumanEval, 73.6% MBPP, 72.1% MultiPL-E avg
- **Speed**: 80-110 tokens/sec on M2 Air (~2-3s per file)
- **Detects**: Hardcoded colors, magic numbers, file size violations, simple DRY, import aliases
- **Accuracy**: 85% (15% miss rate on complex violations)

**Why Qwen2.5-Coder-3B?**
- ✅ 84.1% HumanEval (beats Qwen3-4B-Instruct's 62% base)
- ✅ Code-specialized (5.5T code tokens across 92 languages)
- ✅ 600MB smaller + 20-30% faster than 4B models
- ✅ Priority 2 compatible (2-3s for pre-commit hooks)

#### Secondary: Qwen3-4B-Instruct (General Tasks, Optional)
- **Size**: 2.5GB
- **Role**: Non-code instruction-following tasks
- **Benchmarks**: 83.4% IFEval, 76.8% MultiPL-E
- **Use when**: Need superior instruction-following, NOT code analysis

#### Optional Specialists
- **Gemma 3 4B** (2.3GB) - File naming, markdown analysis, audio actions
  - Can reuse from Cotypist (no duplicate download)
- **Custom specialists** - Add per-skill via config

**Characteristics**:
- Speed: 2-4s
- Accuracy: 85-90%
- Size: 1.9-2.5GB each
- **Target: Handle 10-15% of tasks here**

**Full details**: See [01-MODELS.md - Level 2 section]

### Level 3: Code Specialists (10-15s, Optional)

**Purpose**: Deep architectural analysis (optional)

**Model**: Qwen2.5-Coder 7B (4.7GB)
**Speed**: 30-50 tokens/sec on M2 Air (~10-15s per file)
**Benchmarks**: 88.4% HumanEval (SOTA for 7B)

**What it catches (vs Level 2)**:
- Architectural anti-patterns (God objects, circular deps)
- Complex DRY violations (semantic duplication, different syntax)
- Cross-file pattern analysis
- Component decomposition issues
- Implicit design pattern violations

**Accuracy**: 95% (vs 85% for Level 2)

**When to install**:
- Level 2 misses >10% violations
- Need architectural enforcement (Constitution Principle III, XIII)
- Want weekly deep scans (not pre-commit blocking)

**Idle-Only Scheduling**:
```yaml
code-linting-deep:
  model: qwen2.5-coder:7b
  schedule:
    type: idle_only
    min_idle_minutes: 15        # Mac idle >15 min
    require_ac_power: true       # Only when plugged in
    min_free_memory_gb: 7        # Need 7GB free before loading
    time_window: "22:00-06:00"   # Optional: 10pm-6am only
```

**Characteristics**:
- Speed: 10-15s
- Accuracy: 95%
- Size: 4.7GB
- **Target: Handle <5% of tasks here**

**Full details**: See [01-MODELS.md - Level 3 section]

---

## Confidence Scoring (Phase 02, Researched)

**Status**: Researched - ready for implementation (Week 3)
**Expected Impact**: 20-30% reduction in Level 3 escalations

**Problem**: Level 2 doesn't know when its answer is good enough vs when to escalate to Level 3

**Solution**: Answer Consistency Scoring at Level 2
- Generate N=3 responses with temperature=0.7
- Measure semantic similarity between all 3
- Threshold: >0.85 consistency → accept Level 2
- Threshold: <0.85 consistency → escalate to Level 3

**How it works**:
```python
# Generate 3 responses
responses = [qwen_3b.generate(query, temp=0.7) for _ in range(3)]

# Measure consistency (cosine similarity)
consistency = measure_pairwise_similarity(responses)

if consistency > 0.85:
    return responses[0]  # Confident - use Level 2
else:
    escalate_to_level_3()  # Uncertain - need deeper analysis
```

**Why this works**: LLMs produce consistent answers when confident, inconsistent when uncertain

**Trade-offs**:
- Latency: +500ms at Level 2 (3 generations + similarity check)
- Accuracy: Prevents false confidence (catches uncertain Level 2 responses)
- Cost: Slightly more Level 2 inference, but 20-30% fewer expensive Level 3 calls

**Confidence Thresholds** (starting values, tune in production):

| Transition | Metric | Threshold | Reasoning |
|------------|--------|-----------|-----------|
| L1 → L2 | Embedding similarity | <0.90 | Semantic match must be strong |
| L2 → L3 | Answer consistency | <0.85 | Level 2 uncertainty indicator |
| L3 → Human | Logit confidence | <0.50 | Even large model uncertain |

**Industry validation**: AutoMix (NeurIPS 2024) achieves 50%+ cost reduction via self-verification

**Full details**:
- [research/02-confidence-scoring-patterns.md](research/02-confidence-scoring-patterns.md)
- [research/02-threshold-calibration-guide.md](research/02-threshold-calibration-guide.md)

---

### Level -1: Semantic Cache (Phase 03, Researched)

**Status**: Researched - ready for implementation (Week 4)
**Expected Impact**: 15-25% query elimination

**Problem**: tinyArms processes every query from scratch, even identical/similar questions

**Solution**: Vector similarity cache BEFORE Level 0
- Embed query (reuse embeddinggemma from Level 1)
- Search vector DB for similar cached queries
- Threshold: >0.95 similarity → return cached response (<50ms)
- Cache miss → continue to Level 0

**What gets cached**:
- Level 2 responses (Qwen-3B)
- Level 3 responses (Qwen-7B)
- NOT Level 0/1 (already fast)

**Performance**:
- Cache hit: ~50-60ms (embedding + search)
- Cache miss overhead: +50ms (acceptable on 2-3s total)
- First query: 2-3s (Level 2 LLM)
- Repeat similar query: ~60ms (cache hit)
- **40x speedup for repeated queries**

**Memory**: 500MB-800MB for 100K cached entries

**Industry validation**: FrugalGPT (Stanford) uses cache as Tier 0, contributes to 98% cost reduction

**Full details**: See [research/03-semantic-caching-design.md](research/03-semantic-caching-design.md)

---

## Industry Validation (Researched 2025-10-29)

**Verdict**: tinyArms architecture is **90% aligned** with industry best practices

**Research sources**: 25+ academic papers, 8 open-source projects, 6 production case studies

### What's Validated ✅

**1. Four-Tier Cascade**
- **tinyArms**: Rules → Embedding → 3B LLM → 7B LLM
- **Industry**: FrugalGPT (Stanford) uses 4 tiers, achieves 98% cost reduction
- **Verdict**: Justified (most systems use 2-3, but 4 is valid if L0 hit rate >30%)

**2. Code-Specialized Models**
- **tinyArms**: Qwen2.5-Coder-3B, Qwen2.5-Coder-7B
- **Industry**: GitHub Copilot, Continue.dev, Cursor all use code-specific models
- **Performance**: +15-20% accuracy vs general models at same parameter count
- **Verdict**: Optimal choice for coding workloads

**3. Embedding Model**
- **tinyArms**: embeddinggemma-300m (768-dim, 308M params)
- **Industry**: Best multilingual model <500M params (MTEB ~70)
- **Competitors**: Semantic Router (2.9k stars), Red Hat LLM-d, LangChain
- **Verdict**: Best-in-class for size

**4. Quantization Strategy**
- **tinyArms**: Q4 for all LLMs
- **Industry**: Q4 standard for consumer hardware (Ollama, llama.cpp)
- **Expected loss**: 2-5% accuracy degradation (acceptable)
- **Verdict**: Industry standard

### Critical Gaps (To Implement) ⚠️

**1. Semantic Caching** (Phase 03)
- Status: Missing, researched
- Impact: 15-25% query elimination
- Timeline: Week 4 implementation

**2. Confidence Scoring** (Phase 02)
- Status: Missing, researched
- Impact: 20-30% reduction in L3 escalations
- Timeline: Week 3 implementation

**3. Cross-Encoder Reranker** (Phase 04, optional)
- Status: Missing, researched
- Impact: +10-15% retrieval precision
- Timeline: Week 5, only if L1 accuracy <80%

### Comparison to Production Systems

| System | Architecture | Similarity | Key Difference |
|--------|--------------|------------|----------------|
| **FrugalGPT** (Stanford) | Cache + 3 LLM tiers | 95% | tinyArms uses rules/embedding instead of cache (complementary) |
| **RouteLLM** (LMSYS) | Binary router (strong/weak) | 70% | tinyArms adds pre-LLM filtering (rules, embedding) |
| **Semantic Router** (Aurelio Labs) | BERT embedding only | 60% | tinyArms adds LLM fallback (Level 2, 3) |
| **GitHub Copilot** | Task-specific code models | 85% | tinyArms adds tiered routing (cost optimization) |
| **Continue.dev** | User-configurable models | 80% | tinyArms adds automatic routing (intelligence) |

### Alignment Score: 90%

**What's aligned**:
- ✅ Tier architecture (4-tier validated by FrugalGPT)
- ✅ Model choices (code-specialized, embedding model, quantization)
- ✅ Cost-optimization focus (matches RouteLLM, AutoMix)

**What's missing (but researched)**:
- ⚠️ Confidence scoring (AutoMix pattern)
- ⚠️ Semantic caching (FrugalGPT pattern)
- ⚠️ Observability (OpenTelemetry standard)

**Confidence**: HIGH - Multiple independent validations across academic research and production systems

**Full details**: See [research/01-industry-validation.md](research/01-industry-validation.md)

---

## Skills

### code-linting-fast (Pre-commit, Priority 2)

**Model**: Qwen2.5-Coder-3B-Instruct (Level 2)
**Speed**: 2-3s per file
**Source**: `.specify/memory/constitution.md` (17 principles)

**Detects**:
- Hardcoded colors, magic numbers
- File size violations (>350 LOC)
- Import alias violations
- Missing line references
- Simple DRY violations
- Design token violations

**Accuracy**: 85% (15% miss rate on complex violations)

**Usage**:
```bash
# Pre-commit hook
tinyarms run code-linting-fast --json

# Manual
tinyarms run code-linting-fast src/
```

### code-linting-deep (Weekly Scans, Optional)

**Model**: Qwen2.5-Coder 7B (Level 3, optional)
**Speed**: 10-15s per file
**Schedule**: Sunday 2am (idle-only)

**Detects** (vs fast):
- Complex DRY violations (semantic duplication)
- Architectural anti-patterns
- Cross-file pattern analysis
- Component decomposition issues

**Accuracy**: 95%

**Usage**:
```yaml
skills:
  code-linting-deep:
    enabled: false              # Optional, enable manually
    model: level3
    schedule: "0 2 * * 0"      # Sunday 2am
```

### file-naming (Optional Specialist)

**Model**: Gemma 3 4B (Level 2, optional)
**Speed**: 2-4s per file
**Schedule**: Batch every 5 mins

**Transforms**:
- `Screenshot 2024.png` → `hero-mockup-mobile.png`
- `IMG_1234.jpg` → `golden-gate-sunset.jpg`

**Usage**:
```bash
tinyarms run file-naming ~/Downloads --dry-run
```

### markdown-analysis (.specify/memory/)

**Model**: Gemma 3 4B (Level 2, optional)
**Speed**: 2-4s per file
**Schedule**: Every 2 hours

**Detects**:
- Constitutional changes
- Conflicting decisions
- Documentation updates

**Usage**:
```bash
tinyarms run markdown-analysis ~/.specify/memory/
```

### audio-actions (MacWhisper → Actions)

**Model**: Gemma 3 4B (Level 2, optional)
**Speed**: 3-5s per transcription
**Source**: MacWhisper exports to `~/Documents/Transcriptions/`

**Extracts**:
- Intent: What speaker wants
- Actions: Specific tasks to do
- Priority: High/medium/low
- Context: Deadlines, people, dependencies

**Important**: SUGGEST ACTIONS (not summary)

**Usage**: Manual export from MacWhisper → tinyArms auto-processes

**Full details**: See [03-INTEGRATIONS.md - MacWhisper section]

---

## MCP Integration (Bidirectional)

### AI Agents → tinyArms

**Purpose**: Claude Code/Aider/Cursor call tinyArms tools via MCP

**Available Tools**:
- `rename_file` - Intelligent file naming
- `lint_code` - Constitutional code review
- `analyze_changes` - Markdown change detection
- `extract_keywords` - Text processing
- `query_system` - System state queries

**Example**:
```typescript
// Claude Code context
User: "Lint all TypeScript files against our constitution"

Claude Code:
1. Calls lint_code tool for each .ts file
2. Aggregates violations
3. Shows user the results with file:line references
```

### tinyArms → Other MCP Servers

**Purpose**: Access external tools to enhance skills

**Integrated MCP Servers**:
- **GitHub MCP**: Fetch PR context during linting
- **Context7 MCP**: Official library docs
- **Filesystem MCP**: Read local project files
- **Figma MCP**: Design specs (future)

**Example**:
```
Claude Code: "Lint this file"
  ↓
tinyArms (Qwen 7B) + GitHub MCP (fetch PR context)
  ↓
Returns: Constitutional violations with line refs
```

**Full details**: See [03-INTEGRATIONS.md - Claude Code section]

---

## Storage Management

### SQLite Database

**Purpose**: Persistent state management

**Tables**:
- `task_history` - Execution records
- `user_feedback` - Learning data
- `performance_metrics` - Speed/accuracy tracking
- `cache_entries` - Router cache
- `statistics` - Analytics

**Location**: `~/.config/tinyarms/tinyarms.db`

### Configuration System

**YAML for humans** (`~/.config/tinyarms/config.yaml`):
```yaml
models:
  level1: embeddinggemma:300m
  level2-code: qwen2.5-coder:3b

skills:
  code-linting-fast:
    enabled: true
    model: level2-code
```

**JSON API for agents**:
```bash
# Query config programmatically
tinyarms config show --json | jq '.skills["code-linting-fast"]'
```

---

## LaunchAgent Automation

**Purpose**: macOS-native scheduling

**Features**:
- Time-based triggers (every 2 hours, every 5 mins)
- File watching (instant triggers)
- Power-aware (AC only for Level 3)
- Idle detection (don't interrupt work)
- Auto-restart on failure

**Example LaunchAgent**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.tinyarms.file-naming</string>

  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/tinyarms</string>
    <string>run</string>
    <string>file-naming</string>
    <string>~/Downloads</string>
  </array>

  <key>StartInterval</key>
  <integer>300</integer> <!-- 5 minutes -->

  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
```

**Full details**: See [04-launchagent-ideations.md]

---

## SwiftUI Menu Bar App (Planned)

**Purpose**: Native macOS interface for non-coders

**Features**:
- 🦖 Menu bar icon with status indicators
- Quick skill execution (⌘1, ⌘2, ⌘3)
- Activity log viewer
- Visual settings (no YAML editing)
- Native notifications with actions
- iOS sync via Pushover API

**Full details**: See [04-swiftui-app-ideations.md]

---

## Performance Characteristics

### Speed (M2 MacBook Air)

| Level | Model | Speed | Coverage |
|-------|-------|-------|----------|
| 0 | Rules | <1ms | 60-75% |
| 1 | embeddinggemma | <100ms | 20-25% |
| 2 | Qwen2.5-Coder-3B | 2-3s | 10-15% |
| 3 | Qwen2.5-Coder 7B | 10-15s | <5% |

### Memory (M2 MacBook Air 16GB)

| State | RAM Usage | Free RAM |
|-------|-----------|----------|
| Idle | ~100MB | ~15.9GB |
| Level 1 loaded | ~300MB | ~15.7GB |
| Level 2 loaded | ~3.2GB | ~12.8GB |
| Level 3 loaded | ~6GB | ~10GB |
| Peak (L2 + L3) | ~9.5GB | ~6.5GB ✅ SAFE |

### Battery Impact (Estimates)

| Configuration | Impact |
|--------------|--------|
| Minimal schedule | ~1%/day |
| With code linting | ~3%/day |
| File watching only | ~0.5%/day |
| **Recommended** | Hybrid (watching + scheduled, L3 on-demand) |

---

## Design Principles

### NOTHING HARD CODED

- All paths configurable in `config.yaml`
- All thresholds tunable
- All models swappable
- All prompts in separate `.md` files

### DRY Enforcement

- Plugin system: Skills share common executor
- Watchers share common debouncing logic
- Prompts use templates with variables
- Config validates once, used everywhere

### Agent-First Design

- Equal priority for AI agents (MCP, CLI with JSON)
- Works seamlessly with Claude Code/Aider/Cursor
- All commands support `--json` flag

---

## Next Steps

1. **Understand Models**: Read [01-MODELS.md](01-MODELS.md)
2. **Install**: Follow [02-INSTALLATION.md](02-INSTALLATION.md)
3. **Configure**: Read [02-CONFIGURATION.md](02-CONFIGURATION.md)
4. **Integrate**: Read [03-INTEGRATIONS.md](03-INTEGRATIONS.md)

---

**Note**: This is a reference implementation (0% executable code). Architecture shown is for design illustration, not actual execution.
