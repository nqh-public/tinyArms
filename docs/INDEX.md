# tinyArms Documentation Index

**Auto-generated** • 38 files • 18,391 total lines

---

## Quick Start

1. [README.md](../README.md) - Project overview
2. [00-OVERVIEW.md](00-OVERVIEW.md) - What/why tinyArms
3. [00-GETTING-STARTED.md](00-GETTING-STARTED.md) - 10-minute setup

---

## Core Documentation (14 files)

### [00 - Overview](00-OVERVIEW.md)

**What is tinyArms?**

### [Swift Quick Start](00-SWIFT-QUICKSTART.md)

```bash git clone repo open TinyArms.xcodeproj # Select TinyArmsMacOS scheme → Cmd+R # Grant permissions: Full Disk Access + Login Items ```

### [Xcode Setup](00-XCODE-SETUP.md)

- Xcode 15.0+ (macOS 14.0+) - Apple Developer account ($99/year for deploy, free for local)

### [01 - Architecture](01-ARCHITECTURE.md)

**High-level overview of tinyArms architecture**

### [01 - Models](01-MODELS.md)

**All model decisions and benchmarks**

### [Swift Architecture Overview](01-SWIFT-ARCHITECTURE-OVERVIEW.md)

``` TinyArmsKit (Swift Package) ├─ Core/ (shared) │  ├─ Protocols/ │  │  ├─ ModelClient.swift │  │  ├─ SkillExecutor.swift │  │  └─ Storage.swift │...

### [02 - Troubleshooting](02-TROUBLESHOOTING.md)

**Common issues and solutions**

### [03 - Integrations](03-INTEGRATIONS.md)

**MacWhisper, jan-nano-4b, Claude Code, MCP, LaunchAgent, and other tool integrations**

### [03 - Skills](03-SKILLS.md)

**What each skill does**

### [jan-nano-4b Use Cases for tinyArms Research Agent](03-jan-nano-4b-research-agent.md)

**Research completed:** 2025-10-27 **Model:** jan-nano-4b (4.3GB, Q8 quantization) **Context:** 128K tokens **Role:** Level 2/3 research agent for ...

### [Direct Model Access API](04-direct-model-access.md)

**Purpose**: Expose tinyArms models directly to coding agents (Claude Code, Aider, Cursor) for context-efficient operations

### [🦖 TinyArms LaunchAgent Ideations](04-launchagent-ideations.md)

Use macOS LaunchAgents for intelligent, battery-efficient task scheduling. Better than cron for TinyArms because:

### [🦖 TinyArms MCP Server - Architecture](04-mcp-server-ideations.md)

// docs/mcp-server-ideations.md # 🦖 TinyArms MCP Server - Architecture

### [🦖 TinyArms Menu Bar App - SwiftUI Ideations](04-swiftui-app-ideations.md)

// docs/swiftui-app-ideations.md # 🦖 TinyArms Menu Bar App - SwiftUI Ideations


---

## Pseudocode (0 files)



---

## Research (12 files)

- **[Magic Numbers Audit - tinyArms Architecture](research/00-constants-audit.md)** - **Purpose**: Document source of all numeric constants in architecture design **Date**: 2025-10-27 **Status**: Design phase (0% implemented)
- **[Industry Validation - tinyArms Architecture](research/01-industry-validation.md)** - **Status**: Researched (2025-10-29) **Sources**: 25+ academic papers, 8 open-source projects, 6 production case studies **Phase**: 01 (Current Stat...
- **[Model Selection Strategies for Tiered Systems](research/01-model-selection-validation.md)** - **Research Date**: 2025-10-29 **Sources**: MTEB Benchmark, Berkeley Function Calling Leaderboard (BFCL), Academic Papers (arXiv), Production System...
- **[Tiered Routing Architectures - Research Findings](research/01-tiered-routing-validation.md)** - **Research Date**: 2025-10-29 **Sources**: FrugalGPT, RouteLLM, AutoMix, Semantic Router, LangChain, LlamaIndex, AWS Multi-LLM Routing, TweakLLM **...
- **[Confidence Scoring Patterns](research/02-confidence-scoring-patterns.md)** - **Status**: Researched (2025-10-29) **Phase**: 02 (Confidence Scoring Implementation) **Implementation**: Week 3 **Expected Impact**: 20-30% reduct...
- **[Orchestration Patterns for Tiered AI Systems](research/02-orchestration-patterns.md)** - **Research Date**: 2025-10-29 **Sources**: Academic papers (arXiv), industry blogs, production system documentation
- **[Threshold Calibration Guide](research/02-threshold-calibration-guide.md)** - **Status**: Researched (2025-10-29) **Phase**: 02 (Confidence Scoring + Threshold Tuning) **Implementation**: Week 3-5 **Purpose**: Operational gui...
- **[Real-World Multilayer AI Implementations](research/03-real-world-implementations.md)** - **Research Date**: 2025-10-29 **Sources**: GitHub repositories, academic papers, company blogs, production case studies
- **[Semantic Caching Design](research/03-semantic-caching-design.md)** - **Status**: Researched (2025-10-29) **Phase**: 03 (Semantic Caching Implementation) **Implementation**: Week 4 **Expected Impact**: 15-25% query el...
- **[OpenSkills-Inspired Skills Architecture](research/04-openskills-integration-decision.md)** - **Research Date**: 2025-10-30 **Status**: Researched - Ready for Implementation **Phase**: 02 (Skills System Architecture) **Implementation**: Phas...
- **[Plugin Architecture Patterns Research](research/04-plugin-architecture-patterns.md)** - **Research Date**: 2025-10-30 **Status**: Researched - Ready for Architecture Integration **Phase**: 02 (Architecture Planning for Skills System) *...
- **[Apple Foundation Models Integration Analysis](research/06-apple-foundation-models-integration.md)** - **Status**: Researched (2025-11-02) **Phase**: 06 (Future Integration Possibilities) **Expected Impact**: Architecture learnings, potential hybrid ...

---

## Model Research (10 files)

- **[CLAUDE.md](model-research/CLAUDE.md)** - **Inherits From**: `/path/to/nqh-monorepo/apps/tinyArms/CLAUDE.md`
- **[EmbeddingGemma-300M: Proven Strengths & Weaknesses](model-research/embeddinggemma-300m.md)** - **Research Date**: 2025-10-28 **Source**: Google AI Model Card, Hugging Face (model page + blog), MTEB Leaderboard, Ollama Registry **Status**: Pro...
- **[Gemma 3 4B: Proven Strengths & Weaknesses](model-research/gemma-3-4b.md)** - **Research Date**: 2025-10-28 **Source**: Google AI Model Card + Hugging Face + Ollama Library + arXiv Technical Report **Status**: Analysis complete
- **[IBM Granite 4.0 Nano: Proven Strengths & Weaknesses](model-research/granite-4.0-nano.md)** - **Research Date**: 2025-10-28 **Source**: IBM official announcements, Hugging Face blog, benchmark aggregation via web search **Status**: Analysis ...
- **[Model Research Index](model-research/index.md)** - Quick reference for all researched models with recommendations beyond tinyArms core use cases.
- **[NuMind NuExtract: Proven Strengths & Weaknesses](model-research/nuextract.md)** - **Research Date**: 2025-10-28 **Source**: NuMind official blog, Hugging Face model cards, Simon Willison's analysis **Status**: Analysis complete -...
- **[Qwen2.5-Coder-3B-Instruct: Proven Strengths & Weaknesses](model-research/qwen2.5-coder-3b-instruct.md)** - **Research Date**: 2025-10-28 **Source**: Qwen technical report (arXiv:2409.12186), official blog posts, benchmark leaderboards **Status**: Product...
- **[Qwen2.5-Coder-7B: Proven Strengths & Weaknesses](model-research/qwen2.5-coder-7b.md)** - **Research Date**: 2025-10-28 **Source**: Qwen technical report (arXiv:2409.12186v2), HumanEval benchmark, Ollama registry **Status**: Analysis com...
- **[Qwen3-4B-Instruct: Proven Strengths & Weaknesses](model-research/qwen3-4b-instruct.md)** - **Research Date**: 2025-10-28 **Source**: Qwen3 Technical Report (arXiv:2505.09388), Qwen official blog, HuggingFace model cards **Status**: Analys...
- **[ReaderLM-v2: Proven Strengths & Weaknesses](model-research/readerlm-v2.md)** - **Research Date**: 2025-10-28 **Source**: https://arxiv.org/html/2503.01151v1, https://jina.ai/news/readerlm-v2-frontier-small-language-model-for-h...

---

**Regenerate**: `node apps/tinyArms/scripts/docs/generate-index.mjs`
