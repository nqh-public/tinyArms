# CLAUDE.md

**tinyArms-Specific Guidance for Claude Code**

This file provides Claude Code with context about the tinyArms project. For general AI assistant best practices, see standard LLM guidance documentation.

---

## ⚠️ Critical: Architecture Reference Only

**Status**: 0% implemented - pseudo code and design documentation ONLY

**What exists**:
- ✅ Complete architecture design (4-level tiered routing)
- ✅ Type definitions (TypeScript interfaces)
- ✅ Model research (embeddinggemma, Qwen variants decided)
- ✅ Configuration examples (YAML structure)

**What does NOT exist**:
- ❌ Working inference code
- ❌ Actual model integration
- ❌ Executable CLI commands
- ❌ Database implementation

**Before implementing ANY feature**: Confirm with user whether to build executable code or continue as reference architecture.

---

## Project Overview

**tinyArms** - Local AI assistant using tiny models (<500MB) for 24/7 filesystem watching and code quality automation.

**Key Design**: 100% offline, memory-optimized for 8-16GB Macs, tiered routing (fast rules before expensive AI).

**Core Use Cases**:
1. Lint code against your design principles (pre-commit, 2-3s)
2. Rename screenshots intelligently
3. Track changes in project documentation
4. Convert voice transcriptions to structured actions

---

## Documentation

**📚 Complete navigation**: See [docs/INDEX.md](docs/INDEX.md) (auto-generated from 40 files, organized by phase/category)

---

## Model Decisions

**Current Status** (2025-10-27):
- **Level 1**: embeddinggemma:300m (200MB) - semantic routing
- **Level 2 Primary**: Qwen2.5-Coder-3B-Instruct (1.9GB) - code linting
- **Level 2 Secondary**: Qwen3-4B-Instruct (2.5GB, optional) - general tasks
- **Level 2 Specialists**: Gemma 3 4B (2.3GB, optional) - file naming, markdown, audio
- **Level 3**: Qwen2.5-Coder 7B (4.7GB, optional) - deep analysis
- **Research**: jan-nano-4b (4.3GB, optional) - MCP tool-use research

**Full model research**: See [docs/01-MODELS.md](docs/01-MODELS.md)

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

**Hardware**: macOS 12.0+, 8GB RAM min (16GB recommended), 5-14GB storage
**Dependencies**: Ollama, Node.js 18+

**Full details**: See [00-OVERVIEW.md - Hardware Requirements](docs/00-OVERVIEW.md#hardware-requirements)

---

## Quick Reference

**Type**: Local AI assistant (offline, macOS-native)
**Phase**: Architecture & research (0% implemented)
**Tech stack**: Node.js + Ollama + SQLite + LaunchAgents (planned)
**Unique trait**: Memory-optimized tiered routing (tiny models first)

**CLI Examples**:
```bash
# Fast code linting (pre-commit)
tinyarms run code-linting-fast src/ --json

# Status overview
tinyarms status

# Model management
tinyarms models list
```

**Full CLI reference**: See [01-ARCHITECTURE.md - Skills](docs/01-ARCHITECTURE.md#skills)

**Before implementation**: Confirm executable code vs reference architecture with user.
