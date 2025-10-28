# 🦖 tinyArms

**Local AI automation using tiny models (<500MB) for 24/7 filesystem watching**

---

## What It Is

100% offline AI assistant that:
- ✅ Lints code against constitutional principles (2-3s, pre-commit)
- ✅ Renames screenshots intelligently
- ✅ Analyzes markdown changes
- ✅ Processes voice transcriptions → structured actions

**Like a T-Rex**: Small arms, but surprisingly capable when working WITH larger AI agents.

---

## Quick Install

\`\`\`bash
ollama pull embeddinggemma:300m
ollama pull qwen2.5-coder:3b
# tinyarms run code-linting src/
\`\`\`

**Storage**: Core 2.1GB | With research 6.4GB | All 13.9GB

---

## Documentation

**Get Started**:
- **[QUICKSTART.md](QUICKSTART.md)** - 10-minute setup
- **[docs/00-OVERVIEW.md](docs/00-OVERVIEW.md)** - What, why, how
- **[docs/00-GETTING-STARTED.md](docs/00-GETTING-STARTED.md)** - Prerequisites, first run

**Core Concepts**:
- **[docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md)** - Tiered routing, skills, MCP (original)
- **[docs/01-ARCHITECTURE-V2.md](docs/01-ARCHITECTURE-V2.md)** - Refined architecture with jan-nano-4b integration
- **[docs/01-MODELS.md](docs/01-MODELS.md)** - Model decisions + benchmarks

**Setup**:
- **[docs/02-INSTALLATION.md](docs/02-INSTALLATION.md)** - Install steps
- **[docs/02-CONFIGURATION.md](docs/02-CONFIGURATION.md)** - Config examples
- **[docs/02-TROUBLESHOOTING.md](docs/02-TROUBLESHOOTING.md)** - Common issues

**Features**:
- **[docs/03-SKILLS.md](docs/03-SKILLS.md)** - What each skill does
- **[docs/03-INTEGRATIONS.md](docs/03-INTEGRATIONS.md)** - MacWhisper, Claude Code, jan-nano-4b

**Design** (Ideations):
- **[docs/04-direct-model-access.md](docs/04-direct-model-access.md)** - CLI/MCP for direct model access
- **[docs/04-launchagent-ideations.md](docs/04-launchagent-ideations.md)** - Automation strategies
- **[docs/04-mcp-server-ideations.md](docs/04-mcp-server-ideations.md)** - MCP integration design
- **[docs/04-swiftui-app-ideations.md](docs/04-swiftui-app-ideations.md)** - GUI mockups

**Advanced Systems**:
- **[docs/05-prompt-evolution-system.md](docs/05-prompt-evolution-system.md)** - Self-improving prompts via SmolLM2 A/B testing

**Research** (Pre-Implementation):
- **[docs/research/jan-nano-4b-use-cases.md](docs/research/jan-nano-4b-use-cases.md)** - 10 prioritized use cases for research agent
- **[docs/research/magic-numbers-audit.md](docs/research/magic-numbers-audit.md)** - Audit trail for all numeric constants

**Configuration**:
- **[config/constants.yaml](config/constants.yaml)** - Centralized constants with source documentation

**Status**: **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What's built, what's planned

---

## Core Features

### Tiered Routing
- **Level 0**: Deterministic rules (<1ms, 60-75% coverage)
- **Level 1**: embeddinggemma 300M (<100ms, 20-25% coverage)
- **Level 2**: Qwen2.5-Coder-3B (2-3s, 10-15% coverage)
- **Level 3**: Qwen2.5-Coder 7B (10-15s, <5% coverage, optional)

### Skills
1. **code-linting-fast** - Pre-commit, 2-3s, 85% accuracy
2. **code-linting-deep** - Weekly scans, 10-15s, 95% accuracy (optional)
3. **file-naming** - Batch every 5 mins
4. **markdown-analysis** - Every 2 hours, `.specify/memory/`
5. **audio-actions** - MacWhisper → action suggestions

### MCP Integration (Bidirectional)
- **AI agents → tinyArms**: Claude Code/Aider/Cursor call tools
- **tinyArms → Other MCPs**: Access GitHub, Context7, Figma, databases

---

## Hardware Requirements

| RAM | Config | Storage |
|-----|--------|---------|
| 8GB | Level 0-2 only | 2.1GB |
| 16GB ✅ | All levels | 5-14GB |

**Platform**: macOS 12.0+ (Apple Silicon recommended)

---

## Quick Examples

\`\`\`bash
# Lint code (pre-commit)
tinyarms run code-linting-fast src/ --dry-run

# Rename files
tinyarms run file-naming ~/Downloads

# System status
tinyarms status

# View logs
tinyarms logs --tail 50
\`\`\`

---

## Status

⚠️ **0% implemented** - Architecture & pseudo code ONLY

This is a REFERENCE IMPLEMENTATION showing structure, not execution.

---

## License

MIT 🦖
