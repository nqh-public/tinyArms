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

## Confidence Scoring

**Status**: Researched (Phase 02)
**Expected Impact**: 20-30% reduction in Level 3 escalations
**Implementation**: Week 3

**Problem**: Level 2 doesn't know when its answer is good enough vs when to escalate to Level 3

**Solution**: Answer Consistency Scoring
- Generate N=3 responses with temperature=0.7
- Measure semantic similarity between all 3
- Threshold: >0.85 → accept Level 2, <0.85 → escalate to Level 3

**Why this works**: LLMs produce consistent answers when confident, inconsistent when uncertain

**Trade-offs**:
- Latency: +500ms at Level 2
- Accuracy: Prevents false confidence
- Cost: 20-30% fewer expensive Level 3 calls

**Industry validation**: AutoMix (NeurIPS 2024) achieves 50%+ cost reduction via self-verification

**Full details**: See [research/02-confidence-scoring-patterns.md](research/02-confidence-scoring-patterns.md)

## Industry Validation

**Verdict**: tinyArms architecture is **90% aligned** with industry best practices
**Research sources**: 25+ academic papers, 8 open-source projects, 6 production case studies
**Date**: 2025-10-29

### What's Validated ✅

**Four-Tier Cascade**:
- FrugalGPT (Stanford) uses 4 tiers, achieves 98% cost reduction
- Justified (most systems use 2-3, but 4 is valid if L0 hit rate >30%)

**Code-Specialized Models**:
- GitHub Copilot, Continue.dev, Cursor all use code-specific models
- +15-20% accuracy vs general models at same parameter count

**Embedding Model**:
- embeddinggemma-300m: Best multilingual model <500M params (MTEB ~70)
- Used in production: Semantic Router (2.9k stars), Red Hat LLM-d

**Quantization Strategy**:
- Q4 standard for consumer hardware (Ollama, llama.cpp)
- Expected loss: 2-5% accuracy degradation (acceptable)

### Critical Gaps (To Implement) ⚠️

- **Semantic Caching** (Phase 03): 15-25% query elimination
- **Confidence Scoring** (Phase 02): 20-30% reduction in L3 escalations
- **Cross-Encoder Reranker** (Phase 04, optional): +10-15% retrieval precision

### Comparison to Production Systems

| System | Similarity | Key Difference |
|--------|------------|----------------|
| **FrugalGPT** (Stanford) | 95% | tinyArms uses rules/embedding instead of cache (complementary) |
| **RouteLLM** (LMSYS) | 70% | tinyArms adds pre-LLM filtering (rules, embedding) |
| **Semantic Router** (Aurelio Labs) | 60% | tinyArms adds LLM fallback (Level 2, 3) |
| **GitHub Copilot** | 85% | tinyArms adds tiered routing (cost optimization) |

**Full details**: See [research/01-industry-validation.md](research/01-industry-validation.md)

## Skills

**Status**: ⚠️ ALL SKILLS 0% IMPLEMENTED (design only)

Brief overview of available skills. For detailed configuration and usage, see [03-SKILLS.md](03-SKILLS.md).

### code-linting-fast
- **Model**: Qwen2.5-Coder-3B-Instruct (Level 2)
- **Speed**: 2-3s per file
- **Use case**: Pre-commit hooks, constitutional enforcement
- **Detects**: Hardcoded colors, magic numbers, file size violations, missing line references

### code-linting-deep
- **Model**: Qwen2.5-Coder 7B (Level 3, optional)
- **Speed**: 10-15s per file
- **Use case**: Weekly deep scans (idle-only)
- **Detects**: Architectural anti-patterns, complex DRY violations, cross-file analysis

### file-naming
- **Model**: Gemma 3 4B (Level 2, optional)
- **Speed**: 2-4s per file
- **Use case**: Batch rename screenshots/downloads
- **Example**: `Screenshot 2024.png` → `hero-mockup-mobile.png`

### markdown-analysis
- **Model**: Gemma 3 4B (Level 2, optional)
- **Speed**: 2-4s per file
- **Use case**: Track changes in `.specify/memory/`
- **Detects**: Constitutional changes, conflicting decisions

### audio-actions
- **Model**: Gemma 3 4B (Level 2, optional)
- **Speed**: 3-5s per transcription
- **Use case**: Convert MacWhisper transcriptions to structured actions
- **Important**: SUGGEST ACTIONS (not summary)

**Full details**: See [03-SKILLS.md](03-SKILLS.md) and [03-INTEGRATIONS.md](03-INTEGRATIONS.md)

## Next Steps

**For detailed information**:
1. **Models**: See [01-MODELS.md](01-MODELS.md) - Model decisions, benchmarks, performance
2. **Configuration**: See [02-CONFIGURATION.md](02-CONFIGURATION.md) - Setup, storage, config system
3. **Integrations**: See [03-INTEGRATIONS.md](03-INTEGRATIONS.md) - MCP, LaunchAgent, MacWhisper, SwiftUI
4. **Skills**: See [03-SKILLS.md](03-SKILLS.md) - Detailed skill configuration and usage
5. **Research**: See [research/*.md](research/) - Industry validation, implementation patterns

---

**Note**: This is a reference implementation (0% executable code). Architecture shown is for design illustration, not actual execution.
