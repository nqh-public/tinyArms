# 00 - Overview

**What is tinyArms?**

Local AI automation using tiny models (<500MB) for 24/7 filesystem watching and constitutional code enforcement.

---

## The Problem

- Claude Code can't reliably enforce your coding constitution
- Screenshots pile up: `Screenshot 2024-10-27.png`, `IMG_1234.jpg`
- Cloud AI won't watch your filesystem 24/7
- You need local, always-on enforcement that's modular and extensible

## The Solution

Tiny local AI models (<500MB) that watch your files 24/7, enforce your constitutional rules, and organize chaos automatically.

**Like a T-Rex**: Small arms, but surprisingly capable when working WITH larger AI agents.

---

## Core Capabilities

✅ **100% Offline** - No cloud APIs, no data leaks
✅ **8-16GB RAM Optimized** - Heavy models run only on idle/AC power
✅ **Modular & Extensible** - Plugin system for custom skills
✅ **File System Watchers** - Instant triggers on new files
✅ **LaunchAgent Native** - macOS power-aware scheduling
✅ **Agent-Friendly** - Works with Claude Code, Aider, Cursor via MCP
✅ **90% Accuracy Target** - Good enough for daily use, human-reviewable

---

## How It Works

### Tiered Routing (Performance-First)

```
Level 0: Deterministic Rules (<1ms, 60-75% coverage)
├─ File extension detection, regex patterns
└─ No AI, pure logic

Level 1: Tiny Embeddings (<100ms, 20-25% coverage)
├─ Model: embeddinggemma:300m (200MB)
├─ Purpose: Semantic classification, intent extraction
└─ Install: ollama pull embeddinggemma:300m

Level 2: Small Generalists (2-4s, 10-15% coverage)
├─ Primary: Qwen2.5-Coder-3B-Instruct (1.9GB, code linting)
├─ Secondary: Qwen3-4B-Instruct (2.5GB, general tasks, optional)
└─ Specialists: Gemma 3 4B (2.3GB, file naming, optional)

Level 3: Code Specialists (10-15s, <5% coverage, idle-only)
├─ Model: Qwen2.5-Coder 7B (4.7GB, optional)
├─ Trigger: Only when idle + AC power + 7GB free RAM
└─ Purpose: Deep architectural analysis
```

**Philosophy**: Use the smallest/fastest model that meets accuracy requirements. 60-75% of tasks handled by deterministic rules before touching AI.

---

## Key Skills

1. **📁 File Naming** - Intelligently rename screenshots and downloads
   - `Screenshot 2024.png` → `hero-mockup-mobile.png`
   - `IMG_1234.jpg` → `golden-gate-sunset.jpg`

2. **🔍 Code Linting** - Review code against your constitutional principles
   - Fast linting (Level 2, pre-commit, 2-3s)
   - Deep linting (Level 3, weekly scans, optional)
   - Source: `.specify/memory/constitution.md` (YOUR 17 principles)

3. **📝 Markdown Analysis** - Detect changes in documentation
   - Tracks updates to `.specify/memory/` files
   - Suggests actions based on changes
   - Ideal for knowledge management

4. **🎤 Voice Actions** - Process MacWhisper transcriptions into actions
   - MacWhisper transcribes audio
   - Export `.txt` to `~/Documents/Transcriptions/`
   - tinyArms extracts actionable tasks (NOT summaries)

---

## Bidirectional MCP Integration

**AI agents → tinyArms**: Claude Code/Aider/Cursor call tinyArms tools via MCP
**tinyArms → Other MCP servers**: Access Figma, GitHub, databases to enhance skills

**Example flow**:
```
Claude Code: "Lint this file"
  ↓
tinyArms (Qwen 7B) + GitHub MCP (fetch PR context)
  ↓
Returns: Constitutional violations with line refs
```

---

## Hardware Requirements

### 8GB RAM Mac
- **Levels 0-2**: 1.8GB total ✅ SAFE
- **Level 3**: Runs ONLY on idle/AC power (4.7GB model + 3GB KV cache = ~8GB peak)

### 16GB RAM Mac (Recommended)
- **All levels**: ~9.5GB peak ✅ SAFE (6GB free under load)
- **Storage**: 5-14GB depending on models chosen

### Platform
- **OS**: macOS 12.0+ (Apple Silicon recommended)
- **Storage**: 5GB+ free storage
- **Dependencies**: Ollama, Node.js 18+

---

## Storage Options

| Configuration | Models | Storage | Free RAM |
|--------------|--------|---------|----------|
| **Core only** | embeddinggemma + Qwen2.5-Coder-3B | 2.1GB | ~14GB |
| **Core + research** | + jan-nano-4b (Q8) | 6.4GB | ~10GB |
| **All models** | + Qwen3-4B + Gemma + Qwen 7B | 13.9GB | ~6GB |

---

## Performance Targets

**⚠️ Untested estimates. Run benchmarks on YOUR hardware to measure actual performance.**

- **Speed Targets**:
  - Level 0: <1ms (deterministic rules)
  - Level 1: <100ms (tiny embeddings)
  - Level 2: 2-4s (small generalists)
  - Level 3: 10-15s (code specialists, idle-only)

- **Accuracy Target**: 90% overall (human-reviewable)
- **Battery Impact**: 1-5%/day (estimate, needs measurement)

---

## Use Cases

**Primary**:
- Constitutional code linting (pre-commit hooks)
- Screenshot/download organization
- Markdown change detection
- Voice transcription → action extraction

**Secondary**:
- Multi-source research (with jan-nano-4b)
- Architectural violation detection (Level 3)
- Design pattern enforcement

---

## Why tinyArms?

**Financial**: Save $120-240/year
- GitHub Copilot: $10/month = $120/year
- Claude Pro: $20/month = $240/year
- TinyArms: $5 one-time (Pushover) + $0/month = **Save $115-235/year**

**Privacy**: 100% offline, no cloud APIs, no data leaks

**Control**: Your constitution, your rules, your data stays local

**Learning**: Building expertise in local AI systems, plugin architectures, and automation

**Reusability**: Once working for YOU, package and share with others facing same problems

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                 USER INTERFACES                     │
├─────────────────────────────────────────────────────┤
│  1. CLI           → tinyarms <command>              │
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
│  - Ollama: embeddinggemma + Qwen variants          │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Get Started**: Read [00-GETTING-STARTED.md](00-GETTING-STARTED.md)
2. **Understand Architecture**: Read [01-ARCHITECTURE.md](01-ARCHITECTURE.md)
3. **Install**: Follow [02-INSTALLATION.md](02-INSTALLATION.md)
4. **Configure**: Read [02-CONFIGURATION.md](02-CONFIGURATION.md)

---

**Status**: 0% implemented - architecture and pseudo code ONLY

This is a REFERENCE IMPLEMENTATION showing structure, not execution. Before implementing ANY feature, confirm with user whether to build executable code or continue as reference architecture.
