# CLAUDE.md

**Inherits From**: `/Users/huy/CODES/nqh/CLAUDE.md`

This file contains tinyArms-specific overrides only. For constitutional principles, behavioral patterns, and shared code protocols, see the root CLAUDE.md.

---

## ⚠️ Critical: Architecture Reference Only

**Status**: 0% implemented - pseudo code and design documentation ONLY

**What exists**:
- ✅ Complete architecture design (4-level tiered routing)
- ✅ Type definitions (TypeScript interfaces)
- ✅ Model research (`embeddinggemma:300m` decided for Level 1)
- ✅ Configuration examples (YAML structure)

**What does NOT exist**:
- ❌ Working inference code
- ❌ Actual model integration
- ❌ Executable CLI commands
- ❌ Database implementation

**Before implementing ANY feature**: Confirm with user whether to build executable code or continue as reference architecture.

---

## Project Overview

**tinyArms** - Local AI assistant using tiny models (<500MB) for 24/7 filesystem watching and constitutional enforcement.

**Key Design**: 100% offline, memory-optimized for 8-16GB Macs, tiered routing (fast rules before expensive AI).

**Core Use Cases**:
1. Rename screenshots intelligently (`Screenshot 2024.png` → `hero-mockup-mobile.png`)
2. Lint code against constitutional principles
3. Track changes in `.specify/memory/` documentation
4. Convert voice transcriptions to structured data

---

## Architecture

### Tiered Routing (Performance-First)

```
Level 0: Deterministic Rules (<1ms, 60-75% coverage)
├─ File extension detection, regex patterns
└─ No AI, pure logic

Level 1: Tiny Embeddings (<100ms, 20-25% coverage)
├─ Model: embeddinggemma:300m (200MB)
├─ Purpose: Semantic classification, intent extraction
└─ Install: ollama pull embeddinggemma:300m

Level 2: Small Generalists (2-4s, 5-10% coverage)
├─ Model: Gemma 2 2B (1.5GB) [under research]
└─ Purpose: Complex file naming, NL tasks

Level 3: Code Specialists (10-15s, <5% coverage, idle-only)
├─ Model: Qwen2.5-Coder 7B (4.7GB) [under research]
├─ Trigger: Only when idle + AC power + 7GB free RAM
└─ Purpose: Code linting against constitution
```

**Performance Targets** (untested estimates):
- Accuracy: 90% overall (human-reviewable)
- Battery impact: 1-5%/day
- Memory peak: 1.8GB (8GB Mac), 9.5GB (16GB Mac)

**Full model research**: See `docs/MODEL-OPTIONS.md` (20+ models compared)

---

## MCP Integration (Bidirectional)

**AI agents → tinyArms**: Claude Code/Aider/Cursor call tinyArms tools via MCP
**tinyArms → Other MCP servers**: Access Figma, GitHub, databases to enhance skills

**Example**:
```
Claude Code: "Lint this file"
  ↓
tinyArms (Qwen 7B) + GitHub MCP (fetch PR context)
  ↓
Returns: Constitutional violations with line refs
```

---

## Memory Requirements

### 8GB RAM Mac
- **Levels 0-2**: 1.8GB total ✅ SAFE
- **Level 3**: Runs ONLY on idle/AC power (4.7GB model + 3GB KV cache = ~8GB peak)

### 16GB RAM Mac
- **All levels**: ~9.5GB peak ✅ SAFE (6GB free under load)

**Critical**: Heavy models (Level 3) use idle-only scheduling:
```yaml
code-linting:
  schedule:
    type: idle_only
    min_idle_minutes: 15
    require_ac_power: true
    min_free_memory_gb: 7
```

---

## Skills (Pseudo Code)

1. **file-naming** - Rename screenshots/downloads
2. **code-linting** - Enforce constitutional principles
3. **markdown-analysis** - Track `.specify/memory/` changes
4. **voice-actions** - Process transcriptions

**Adding skills**:
1. Create `.md` prompt template in `skills/`
2. Update `config.yaml` with skill definition
3. Implement routing logic in core engine

---

## Models

### ✅ Level 1 (Decided)

**Model**: `embeddinggemma:300m`
**Size**: 200MB
**Role**: Semantic understanding for routing (NOT generative)
**Docs**: `docs/EMBEDDINGGEMMA.md`

**Why**: Best quality under 500MB, multilingual (Hungarian, Vietnamese), <15ms per embedding on M2

**Install**:
```bash
ollama pull embeddinggemma:300m
```

### ✅ Level 2 (Decided)

**Primary Model**: `qwen2.5-coder:3b` (Qwen2.5-Coder-3B-Instruct)
**Size**: 1.9GB
**Role**: Constitutional code linting
**Benchmarks**: 84.1% HumanEval, 73.6% MBPP, 72.1% MultiPL-E avg

**Install**:
```bash
ollama pull qwen2.5-coder:3b
```

**Secondary Model**: `qwen3:4b` (Qwen3-4B-Instruct, optional)
**Size**: 2.5GB
**Role**: General instruction-following tasks
**Benchmarks**: 83.4% IFEval, 76.8% MultiPL-E

**Install** (optional):
```bash
ollama pull qwen3:4b
```

**Decision**: Code specialization (84.1% HumanEval) > General instruction-following for pattern-based linting.

### ⚠️ Level 3 (Optional)

**Model**: `qwen2.5-coder:7b` (Qwen2.5-Coder-7B-Instruct)
**Size**: 4.7GB
**Role**: Deep architectural analysis (optional, install only if Level 2 misses >10% violations)

**Full comparison**: `docs/MODEL-DECISIONS.md`

---

## CLI Commands (Pseudo Code Reference)

**Note**: These interfaces are designed but NOT implemented.

### Execution
```bash
tinyarms run file-naming ~/Downloads          # Run skill
tinyarms run file-naming --dry-run            # Preview
tinyarms run file-naming --json               # Machine-readable
```

### Monitoring
```bash
tinyarms status                               # System overview
tinyarms history                              # Recent tasks
tinyarms logs --tail 50 --follow              # Live logs
```

### Models
```bash
tinyarms models list                          # Installed models
tinyarms models load <model>                  # Load into memory
tinyarms models unload <model>                # Free memory
```

### MCP Server
```bash
tinyarms mcp-server                           # Start MCP integration
tinyarms mcp-server --port 3000               # Custom port
```

---

## Configuration

**Location**: `~/.config/tinyarms/config.yaml`

**Example**:
```yaml
system:
  ollama_host: http://localhost:11434

models:
  level1: embeddinggemma:300m   # 200MB
  level2: gemma2:2b              # 1.5GB
  level3: qwen2.5-coder:7b       # 4.7GB (idle-only)

skills:
  file-naming:
    enabled: true
    model: level2

  code-linting:
    enabled: true
    model: level3
    schedule:
      type: idle_only
      min_idle_minutes: 15
      require_ac_power: true
    constitution_path: ~/.specify/memory/constitution.md
```

**More examples**: `config/examples/` (balanced, aggressive configs)

---

## Documentation

### Architecture
- `docs/EMBEDDINGGEMMA.md` - Level 1 decision rationale
- `docs/MODEL-OPTIONS.md` - 20+ model comparison
- `IMPLEMENTATION.md` - Complete technical details
- `PROJECT_SUMMARY.md` - Built vs planned status

### Integration
- `docs/mcp-server-ideations.md` - MCP design
- `docs/swiftui-app-ideations.md` - GUI mockups
- `docs/launchagent-ideations.md` - Automation strategies

### Quick Start
- `QUICKSTART.md` - Setup guide (conceptual)

---

## Scope Guard (tinyArms-Specific)

**Reality check**: This app is 0% implemented (architecture only).

**Challenge requests**:
- "Build the CLI" → "Full CLI or specific command for testing?"
- "Add a skill" → "Pseudo code or executable implementation?"
- "Integrate with MCP" → "Design documentation or working server?"

**Force minimum viable versions** before expanding scope.

---

## Platform Requirements

- **OS**: macOS 12.0+ (Apple Silicon recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB+ for models
- **Dependencies**:
  - Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
  - Node.js 18+ (if using Transformers.js fallback)

---

## Quick Reference

**Type**: Local AI assistant (offline, macOS-native)
**Phase**: Architecture & research (0% implemented)
**Tech stack**: Node.js + Ollama + SQLite + LaunchAgents (planned)
**Unique trait**: Memory-optimized tiered routing (tiny models first)

**Before implementation**: Confirm executable code vs reference architecture with user.
