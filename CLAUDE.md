# CLAUDE.md

**Inherits From**: `/Users/huy/CODES/nqh/CLAUDE.md`

tinyArms-specific overrides only. For constitutional principles, behavioral patterns, and shared code protocols, see the root CLAUDE.md.

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

## Public Repository Sync

**Public Repo**: https://github.com/nqh-public/tinyArms
**Sync Method**: Git subtree (automated push from monorepo)

### Workflow

```bash
# 1. Commit changes to monorepo (from /Users/huy/CODES/nqh)
git add apps/tinyArms/
git commit -m "feat(tinyArms): your change description

apps/tinyArms/README.md:1
"
git push origin main

# 2. Sync to public repo (when ready to publish)
git subtree push --prefix=apps/tinyArms tinyarms-public main
```

**What gets synced**: Everything in `apps/tinyArms/` EXCEPT `CLAUDE.md` (removed in public repo)

**Remote configured**: `tinyarms-public` → `https://github.com/nqh-public/tinyArms.git`

**Optional alias** (add to ~/.zshrc):
```bash
alias tinyarms-sync="cd /Users/huy/CODES/nqh && git subtree push --prefix=apps/tinyArms tinyarms-public main"
```

**Batch commits**: You can commit multiple times to monorepo before syncing - subtree includes all commits since last push.

---

## Project Overview

**tinyArms** - Local AI assistant using tiny models (<500MB) for 24/7 filesystem watching and constitutional enforcement.

**Key Design**: 100% offline, memory-optimized for 8-16GB Macs, tiered routing (fast rules before expensive AI).

**Core Use Cases**:
1. Lint code against constitutional principles (pre-commit, 2-3s)
2. Rename screenshots intelligently
3. Track changes in `.specify/memory/` documentation
4. Convert voice transcriptions to structured actions

---

## Documentation Structure

**Phase 0 (Foundation)**:
- `docs/00-OVERVIEW.md` - What, why, how it works
- `docs/00-GETTING-STARTED.md` - Prerequisites, first run

**Phase 1 (Core)**:
- `docs/01-ARCHITECTURE.md` - Tiered routing, skills, MCP
- `docs/01-MODELS.md` - All model decisions + benchmarks

**Phase 2 (Setup)**:
- `docs/02-INSTALLATION.md` - Install steps
- `docs/02-CONFIGURATION.md` - Config examples
- `docs/02-TROUBLESHOOTING.md` - Common issues

**Phase 3 (Features)**:
- `docs/03-SKILLS.md` - What each skill does
- `docs/03-INTEGRATIONS.md` - MacWhisper, Claude Code, jan-nano-4b

**Phase 4 (Design)**:
- `docs/04-launchagent-ideations.md` - Automation strategies
- `docs/04-mcp-server-ideations.md` - MCP integration design
- `docs/04-swiftui-app-ideations.md` - GUI mockups

**Archive**: `docs/archive/` - Old consolidated files (IMPLEMENTATION.md, MODEL-DECISIONS.md, etc.)

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
