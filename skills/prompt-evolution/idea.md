# prompt-evolution

**Status**: Planning (Phase 1) - NOT PRIORITIZED
**Created**: 2025-11-02
**Source**: Consolidated from ideas/future-prompt-evolution.md

---

## Overview

Meta-learning system that evolves tinyArms prompts using genetic algorithms + A/B testing when accuracy drops.

**NOT** per-task optimization (no latency overhead). Runs as background job weekly.

---

## Workflow

```
1. Accuracy drop detected (<80% over 20 samples)
   ↓
2. PromptBreeder generates 3 variants (genetic algorithm, 30 generations)
   ↓
3. Thompson Sampling A/B tests variants with users
   ↓
4. Best prompt replaces current (weekly cooldown)
```

---

## Model Stack

- **SmolLM2-360M**: Prompt generation (200-250MB, 5-8s, offline)
- **Flow Judge**: Variant pre-screening (2B, optional Phase 2)
- **Thompson Sampling**: Statistical A/B testing (no model, pure math)

---

## Example Evolution

```
Original prompt:
"Generate a descriptive filename based on visual content"

After 30 generations:
"Analyze image semantics and create a kebab-case filename
reflecting primary objects and context"

Result: 78% → 91% accuracy (+13%)
```

---

## Key Research

- **PromptBreeder** (Google DeepMind, ICML 2024): Genetic algorithm, 83.9% accuracy
- **Thompson Sampling**: Bayesian A/B testing, 95% confidence after ~100 samples
- **ADWIN Drift Detection**: Early warning before accuracy drops

**Industry Validation**: AutoMix (NeurIPS 2024) achieves 50%+ cost reduction with similar approach

---

## Why Not Implementing Now

- Requires base system working first (0% implemented)
- Needs 20+ user feedback samples per skill (no users yet)
- Premature optimization (focus on core routing first)

**Decision**: Archive research, revisit after Phase 2 (real users + production data)

---

## Storage

```sql
prompt_variants (SQLite):
  - variant_id, skill_name, prompt_text
  - generation (0-30), parent_id, mutation_type
  - fitness_score (0-1), created_at
```

---

## References

- **Full Research**: ideas/future-prompt-evolution.md (239 lines)
- **PromptBreeder Paper**: [arxiv.org/abs/2309.16797](https://arxiv.org/abs/2309.16797)
- **SmolLM2**: [HuggingFace - HuggingFaceTB/SmolLM2-360M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)

---

**Timeline**: 6-8 weeks (40-60 hours) - IF PRIORITIZED
**Complexity**: High (genetic algorithms, A/B testing, drift detection)
**Priority**: Low (Phase 6+, after core features proven)
