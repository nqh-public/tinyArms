# 🦖 tinyArms

**The Problem:**
- Claude Code can't reliably enforce your coding constitution
- Screenshots pile up: `Screenshot 2024-10-27.png`, `IMG_1234.jpg`
- Cloud AI won't watch your filesystem 24/7
- You need local, always-on enforcement that's modular and extensible

**The Solution:**
Tiny local AI models (<500MB) that watch your files 24/7, enforce your constitutional rules, and organize chaos automatically.

**How it works:**
- **Tiered routing:** 60% instant rules, 40% tiny AI models
  - Level 0: Deterministic (file extensions, regex) - <1ms
  - Level 1: Embeddings (classification, intent) - <100ms, 200MB
  - Level 2: Small LLMs (complex naming) - 2-4s, 1.5GB
  - Level 3: Code specialists (linting) - 10-15s, 4.7GB (idle-only)

**Bidirectional MCP Integration:**
- **AI agents USE tinyArms:** Claude Code/Aider/Cursor call tinyArms tools for linting, file naming, analysis
- **tinyArms USES other MCP servers:** Accesses external tools (Figma, GitHub, databases) to enhance skills
- **Example flow:** Claude Code asks tinyArms to lint → tinyArms uses GitHub MCP to check PR context → Returns results

**Key features:**
- **100% offline** - no cloud APIs, no data leaks (MCP servers are local)
- **8-16GB RAM optimized** - heavy models run only on idle/AC power
- **Modular & extensible** - plugin system for custom skills
- **File system watchers** - instant triggers on new files
- **LaunchAgent native** - macOS power-aware scheduling

Like a T-Rex - small arms, but surprisingly capable when working WITH larger AI agents.

---

## 🚧 Status: Architecture & Pseudo Code Only

**What exists:**
- ✅ Complete architecture design
- ✅ Type definitions (pseudo TypeScript)
- ✅ Level implementations (pseudo code with comments)
- ✅ Configuration examples
- ✅ Benchmark script (shows structure, not executable)

**What does NOT exist:**
- ❌ Working inference code
- ❌ Actual model integration
- ❌ CLI commands
- ❌ Database logic

**This is a REFERENCE IMPLEMENTATION showing structure, not execution.**

---

## Overview

tinyArms provides intelligent file management, code linting, and markdown analysis using local AI models. Designed for both human use (GUI) and AI agent integration (CLI/MCP).

**Core technology:**
- **embeddinggemma** (Level 1, 200MB) - Semantic understanding for routing
- Small generalists (Level 2, 1-2GB) - Complex tasks
- Code specialists (Level 3, 4-7GB) - Linting (idle-only)

**Why tinyArms?** Just like a T-Rex has tiny arms but gets things done, this system uses small AI models (not giant cloud APIs) to help you with everyday tasks.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 USER INTERFACES                     │
├─────────────────────────────────────────────────────┤
│  1. CLI           → ai-assistant <command>          │
│  2. MCP Server    → Claude Code integration         │
│  3. Menu Bar App  → Human control panel             │
│  4. LaunchAgent   → Scheduled automation            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                  CORE ENGINE                        │
│  - Tiered Router (Rules → Gemma → Qwen → Ask)     │
│  - Skills (file-naming, code-linting, etc.)        │
│  - SQLite State Management                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                MODEL LAYER                          │
│  - Ollama: Gemma 3 4B (general) + Qwen 7B (code)  │
└─────────────────────────────────────────────────────┘
```

## Features

- **🎯 90% Accuracy Target** - Good enough for daily use, human-reviewable
- **⚡ Tiered Routing** - Fast rules first (60-75%), AI only when needed
- **🔌 100% Offline** - No cloud, no APIs, no privacy concerns
- **🔋 Battery Efficient** - Smart scheduling, 1-5%/day impact
- **🤖 Agent-Friendly** - Works with Claude Code, Aider, Cursor via MCP
- **📊 Learning System** - Tracks feedback to improve over time
- **🎨 Native macOS** - LaunchAgents, SwiftUI (planned), menu bar app

## Skills

tinyArms includes these automation skills:

1. **📁 File Naming** - Intelligently rename screenshots and downloads
   - `Screenshot 2024.png` → `hero-mockup-mobile.png`
   - `IMG_1234.jpg` → `golden-gate-sunset.jpg`

2. **🔍 Code Linting** - Review code against your constitutional principles
   - Checks violations of coding standards
   - Suggests improvements
   - Integrated with git pre-commit hooks

3. **📝 Markdown Analysis** - Detect changes in documentation
   - Tracks updates to `.specify/memory/` files
   - Suggests actions based on changes
   - Ideal for knowledge management

4. **🎤 Voice Actions** - Process MacWhisper transcriptions into actions
   - MacWhisper transcribes audio (Nvidia Parakeet v3 model)
   - Export `.txt` to `~/Documents/Transcriptions/`
   - tinyArms extracts actionable tasks (NOT summaries)
   - **Setup**: See `docs/MACWHISPER-INTEGRATION.md`

## Architecture

```
Human & AI Agent Interfaces
├─ CLI (tinyarms command)
├─ MCP Server (Claude Code integration)
├─ SwiftUI Menu Bar App (planned)
└─ LaunchAgents (scheduled automation)
          ↓
    Tiered Router
├─ Level 0: Deterministic rules (<1ms, 60-75% of tasks)
├─ Level 1: Tiny embeddings (<100ms, 20-25% of tasks)
│  ├─ embeddinggemma:300m (200MB, Ollama)
│  └─ all-MiniLM-L6-v2 (45MB, Transformers.js)
├─ Level 2: Small generalists (2-4s, 5-10% of tasks)
│  └─ Gemma 2 2B (1.5GB, Ollama)
└─ Level 3: Code specialists (10-15s, <5% of tasks, idle-only)
   └─ Qwen 7B (4.7GB, Ollama)
          ↓
    Storage & Models
├─ Concept: History tracking, performance metrics
├─ Concept: Router cache for similar tasks
└─ Ollama (model management)
```

**100% Offline** - No cloud APIs, no Level 4 fallback.

## Models

### ✅ Level 1 (DECIDED): embeddinggemma

**Model:** `embeddinggemma:300m`
**Size:** 200MB
**Role:** Semantic understanding layer for routing (NOT a generative agent)

```bash
ollama pull embeddinggemma:300m
```

**Why embeddinggemma?**
- ✅ Best quality under 500MB (308M params)
- ✅ Multilingual (100+ languages including Hungarian, Vietnamese)
- ✅ Fast (<15ms per embedding on M2)
- ✅ 8-16GB RAM friendly

**What it does:**
- File type classification (screenshot, code, document)
- Intent extraction from voice transcriptions
- Context provider for Level 2/3 agents
- Constitutional principle similarity search

**What it CAN'T do:**
- ❌ Generate new text (needs Level 2/3)
- ❌ Write code (needs Level 3)
- ❌ Long reasoning chains (just similarity matching)

**Full details:** See [docs/EMBEDDINGGEMMA.md](docs/EMBEDDINGGEMMA.md)

---

### ✅ Level 2 (DECIDED): Multi-Model Architecture

**Primary: Qwen2.5-Coder-3B-Instruct** (Code Linting)
- **Size**: 1.9GB
- **Role**: Constitutional code linting, pattern detection
- **Benchmarks**: 84.1% HumanEval, 73.6% MBPP, 72.1% MultiPL-E avg
- **Install**: `ollama pull qwen2.5-coder:3b`

**Why Qwen2.5-Coder-3B?**
- ✅ 84.1% HumanEval (beats Qwen3-4B-Instruct's 62% base)
- ✅ Code-specialized (5.5T code tokens across 92 languages)
- ✅ 600MB smaller + 20-30% faster than 4B models
- ✅ Priority 2 compatible (2-3s for pre-commit hooks)

**What it does:**
- Detect hardcoded colors, magic numbers, file size violations
- Simple DRY violations, import alias checks
- Pattern-based constitutional enforcement (85% accuracy)

---

**Secondary: Qwen3-4B-Instruct** (General Tasks, Optional)
- **Size**: 2.5GB
- **Role**: Non-code instruction-following tasks
- **Benchmarks**: 83.4% IFEval, 76.8% MultiPL-E
- **Install**: `ollama pull qwen3:4b`

**Use when:**
- Need superior instruction-following (83.4% IFEval)
- Task is NOT code analysis
- Complex multi-step reasoning required

---

**Other Optional Specialists:**
- **Gemma 3 4B** (2.3GB) - File naming, markdown analysis, audio actions
  - Can reuse from Cotypist (no duplicate download)
- **Custom specialists** - Add per-skill via config

---

### ⚠️ Level 3 (OPTIONAL): Qwen2.5-Coder 7B

**Model:** `qwen2.5-coder:7b-instruct`
**Size:** 4.7GB
**Role:** Deep architectural analysis (optional)

```bash
ollama pull qwen2.5-coder:7b  # Install only if needed
```

**When to install:**
- Level 2 misses >10% violations
- Need architectural anti-pattern detection
- Want weekly deep scans (not pre-commit)

**What it catches (vs Level 2):**
- Complex DRY violations (semantic duplication)
- Architectural anti-patterns (God objects, circular deps)
- Cross-file pattern analysis
- Component decomposition issues

**Trade-off:** 2x slower (30-50 tokens/sec), but 95% accuracy vs 85%

**All models configurable via `config.yaml`**

## Quick Start

```bash
# Install dependencies
npm install

# Setup (installs LaunchAgents, symlinks models)
./setup.sh

# Test a skill manually
tinyarms run file-naming ~/Downloads

# Start MCP server for Claude Code
tinyarms mcp-server

# View system status
tinyarms status
```

## CLI Commands

tinyArms provides a comprehensive CLI for both humans and AI agents:

### Execution
```bash
tinyarms run <skill> [paths]          # Run a skill
tinyarms run <skill> --dry-run        # Preview without applying
tinyarms run <skill> --json           # Output as JSON (for agents)
tinyarms run <skill> -v               # Verbose mode
```

### Status & Monitoring
```bash
tinyarms status                       # System overview
tinyarms status --json                # Machine-readable status
tinyarms history                      # Recent tasks
tinyarms history --last 20            # Last N tasks
tinyarms history --skill file-naming  # Filter by skill
tinyarms logs                         # View logs
tinyarms logs --skill code-linting    # Skill-specific logs
tinyarms logs --tail 50 --follow      # Live log streaming
```

### Configuration
```bash
tinyarms config show                  # View all config
tinyarms config get <key>             # Get specific value
tinyarms config set <key> <value>     # Update config
tinyarms config validate              # Check config validity
```

### Skills Management
```bash
tinyarms skills list                  # All available skills
tinyarms skills info <name>           # Skill details
tinyarms skills enable <name>         # Enable a skill
tinyarms skills disable <name>        # Disable a skill
tinyarms skills test <name>           # Test with examples
```

### Models Management
```bash
tinyarms models list                  # Installed models
tinyarms models load <model>          # Load into memory
tinyarms models unload <model>        # Free memory
tinyarms models info <model>          # Model details
```

### Agent Integration
```bash
tinyarms mcp-server                   # Start MCP server
tinyarms mcp-server --port 3000       # Custom port
```

All commands support `--json` flag for AI agent parsing!

## System Requirements

### Hardware
- **8GB RAM Mac:** Level 0 + Level 1 + Level 2 (SAFE)
- **16GB RAM Mac:** All levels including Level 3 (SAFE)
- macOS 12.0+ (Apple Silicon recommended)
- 5GB+ free storage (for models)

### Memory Requirements

**Peak RAM usage must stay <70% of total to avoid thrashing.**

**8GB RAM Mac:**
- Level 0: 0MB (rules only)
- Level 1: ~300MB (embeddinggemma or all-minilm)
- Level 2: +1.5GB (Gemma 2 2B) = **1.8GB total models** ✅ SAFE
- Level 3: +4.7GB (Qwen 7B) = 6.5GB models + 1-2GB KV cache = **~8GB peak** ⚠️ TIGHT
  - **Solution:** Level 3 runs ONLY on idle/AC power (see below)

**16GB RAM Mac:**
- All levels: 6.5GB models + ~3GB KV cache = **~9.5GB peak** ✅ SAFE
- Free RAM under load: ~6GB (comfortable)

### Software
- Ollama installed (`curl -fsSL https://ollama.com/install.sh | sh`)
- Node.js 18+ (if using Transformers.js)

---

## Heavy Models on Idle (Level 3)

**Problem:** Qwen 7B (4.7GB) pushes 8GB Macs to the limit.

**Solution:** Level 3 triggers ONLY when safe:

```yaml
# Example config for idle-only scheduling
skills:
  code-linting:
    model: qwen2.5-coder:7b
    schedule:
      type: idle_only
      min_idle_minutes: 15        # Mac idle >15 min
      require_ac_power: true       # Only when plugged in
      min_free_memory_gb: 7        # Need 7GB free before loading
      time_window: "22:00-06:00"   # Optional: 10pm-6am only
      manual_trigger: true         # User can force-run anytime
```

**How it works:**
1. LaunchAgent monitors system state (idle, power, memory)
2. When ALL conditions met → Load Qwen 7B → Process queue
3. After completion → Unload model → Free 4.7GB
4. User can manually trigger: `tinyarms run code-linting src/ --force`

**Battery impact:** ~0% (runs on AC only)

## Documentation

### Core Architecture
- **[docs/EMBEDDINGGEMMA.md](docs/EMBEDDINGGEMMA.md)** - ✅ Level 1 routing intelligence (DECIDED)
- **[docs/MODEL-OPTIONS.md](docs/MODEL-OPTIONS.md)** - 🔧 Level 2/3 model comparison (20+ options)
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Complete technical details
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What's built, what's planned

### Integration Designs
- **[docs/mcp-server-ideations.md](docs/mcp-server-ideations.md)** - MCP integration design
- **[docs/swiftui-app-ideations.md](docs/swiftui-app-ideations.md)** - GUI design & mockups
- **[docs/launchagent-ideations.md](docs/launchagent-ideations.md)** - Automation strategies

### Quick Start
- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 10 minutes

## Project Status

### ✅ Architecture & Pseudo Code Complete
- Complete architecture design (4 levels: Rules → Tiny → Small → Code)
- Type definitions (TypeScript interfaces)
- Routing logic (pseudo code structure)
- Skill implementations (pseudo code with comments)
- Configuration examples (YAML structure)
- Benchmark approach (test case structure)

### 📋 Documented Concepts (Not Implemented)
- Database: History tracking, performance metrics (concept only)
- MCP server: Tool specifications for Claude Code integration
- SwiftUI menu bar app: UI mockups, flows, code sketches
- LaunchAgent automation: XML templates, idle detection patterns
- CLI commands: Interface design (no execution logic)

### 🎯 Performance Targets (Untested - Estimates Only)

⚠️ **These are theoretical estimates. Run benchmarks on YOUR hardware to measure actual performance.**

- **Speed Targets:**
  - Level 0: <1ms (deterministic rules)
  - Level 1: <100ms (tiny embeddings)
  - Level 2: 2-4s (small generalists)
  - Level 3: 10-15s (code specialists, idle-only)

- **Accuracy Target:** 90% overall (human-reviewable)
- **Battery Impact:** 1-5%/day (estimate, needs measurement)
- **Memory Budget:**
  - 8GB RAM: Level 0 + Level 1 + Level 2 = ~2GB models (SAFE)
  - 16GB RAM: All levels = ~6.5GB models + 3GB KV cache = ~9.5GB peak (SAFE)
- **Storage:** 200MB-7GB depending on models chosen

**To measure actual performance:**
```bash
# Review benchmark approach (pseudo code)
cat scripts/benchmark-approach.md
```

## Examples

### Rename Files
```bash
# Dry run first
tinyarms run file-naming ~/Downloads --dry-run

# Output:
# Would rename:
#   Screenshot 2024.png → hero-mockup-mobile.png
#   IMG_1234.jpg → golden-gate-sunset.jpg

# Apply changes
tinyarms run file-naming ~/Downloads
```

### Lint Code
```bash
# Lint against constitutional principles
tinyarms run code-linting src/

# Output:
# Found 3 issues in src/main.ts:
#   Line 45: Use const instead of let
#   Line 102: Function too complex
#   Line 234: Missing error handling
```

### Use with AI Agents
```bash
# Claude Code calls this automatically via MCP
tinyarms run file-naming ~/Downloads --json

# Aider can call commands directly
aider --message "Use tinyarms to organize these files"
```

## Configuration

Minimal example - edit `~/.config/tinyarms/config.yaml`:

```yaml
# Minimal working config
system:
  ollama_host: http://localhost:11434

models:
  level1: embeddinggemma:300m   # 200MB, tiny
  level2: gemma2:2b              # 1.5GB, small
  level3: qwen2.5-coder:7b       # 4.7GB, code (idle-only)

skills:
  file-naming:
    enabled: true
    model: level2               # Use Gemma 2 2B

  code-linting:
    enabled: true
    model: level3               # Use Qwen 7B (idle-only)
    constitution_path: ~/.specify/memory/constitution.md
```

**See `config/examples/` for balanced and aggressive configurations.**

## Contributing

tinyArms is designed to be hackable:

1. **Add a skill:** Create `.md` prompt template in `skills/`, update config
2. **Switch models:** Edit `config.yaml`, download model, test
3. **Customize rules:** Edit `config.yaml` → `rules.file_types`
4. **Build GUI:** Follow designs in `docs/swiftui-app-ideations.md`
5. **Implement MCP:** Follow specs in `docs/mcp-server-ideations.md`

Code is clean, well-documented, and modular!

## License

MIT - Use it, modify it, share it! 🦖

## Credits

- **Concept:** Original research document + community feedback (Twitter, Oct 26 2025)
- **Models:** Gemma (Google), Qwen (Alibaba), Phi (Microsoft), etc.
- **Infrastructure:** Ollama, SQLite, Node.js
- **Inspiration:** T-Rex arms - tiny but surprisingly capable!

## Models Used

| Model | Size | Use Case | Speed |
|-------|------|----------|-------|
| Gemma 3 4B Q4 | 2.3GB | General purpose | 3s |
| Qwen2.5-Coder 7B Q4 | 4.7GB | Code linting only