# SmolLM2-360M: Prompt Evolution System

**Purpose**: Meta-learning system that continuously improves tinyArms prompts through user feedback
**Status**: Research phase (0% implemented)
**Date**: 2025-10-27

---

## Overview

This document provides a high-level overview of tinyArms' prompt evolution system. For detailed implementation, see:

- **[01-promptbreeder.md](05-prompt-evolution/01-promptbreeder.md)** - PromptBreeder genetic algorithm (Step 1)
- **[02-thompson-sampling.md](05-prompt-evolution/02-thompson-sampling.md)** - Thompson Sampling A/B testing (Step 2)
- **[03-llm-as-judge.md](05-prompt-evolution/03-llm-as-judge.md)** - Flow Judge pre-screening (Step 2.5, Phase 2)
- **[04-task-specific-patterns.md](05-prompt-evolution/04-task-specific-patterns.md)** - Proven patterns for all 4 skills (Step 3)
- **[05-implementation.md](05-prompt-evolution/05-implementation.md)** - Storage, testing, risks, CLI commands

---

## Model Selection

**Previous Choice**: flan-t5-small (60M params, 200MB)
**Current Choice**: SmolLM2-360M-Instruct (360M params, 200-250MB Q4)

### Comparison

| Metric | flan-t5-small | SmolLM2-360M-Instruct | Winner |
|--------|---------------|----------------------|--------|
| Parameters | 60M | 360M | SmolLM2 (6x) |
| Size (disk) | 200MB | 200-250MB (Q4_K_M) | Tie |
| Context window | 512 tokens | 8,192 tokens | SmolLM2 (16x) |
| Latency (8GB M1) | 2-3s | 5-8s | flan-t5 |
| Instruction following | Good | Excellent | SmolLM2 |
| Multi-turn coherence | Fair | Excellent | SmolLM2 |
| License | Apache 2.0 | Apache 2.0 | Tie |

### Why SmolLM2-360M?

1. **Better reasoning**: 6x more parameters = stronger instruction following
2. **Larger context**: 8K tokens fits full prompt history + examples (vs 512 token limit)
3. **Still fits 8GB RAM**: Q4 quantization keeps size <250MB
4. **Acceptable latency**: 5-8s is fine for nightly/bi-daily background jobs
5. **Modern architecture**: Released 2024, optimized for small hardware

### Trade-off

**Latency increase**: 2-3s → 5-8s (2.5x slower)
**Acceptable because**: Runs max once per week per skill, user never waits

---

## Core Concept

**NOT a per-task optimizer** (that would add 500ms to every operation)

**IS a meta-learning system** that:
1. Generates prompt variants when accuracy drops
2. A/B tests variants with users
3. Learns from user choices
4. Evolves prompts over time

---

## How It Works

### Trigger: Accuracy Drop Detected

```yaml
# config/constants.yaml
prompt_evolution:
  trigger:
    skill_accuracy_threshold: 0.80  # Below 80% = trigger evolution
    feedback_sample_size: 20        # Need 20 samples to detect drop
    evolution_cooldown_hours: 168   # Max once per week per skill
```

**Example**:
```
file-naming skill accuracy: 92% → 78% (dropped 14%)
Trigger: Generate new prompt variants
```

---

### Step 1: PromptBreeder Generates Variants

**Framework**: PromptBreeder (Google DeepMind, ICML 2024)
**Why chosen**: Self-referential genetic algorithm, works with 360M models, 83.9% accuracy
**Details**: See [01-promptbreeder.md](05-prompt-evolution/01-promptbreeder.md)

**Quick summary**:
- Binary tournament genetic algorithm
- 5 mutation operators (direct, first-order, crossover, zero-order, hypermutation)
- Self-referential: Mutation strategies EVOLVE too
- Output: Top 3 prompt variants after 30 generations

---

### Step 2: Thompson Sampling A/B Test

**Framework**: Thompson Sampling (Bayesian Multi-Armed Bandit)
**Why chosen**: Dynamic allocation, no parameter tuning, 40-50% more efficient
**Details**: See [02-thompson-sampling.md](05-prompt-evolution/02-thompson-sampling.md)

**Quick summary**:
- Dynamic traffic allocation (60% to winner, 20% to losers)
- Bayesian confidence stopping (0.95 threshold)
- Early stopping: 15-25 votes vs 50 fixed
- Beta distribution for probabilistic selection

---

### Step 2.5: LLM-as-Judge Pre-Screening (Optional Phase 2)

**Framework**: Flow Judge (3.8B) - Specialized evaluation model
**Why chosen**: 75-80% human agreement, reduces user burden 33-55%
**Details**: See [03-llm-as-judge.md](05-prompt-evolution/03-llm-as-judge.md)

**Quick summary**:
- 5-dimension rubric scoring (grammar, relevance, specificity, clarity, consistency)
- Filters low-quality variants (<70/100) before user voting
- 3-tier strategy: Flow Judge (default), GPT-5-mini (fallback), jan-nano-4b (Phase 1)
- Reduces voting burden: 30 → 15-20 votes

---

### Step 3: Task-Specific Prompt Patterns

**Purpose**: Apply proven patterns for each tinyArms skill
**Research**: 51 academic sources + official prompt libraries (Anthropic, OpenAI)
**Details**: See [04-task-specific-patterns.md](05-prompt-evolution/04-task-specific-patterns.md)

**Patterns by skill**:
- **Code Linting**: Rule enumeration + JSON schema
- **File Naming**: Structured format + 3-5 examples
- **Markdown Analysis**: Map-reduce chunking
- **Audio Actions**: Intent + entity extraction

**Cross-task patterns**:
- Few-shot examples (11% → 75% accuracy for tool-calling)
- Chain-of-thought (for complex multi-step tasks)
- Constrained output (JSON schema guarantees valid output)
- Task decomposition (split → analyze → synthesize)
- Role assignment (establishes expertise lens)

---

### Step 4: Learn from Choices

**Track results**:
```yaml
# SQLite: prompt_evolution table
evolution_session_id: abc123
skill: file-naming
original_prompt_hash: def456
variants:
  - id: variant_a
    prompt: "Analyze the image..."
    votes: 12
    accuracy: 0.87

  - id: variant_b
    prompt: "Describe what you see..."
    votes: 8
    accuracy: 0.82

  - id: variant_c
    prompt: "Rename based on visual..."
    votes: 15  # Winner!
    accuracy: 0.91

winning_variant: variant_c
promoted_at: "2024-11-03T10:00:00Z"
```

**After 30 votes** (or 7 days):
- Variant C wins (15 votes, 91% accuracy)
- Update skill config:

```yaml
# config.yaml - Updated automatically
skills:
  file-naming:
    prompt_template: skills/file-naming-v2.md  # ← Updated!
    prompt_version: 2
    evolved_at: "2024-11-03T10:00:00Z"
    previous_accuracy: 0.78
    current_accuracy: 0.91
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Accuracy Monitor                         │
│  (Background service, checks every 24 hours)                │
│                                                             │
│  Query SQLite: SELECT accuracy FROM task_history           │
│  WHERE skill = 'file-naming'                                │
│  AND created_at > NOW() - INTERVAL 7 DAYS                   │
│  GROUP BY skill                                             │
│                                                             │
│  IF accuracy < 0.80 AND last_evolution > 7 days ago:        │
│    TRIGGER: Prompt Evolution                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           SmolLM2-360M-Instruct Prompt Generator           │
│  (Runs ONCE when triggered, not per-task)                  │
│                                                             │
│  Input:                                                     │
│    - Current prompt                                         │
│    - Recent failure examples (20 samples)                   │
│    - Successful examples (top 10)                           │
│    - Skill context (file naming, code linting, etc.)       │
│                                                             │
│  Output:                                                    │
│    - 3 prompt variants with reasoning                       │
│                                                             │
│  Latency: ~5-8s (one-time cost)                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   A/B Testing Phase                         │
│  (Next 30 tasks for this skill)                            │
│                                                             │
│  For each task:                                             │
│    1. Run all 4 prompts (original + 3 variants)            │
│    2. Show user 3 results (random order)                    │
│    3. User picks best                                       │
│    4. Record: variant_id, user_choice, task_success         │
│                                                             │
│  After 30 votes or 7 days:                                  │
│    - Calculate winner (votes × accuracy)                    │
│    - Promote winning prompt to production                   │
│    - Archive other variants                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Promotion & Learning                      │
│                                                             │
│  1. Update skill config with winning prompt                 │
│  2. Log evolution history (for rollback)                    │
│  3. Reset accuracy counter                                  │
│  4. Continue monitoring...                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## User Experience

### Silent Evolution (Default)

**Week 1-6**: Skill works normally at 92% accuracy
**Week 7**: Accuracy drops to 78%
**Week 8**: tinyArms detects drop, generates variants (user sees nothing yet)
**Week 8-9**: User occasionally sees A/B choice dialogs (10-30 times)
**Week 10**: Winning prompt auto-promoted, accuracy back to 90%

**User never had to edit YAML or write prompts manually**

---

### Power User Mode (Optional)

```bash
# View current prompt performance
tinyarms prompt stats file-naming

# Force prompt evolution (skip waiting for drop)
tinyarms prompt evolve file-naming --variants 5

# View A/B test results
tinyarms prompt results file-naming

# Manually promote a variant
tinyarms prompt promote file-naming variant_c
```

**Full CLI reference**: See [05-implementation.md](05-prompt-evolution/05-implementation.md#cli-commands-power-user-mode)

---

## Configuration

```yaml
# config/constants.yaml

prompt_evolution:
  enabled: true

  triggers:
    accuracy_threshold: 0.80        # ESTIMATED - Industry "good enough" bar
    # Source: ML ops standard (80% = acceptable, 90% = excellent)
    # Status: PLACEHOLDER - tune based on user tolerance

    sample_size: 20                 # ARBITRARY - Need statistical significance
    # Source: NONE (gut feeling: 20 samples = reasonable)
    # Status: PLACEHOLDER - may need 50+ for confidence

    cooldown_hours: 168             # ARBITRARY - Once per week max
    # Source: NONE (prevent evolution fatigue)
    # Status: PLACEHOLDER - tune based on user feedback

  ab_testing:
    votes_required: 30              # ARBITRARY - Enough for winner
    # Source: A/B testing best practices (30+ samples = significance)
    # Status: PLACEHOLDER - may be too many

    max_duration_days: 7            # ARBITRARY - Force decision after 1 week
    # Source: NONE (don't test forever)
    # Status: PLACEHOLDER

    show_probability: 0.5           # ARBITRARY - 50% of tasks show A/B choice
    # Source: Balance learning vs annoyance
    # Status: PLACEHOLDER - tune based on user feedback

  smollm2:
    model: "smollm2:360m-instruct-q4_k_m"  # Updated from flan-t5:small
    quantization: "Q4_K_M"                # 200-250MB
    context_window: 8192                  # 16x larger than flan-t5 (512 tokens)
    variants_per_evolution: 3             # ARBITRARY - Too many = choice paralysis
    # Source: UX research (3-4 options = optimal choice)
    # Status: PLACEHOLDER

    latency_budget_ms: 8000               # Updated from 5000ms (5-8s acceptable)
    # Source: SmolLM2 benchmarks (HuggingFace), nightly job = latency not critical
    # Status: NEEDS_VALIDATION (test on 8GB M1)

  learning:
    min_accuracy_improvement: 0.05  # ARBITRARY - 5% = meaningful
    # Source: NONE (5% seems worth the effort)
    # Status: PLACEHOLDER

    rollback_threshold: 0.70        # ARBITRARY - If new prompt < 70%, rollback
    # Source: Safety net (don't make things worse)
    # Status: PLACEHOLDER
```

---

## Skills That Benefit

### High Variation Skills (Good Candidates)

**file-naming**:
- High variation in image content (screenshots, photos, diagrams)
- User preferences vary (some want verbose, some concise)
- Hard to write perfect prompt upfront

**audio-actions**:
- Voice transcription quality varies (accents, background noise)
- Action extraction is subjective (what counts as "action"?)
- Prompts need tuning per user

**markdown-analysis**:
- Documentation style varies per project
- "Important change" is subjective
- Prompt evolves with project maturity

---

### Low Variation Skills (Poor Candidates)

**code-linting-fast**:
- Constitutional rules are fixed (hardcoded colors = always bad)
- Little room for prompt improvement (rules are rules)
- Accuracy issues = need better model, not better prompt

---

## Implementation Phases

### Phase 1: Manual Prompt Evolution (No SmolLM2)

```bash
# User manually creates variants
tinyarms prompt create file-naming \
  --variant-a skills/file-naming-structured.md \
  --variant-b skills/file-naming-colors.md \
  --variant-c skills/file-naming-priority.md

# tinyArms A/B tests (30 votes)
# Winner auto-promoted
```

**Deliverable**: A/B testing framework, winner promotion logic

---

### Phase 2: SmolLM2 Auto-Generation

```bash
# Accuracy drops, SmolLM2 auto-generates variants
# (No user action needed)
```

**Deliverable**: Integrate SmolLM2-360M-Instruct, variant generation logic

---

### Phase 3: Multi-Skill Learning

```yaml
# Learnings from file-naming evolution applied to audio-actions
prompt_evolution:
  cross_skill_learning: true
  # If file-naming improved with "prioritized metadata" structure,
  # apply similar structure to audio-actions prompts
```

**Deliverable**: Meta-learning across skills

---

## References

- **SmolLM2 model card**: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
- **SmolLM2 announcement**: https://huggingface.co/blog/smollm2
- **Ollama SmolLM2 models**: https://ollama.com/library/smollm2
- **PromptBreeder paper**: Fernando et al. (2024) [https://arxiv.org/abs/2309.16797]
- **Thompson Sampling tutorial**: Russo et al. (2018) [https://arxiv.org/abs/1707.02038]
- **Flow Judge**: https://huggingface.co/flow-ai/flow-judge
- **A/B testing best practices**: Kohavi & Longbotham (2017), "Online Controlled Experiments"
- **Prompt optimization**: OpenAI prompt engineering guide
- **Meta-learning**: Nichol et al. (2018), "Reptile: A Scalable Meta-Learning Algorithm"

---

## Status

**Phase**: Research (0% implemented)
**Next steps**:
1. Validate SmolLM2-360M-Instruct can generate coherent prompt variants
2. Build A/B testing UI (terminal prompt or macOS notification)
3. Implement SQLite schema for tracking
4. Test with file-naming skill (high variation, easy to judge)

**Timeline**:
- Phase 1 (Manual): Week 1-2 (build A/B framework)
- Phase 2 (SmolLM2): Week 3-4 (integrate model)
- Phase 3 (Production): Week 5+ (deploy to 1-2 skills)

---

**Key insight**: SmolLM2 is NOT a per-task overhead. It's a **self-improvement system** that runs in the background when skills need tuning.

---

## Detailed Documentation

- **[01-promptbreeder.md](05-prompt-evolution/01-promptbreeder.md)** - PromptBreeder genetic algorithm, 5 mutation operators, self-referential advantage
- **[02-thompson-sampling.md](05-prompt-evolution/02-thompson-sampling.md)** - Bayesian A/B testing, Beta distribution, dynamic allocation
- **[03-llm-as-judge.md](05-prompt-evolution/03-llm-as-judge.md)** - Flow Judge pre-screening, 3-tier judge strategy, 5-dimension rubric
- **[04-task-specific-patterns.md](05-prompt-evolution/04-task-specific-patterns.md)** - Proven patterns for all 4 skills, cross-task patterns, mutation guidance
- **[05-implementation.md](05-prompt-evolution/05-implementation.md)** - Storage schema, testing plan, risks & mitigations, CLI commands, example evolution
