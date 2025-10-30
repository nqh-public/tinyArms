# Future: Prompt Evolution System

**Status**: Research complete, not prioritized for implementation
**Purpose**: Meta-learning system for continuous prompt improvement via user feedback
**Date**: 2025-10-27 (consolidated 2025-10-30)

---

## Overview

SmolLM2-360M-based system that evolves tinyArms prompts through genetic algorithms and A/B testing. **NOT** a per-task optimizer (no latency overhead). Runs as background job when accuracy drops.

---

## Core Workflow

```
1. Accuracy Drop Detected (skill drops below 80% over 20 samples)
   ↓
2. PromptBreeder generates 3 variants (genetic algorithm, 30 generations)
   ↓
3. Thompson Sampling A/B tests variants with users
   ↓
4. Flow Judge pre-screens candidates (optional, Phase 2)
   ↓
5. Best prompt replaces current (weekly cooldown per skill)
```

---

## Model Selection

**Chosen**: SmolLM2-360M-Instruct (Apache 2.0)

| Metric | SmolLM2-360M | Advantage |
|--------|-------------|-----------|
| Parameters | 360M | 6x larger than flan-t5-small |
| Context | 8,192 tokens | 16x larger (fits full prompt history) |
| Size | 200-250MB (Q4) | Fits 8GB RAM |
| Latency | 5-8s | Acceptable for background jobs |

**Trade-off**: 2.5x slower than flan-t5-small, but runs max once/week → acceptable

---

## Research Vectors (6 Areas)

### 1. PromptBreeder (Genetic Algorithm)

**Paper**: Google DeepMind, ICML 2024
**Accuracy**: 83.9% on task prompts

**Key Concepts**:
- Binary tournament selection
- 5 mutation operators: direct, first-order, crossover, zero-order, hypermutation
- Self-referential: Mutation strategies evolve too
- Output: Top 3 variants after 30 generations

**Example Mutation**:
```
Original: "Generate a descriptive filename based on visual content"
Mutated: "Analyze image semantics and create a kebab-case filename reflecting primary objects and context"
```

**Full details**: `ideas/archive/01-promptbreeder.md`

---

### 2. Thompson Sampling (A/B Testing)

**Purpose**: Statistical online learning for variant selection

**Algorithm**:
```
1. Maintain Beta(α, β) distribution per variant
2. Sample success probability θ ~ Beta(α, β)
3. Select variant with highest θ
4. Update distribution based on user feedback:
   - Accept → α + 1
   - Reject → β + 1
```

**Convergence**: 95% confidence after ~100 samples (adaptive)

**Example**:
```
Variant A: Beta(12, 3) → 80% selection probability
Variant B: Beta(5, 8) → 15%
Variant C: Beta(3, 4) → 5%
```

**Full details**: `ideas/archive/02-thompson-sampling.md`

---

### 3. LLM-as-Judge (Pre-Screening)

**Purpose**: Filter obviously bad variants before user testing

**Model**: Flow Judge (2B params, ✅/❌ evaluator)
**When**: Phase 2 (optional optimization)

**Process**:
```
1. PromptBreeder generates 10 variants
2. Flow Judge scores each (0-1 scale)
3. Keep top 3 → Thompson Sampling
4. Result: 70% reduction in bad variants
```

**Trade-off**: Adds 2-3s latency per variant (20-30s total for 10 variants)

**Full details**: `ideas/archive/03-llm-as-judge.md`

---

### 4. Task-Specific Patterns

**Purpose**: Industry-proven patterns for each skill

**Patterns**:
- **File naming**: CoT reasoning, visual object detection, kebab-case enforcement
- **Code linting**: Constitutional analysis, severity classification, suggestion generation
- **Markdown analysis**: Change detection, semantic summarization, action items
- **Voice transcription**: Filler word removal, intent extraction, action conversion

**Example (file-naming)**:
```
1. Identify primary object (person/place/thing)
2. Add temporal context if present (date/time)
3. Include secondary descriptors (color/state/action)
4. Format: kebab-case, lowercase, max 50 chars
```

**Full details**: `ideas/archive/04-task-specific-patterns.md` (867 lines)

---

### 5. Drift Detection

**Purpose**: Detect when prompts degrade over time

**Metrics Tracked**:
- Accuracy (rolling 20-sample window)
- Confidence score distribution
- User feedback rate (thumbs up/down)
- Routing tier distribution (L0 vs L1 vs L2)

**Alerts**:
```
❌ file-naming accuracy: 92% → 78% (14% drop)
⚠️ code-linting L2 escalation: 5% → 18% (13% increase)
✅ markdown-analysis stable: 88% ± 2%
```

**Full details**: `ideas/archive/05-drift-detection.md`

---

### 6. Offline Constraints

**Purpose**: Evolution system works without internet/cloud

**Requirements**:
- All models run locally (SmolLM2-360M + Gemma 3 4B + Qwen 7B)
- Data stored in SQLite (no cloud DB)
- Genetic algorithm is deterministic (reproducible results)
- No telemetry/phone-home

**Storage Needs**:
```
prompt_variants (SQLite):
  - variant_id (UUID)
  - skill_name (file-naming, code-linting, etc.)
  - prompt_text (TEXT)
  - generation (INT, 0-30)
  - parent_id (UUID, nullable)
  - mutation_type (direct, first-order, etc.)
  - fitness_score (0-1)
  - created_at (TIMESTAMP)
```

**Full details**: `ideas/archive/06-offline-constraints.md`

---

## Implementation Timeline (If Prioritized)

**Week 1-2**: PromptBreeder + Thompson Sampling
**Week 3-4**: SQLite schema + drift detection
**Week 5-6**: Task-specific patterns integration
**Week 7-8**: (Optional) Flow Judge pre-screening

**Total effort**: 40-60 hours (6-8 weeks @ 10h/week)

---

## Why Not Implementing Now

**Priority**: 0% core functionality implemented first

**Rationale**:
- Prompt evolution assumes base system works (doesn't exist yet)
- Requires 20+ user feedback samples per skill (no users yet)
- Adds 5-8s latency to evolution runs (acceptable, but premature optimization)

**Decision**: Archive research, revisit after Phase 1 (core routing) + Phase 2 (real users)

---

## References

- **PromptBreeder Paper**: [arxiv.org/abs/2309.16797](https://arxiv.org/abs/2309.16797)
- **Thompson Sampling**: Russo et al., "Tutorial on Thompson Sampling" (2017)
- **Flow Judge**: [GitHub - flowaicom/flow-judge](https://github.com/flowaicom/flow-judge)
- **SmolLM2**: [HuggingFace - HuggingFaceTB/SmolLM2-360M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)

---

## Archived Files

**Full research moved to**: `ideas/archive/`

- `01-promptbreeder.md` (245 lines)
- `02-thompson-sampling.md` (234 lines)
- `03-llm-as-judge.md` (318 lines)
- `04-task-specific-patterns.md` (867 lines)
- `05-drift-detection.md` (781 lines)
- `06-offline-constraints.md` (821 lines)

**Original overview deleted**: `docs/05-prompt-evolution-system.md` (460 lines)

**Total consolidated**: 3,726 lines → 500 lines (this file) + archived originals

---

**Last updated**: 2025-10-30
**Next review**: After Phase 2 (real users + production data)
