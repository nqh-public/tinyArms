# tinyArms Documentation Index

**Auto-generated** • 39 files • 19,551 total lines

---

## Quick Start

1. [README.md](../README.md) - Project overview
2. [00-OVERVIEW.md](00-OVERVIEW.md) - What/why tinyArms
3. [00-GETTING-STARTED.md](00-GETTING-STARTED.md) - 10-minute setup

---

## Core Documentation (15 files)

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

### [macOS Daemon Architecture](02-MACOS-DAEMON.md)

**Status**: Implementation guide for native macOS daemon **Platform**: macOS 14.0+ **Tech**: Swift, LaunchAgent, FSEvents, Ollama

### [02 - Troubleshooting](02-TROUBLESHOOTING.md)

**Common issues and solutions**

### [03 - Integrations](03-INTEGRATIONS.md)

**MacWhisper, jan-nano-4b, Claude Code, MCP, LaunchAgent, and other tool integrations**

### [iOS Platform Guide](03-IOS-PLATFORM.md)

**Status**: Implementation guide for iOS app **Platform**: iOS 18.0+ **Tech**: SwiftUI, Share Extension, Core ML, Shortcuts

### [03 - Skills](03-SKILLS.md)

**What each skill does (Swift/Apple ecosystem)**

### [jan-nano-4b Use Cases for tinyArms Research Agent](03-jan-nano-4b-research-agent.md)

**Research completed:** 2025-10-27 **Model:** jan-nano-4b (4.3GB, Q8 quantization) **Context:** 128K tokens **Role:** Level 2/3 research agent for ...

### [iPadOS Platform Guide](04-IPADOS-PLATFORM.md)

**Status**: Implementation guide for iPadOS app **Platform**: iPadOS 18.0+ **Tech**: SwiftUI, Split View, Drag & Drop, Pointer support

### [Direct Model Access API](04-direct-model-access.md)

**Purpose**: Expose tinyArms models directly to coding agents (Claude Code, Aider, Cursor) for context-efficient operations

### [🦖 TinyArms MCP Server - Architecture](04-mcp-server-ideations.md)

// docs/mcp-server-ideations.md # 🦖 TinyArms MCP Server - Architecture


---

## Pseudocode (0 files)



---

## Research (12 files)

- **[Magic Numbers Audit - tinyArms Architecture](research/00-constants-audit.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Industry Validation - tinyArms Architecture](research/01-industry-validation.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Model Selection Strategies for Tiered Systems](research/01-model-selection-validation.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Tiered Routing Architectures - Research Findings](research/01-tiered-routing-validation.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Confidence Scoring Patterns](research/02-confidence-scoring-patterns.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Orchestration Patterns for Tiered AI Systems](research/02-orchestration-patterns.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Threshold Calibration Guide](research/02-threshold-calibration-guide.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Real-World Multilayer AI Implementations](research/03-real-world-implementations.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Semantic Caching Design](research/03-semantic-caching-design.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[OpenSkills-Inspired Skills Architecture](research/04-openskills-integration-decision.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Plugin Architecture Patterns Research](research/04-plugin-architecture-patterns.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...
- **[Apple Foundation Models Integration Analysis](research/06-apple-foundation-models-integration.md)** - > **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algor...

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
