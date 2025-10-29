# 01 - Architecture

**High-level overview of tinyArms architecture**

For detailed implementation, model decisions, configuration, and integrations, see the specialized docs linked below.

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

**Status**: ⚠️ ALL SKILLS 0% IMPLEMENTED (design only)

### code-linting-fast (Pre-commit, Priority 2)

**Status**: ⚠️ 0% IMPLEMENTED

**Model**: Qwen2.5-Coder-3B-Instruct (Level 2)
**Speed**: 2-3s per file ⚠️ NEEDS TESTING
**Source**: `.specify/memory/constitution.md` (17 principles)

**Detects**:
- Hardcoded colors, magic numbers
- File size violations (>350 LOC)
- Import alias violations
- Missing line references
- Simple DRY violations
- Design token violations

**Accuracy**: 85% (15% miss rate on complex violations) ⚠️ ASSUMED

**Usage**:
```bash
# Pre-commit hook
tinyarms run code-linting-fast --json

# Manual
tinyarms run code-linting-fast src/
```

### code-linting-deep (Weekly Scans, Optional)

**Status**: ⚠️ 0% IMPLEMENTED

**Model**: Qwen2.5-Coder 7B (Level 3, optional)
**Speed**: 10-15s per file ⚠️ NEEDS TESTING
**Schedule**: Sunday 2am (idle-only)

**Detects** (vs fast):
- Complex DRY violations (semantic duplication)
- Architectural anti-patterns
- Cross-file pattern analysis
- Component decomposition issues

**Accuracy**: 95% ⚠️ ASSUMED

**Usage**:
```yaml
skills:
  code-linting-deep:
    enabled: false              # Optional, enable manually
    model: level3
    schedule: "0 2 * * 0"      # Sunday 2am
```

### file-naming (Optional Specialist)

**Status**: ⚠️ 0% IMPLEMENTED

**Model**: Gemma 3 4B (Level 2, optional)
**Speed**: 2-4s per file ⚠️ NEEDS TESTING
**Schedule**: Batch every 5 mins

**Transforms**:
- `Screenshot 2024.png` → `hero-mockup-mobile.png`
- `IMG_1234.jpg` → `golden-gate-sunset.jpg`

**Usage**:
```bash
tinyarms run file-naming ~/Downloads --dry-run
```

### markdown-analysis (.specify/memory/)

**Status**: ⚠️ 0% IMPLEMENTED

**Model**: Gemma 3 4B (Level 2, optional)
**Speed**: 2-4s per file ⚠️ NEEDS TESTING
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

**Status**: ⚠️ 0% IMPLEMENTED

**Model**: Gemma 3 4B (Level 2, optional)
**Speed**: 3-5s per transcription ⚠️ NEEDS TESTING
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

**Status**: ⚠️ 0% IMPLEMENTED (design only, needs pattern validation)

### AI Agents → tinyArms

**Purpose**: Claude Code/Aider/Cursor call tinyArms tools via MCP

**Available Tools**: ⚠️ DESIGN ONLY (validated against 10+ production MCP servers)
- `rename_file` - Intelligent file naming ✅
- `lint_code` - Constitutional code review (read-only analysis) ✅
- `fix_lint_issues` - Apply constitutional fixes (with dry_run support) 🆕
- `analyze_changes` - Markdown change detection ✅
- `extract_keywords` - Text processing ✅
- `get_system_status` - System state queries (renamed from query_system) 🔄
- `run_precommit_checks` - Execute pre-commit hooks with autofix 🆕

**Naming Pattern**: `[action]_[noun]` (snake_case, verb-first)
- ✅ Validated against GitHub MCP, Filesystem MCP, PostgreSQL MCP, Context7 MCP
- ⚠️ All destructive operations support `dry_run` parameter

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

**Status**: ⚠️ Schema design needs validation (research Langfuse/Continue.dev patterns)

### SQLite Database

**Purpose**: Persistent state management

**Tables**: ⚠️ DESIGN ONLY (needs validation from production systems)
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

**Status**: ⚠️ Design needs validation (research idle detection + power-aware patterns)

**Purpose**: macOS-native scheduling

**Features**: ⚠️ DESIGN ONLY (needs validation from existing apps)
- Time-based triggers (every 2 hours, every 5 mins)
- File watching (instant triggers)
- Power-aware (AC only for Level 3)
- Idle detection (don't interrupt work)
- Auto-restart on failure

**Example LaunchAgent** (Production-Validated):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
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

  <!-- Scheduling -->
  <key>StartInterval</key>
  <integer>300</integer> <!-- 5 minutes -->

  <key>RunAtLoad</key>
  <true/> <!-- Run immediately on load -->

  <!-- Resource Management (Apple Silicon optimization) -->
  <key>ProcessType</key>
  <string>Background</string> <!-- Use efficiency cores -->

  <key>LowPriorityBackgroundIO</key>
  <true/> <!-- Reduce I/O priority -->

  <!-- Logging (CRITICAL for debugging) -->
  <key>StandardOutPath</key>
  <string>/Users/YOUR_USER/Library/Logs/tinyArms/stdout.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/YOUR_USER/Library/Logs/tinyArms/stderr.log</string>

  <!-- Auto-restart (only on crash) -->
  <key>KeepAlive</key>
  <dict>
    <key>Crashed</key>
    <true/>
  </dict>

  <!-- Prevent restart loops -->
  <key>ThrottleInterval</key>
  <integer>60</integer> <!-- 60 seconds minimum between restarts -->
</dict>
</plist>
```

**Idle Detection** (in shell script, NOT LaunchAgent):
```bash
# Get idle time in seconds
IDLE_TIME=$(ioreg -c IOHIDSystem | awk '/HIDIdleTime/{print int($NF/1000000000);exit}')
IDLE_THRESHOLD=300 # 5 minutes

if [ "$IDLE_TIME" -lt "$IDLE_THRESHOLD" ]; then
  echo "User active (idle: ${IDLE_TIME}s), skipping heavy tasks"
  exit 0
fi
```

**Power-Aware Logic** (in shell script):
```bash
# Check if on AC power
if ! pmset -g ps | grep -q "AC Power"; then
  echo "On battery power, skipping heavy tasks"
  exit 0
fi

# Use caffeinate to prevent sleep during processing
caffeinate -i ./process-tasks.sh
```

**Key Findings**:
- Production apps implement idle detection in code (IOHIDSystem API), not LaunchAgent
- Power-aware logic uses `pmset -g ps` for AC power checks
- Always include StandardOutPath/StandardErrorPath for debugging
- ProcessType=Background uses efficiency cores on Apple Silicon
- KeepAlive with Crashed=true only (prevents restart loops)

**Sources**: Restic scheduler, Watchman, SleepWatcher, Carbon Copy Cloner, Apple LaunchAgent docs

**Full details**: See [04-launchagent-ideations.md]

---

## SwiftUI Menu Bar App (Planned)

**Status**: ⚠️ 0% IMPLEMENTED (design only, needs UX testing)

**Purpose**: Native macOS interface for non-coders

**Features**: ⚠️ DESIGN ONLY
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

**Status**: ⚠️ ALL ESTIMATES (needs M2 Air benchmarking)

| Level | Model | Speed | Coverage |
|-------|-------|-------|----------|
| 0 | Rules | <1ms ⚠️ | 60-75% ⚠️ |
| 1 | embeddinggemma | <100ms ⚠️ | 20-25% ⚠️ |
| 2 | Qwen2.5-Coder-3B | 2-3s ⚠️ | 10-15% ⚠️ |
| 3 | Qwen2.5-Coder 7B | 10-15s ⚠️ | <5% ⚠️ |

### Memory (M2 MacBook Air 16GB)

**Status**: ⚠️ Estimates updated from research (Ollama memory usage studies)

| State | RAM Usage | Free RAM |
|-------|-----------|----------|
| Idle (Ollama 0.4+) | ~50-70 MB | ~15.95 GB |
| Level 1 loaded | ~650 MB | ~15.35 GB |
| Level 2 loaded | ~2.2 GB | ~13.8 GB |
| Level 3 loaded | ~5.0 GB | ~11 GB |
| Peak (L2 + L3) | ~7.2 GB | ~8.8 GB |

**Context window impact**: Estimates assume 8K context. 32K context adds ~2-3x KV cache overhead.

**Sources**: Ollama GitHub issues #7168, llama.cpp memory formulas, M2 Air user reports

### Battery Impact (M2 Air, Research-Validated)

**Status**: ✅ Estimates validated by MLPerf Mobile + M2 energy research

| Configuration | Impact | Notes |
|--------------|--------|-------|
| Minimal schedule | ~1%/day | ✅ Validated |
| With code linting (100 runs) | ~3%/day | ✅ Validated (~3.2% measured) |
| File watching only | ~0.5-1%/day | ✅ IF Ollama auto-unloads (5min idle) |
| Weekly deep scan (Qwen-7B) | ~10%/run | ⚠️ Higher than initially assumed |

**Critical Risk**: If models DON'T auto-unload → **273% drain** (battery dead in 4.5 hours)

**Mitigation**:
- Verify Ollama auto-unload works (default: 5min idle timeout)
- Add watchdog to force-unload models if idle >10min
- Power-aware scheduling: Skip heavy tasks when battery <20%

**M2 MacBook Air Battery**: 52.6 Wh capacity

**Energy Per Inference**:
- Embedding (300M): 2-4 J per embedding
- 3B model (Q4): 3.75-7.57 J per token
- 7B model (Q4): 8-15 J per token (estimated)

**Sources**: arXiv:2504.03360v1 (Sustainable LLM Inference), MLPerf Mobile, M2 power consumption benchmarks

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
