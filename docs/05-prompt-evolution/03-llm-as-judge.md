# LLM-as-Judge: Flow Judge Pre-Screening

**Part of**: [Prompt Evolution System](../05-prompt-evolution-system.md)
**Status**: Research phase (0% implemented), **Phase 2 feature**
**Date**: 2025-10-27

---

## Overview

**Framework**: Flow Judge (3.8B) - Specialized evaluation model
**Why chosen**: Best offline judge, 75-80% human agreement, 10-15% better than jan-nano-4b, reduces user burden 33-55%
**Source**: https://huggingface.co/flow-ai/flow-judge
**Research**: See `docs/research/vector-3-llm-as-judge.md` for full comparison

---

## When to Use

```yaml
Phase 1: SKIP
  Reason: User votes on all 3 PromptBreeder variants directly
  Benefit: Simplest implementation, no extra model needed

Phase 2: ENABLE
  Reason: Reduce user burden from 30 → 15-20 votes
  Benefit: Filter low-quality variants before user sees them
```

---

## Workflow (Phase 2)

```
PromptBreeder generates 5 variants (not 3)
  ↓
Flow Judge scores each variant (5-8s per variant, 25-40s total)
  ↓
Filter: Reject 2 variants scoring <70/100
  ↓
Thompson Sampling A/B test on top 3 (15-20 votes, not 30)
  ↓
Winner promoted
```

**Reduction**: Before: 30 votes on 3 variants → After: 15-20 votes on 3 pre-screened variants
**Savings**: 33-55% less user burden

---

## Algorithm: 5-Dimension Rubric Scoring

```yaml
FOR each variant:
  # Step 1: Build judge prompt
  judge_prompt = f"""
  You are evaluating a prompt variant for {skill_name}.

  Original prompt: {baseline_prompt}
  Variant to score: {variant_prompt}

  Score this variant on these dimensions (0-10):

  1. Grammar: No typos, clear sentences, proper punctuation
     Score: __/10

  2. Relevance: Addresses skill task directly (file naming, code linting)
     Score: __/10

  3. Specificity: Concrete examples, format guidance, constraints
     Score: __/10

  4. Clarity: Unambiguous instructions, no vague terms
     Score: __/10

  5. Consistency: Follows tinyArms style (kebab-case, structured)
     Score: __/10

  Overall reasoning: [1-2 sentences]

  Return JSON:
  {{
    "grammar": X,
    "relevance": Y,
    "specificity": Z,
    "clarity": A,
    "consistency": B,
    "reasoning": "..."
  }}
  """

  # Step 2: Flow Judge generates scores
  response = flow_judge.generate(judge_prompt)
  scores = parse_json(response)

  # Step 3: Calculate weighted overall score
  overall = (
    scores.grammar * 0.15 +
    scores.relevance * 0.30 +
    scores.specificity * 0.25 +
    scores.clarity * 0.20 +
    scores.consistency * 0.10
  ) * 10  # Scale to 0-100

  # Step 4: Classify variant
  IF overall < 70:
    REJECT → "Low quality"
  ELSE IF overall >= 90 AND unique_best:
    AUTO_PROMOTE → Skip user voting
  ELSE:
    ACCEPT → User votes
```

---

## Example Scoring Session: File Naming Skill

**5 Variants Generated**:

### Variant A: "Rename this file nicely"

```
Grammar: 9/10 (correct English)
Relevance: 8/10 (addresses file naming)
Specificity: 3/10 ("nicely" is vague, no examples)
Clarity: 5/10 ("nicely" is subjective)
Consistency: 7/10 (mentions renaming)

Overall: (9*0.15 + 8*0.30 + 3*0.25 + 5*0.20 + 7*0.10) * 10 = 62.5/100

Decision: REJECT ❌
```

### Variant B: "Rename using format: [subject]-[context].kebab-case. Example: hero-mobile-screenshot.png"

```
Grammar: 10/10 (perfect syntax)
Relevance: 10/10 (directly addresses task)
Specificity: 10/10 (format + example provided)
Clarity: 10/10 (unambiguous instructions)
Consistency: 10/10 (matches tinyArms style)

Overall: (10*0.15 + 10*0.30 + 10*0.25 + 10*0.20 + 10*0.10) * 10 = 100/100

Decision: ACCEPT ✅ (maybe auto-promote if unique winner)
```

### Variant C: "Describe the image as a filename"

```
Grammar: 10/10
Relevance: 9/10
Specificity: 4/10 (no format, no examples)
Clarity: 6/10 (what style? length?)
Consistency: 7/10

Overall: (10*0.15 + 9*0.30 + 4*0.25 + 6*0.20 + 7*0.10) * 10 = 68/100

Decision: REJECT ❌
```

### Variant D: "Analyze image and rename: [subject]-[platform]-[version].kebab-case. Examples: hero-mobile-v1.png, dashboard-desktop-final.png"

```
Grammar: 10/10
Relevance: 10/10
Specificity: 10/10
Clarity: 9/10
Consistency: 10/10

Overall: (10*0.15 + 10*0.30 + 10*0.25 + 9*0.20 + 10*0.10) * 10 = 98/100

Decision: ACCEPT ✅
```

### Variant E: "Rename with descriptive keywords, use kebab-case format, include context clues"

```
Grammar: 10/10
Relevance: 9/10
Specificity: 7/10 (guidelines but no examples)
Clarity: 8/10
Consistency: 10/10

Overall: (10*0.15 + 9*0.30 + 7*0.25 + 8*0.20 + 10*0.10) * 10 = 85/100

Decision: ACCEPT ✅
```

### Result

- **Accepted**: B, D, E (3 variants → User votes on these)
- **Rejected**: A, C (2 variants → Removed before user sees them)

---

## 3-Tier Judge Strategy

**Why multiple tiers**: Balance offline/cost/accuracy

| Tier | Judge Model | Agreement | Offline | Cost | When to Use |
|------|-------------|-----------|---------|------|-------------|
| **Tier 1** | **Flow Judge (3.8B)** | **75-80%** | **✅ YES** | **$0** | **Default (Phase 2+)** |
| **Tier 2** | **GPT-5-mini** | **85-90%** | **❌ NO** | **~$0.005/variant** | **Critical skills (code-linting)** |
| **Tier 3** | **jan-nano-4b** | **65-75%** | **✅ YES** | **$0** | **Phase 1 only (already installed)** |

### Configuration

```yaml
# config/constants.yaml

prompt_evolution:
  llm_as_judge:
    enabled: false  # Phase 1: Disabled
                    # Phase 2: Enabled

    tier_1_primary: "flow-judge:3.8b"
    tier_2_fallback: "gpt-5-mini"    # OpenAI API
    tier_3_backup: "jan-nano-4b"     # If Flow not installed

    validation_threshold: 0.70  # Escalate to tier 2 if <70%

    usage:
      default: tier_1_primary

      use_tier_2_if:
        - tier_1_agreement < 0.70  # Validation failed
        - skill_criticality: high  # code-linting, audio-actions
        - user_flag: --use-cloud   # Manual override

      use_tier_3_if:
        - tier_1_not_installed: true
        - memory_limited: true
        - phase: "1-prototype"

    cost_budget:
      max_per_evolution: 0.05  # $0.05 = 10 variants @ GPT-5-mini
      max_per_month: 2.00      # $2/month cloud budget
```

---

## Why Flow Judge Wins

### Comparison

**Flow Judge (3.8B)**:
- ✅ Specialized for judging (trained on evaluation tasks)
- ✅ 75-80% human agreement (10-15% better than jan-nano-4b)
- ✅ 100% offline (no API, no internet)
- ✅ $0 cost
- ✅ 5-8s latency (acceptable for background pre-screening)
- ✅ 3.8GB size (fits 8GB M1 with SmolLM2-360M)

**GPT-5-mini (fallback)**:
- ✅ 85-90% agreement (best accuracy, +10-15% vs Flow)
- ✅ 0.2-0.5s latency (10x faster)
- ❌ Requires internet + API key
- ❌ $0.005-0.008 per variant ($0.025-0.04 per evolution)
- ⚠️ Fallback only for critical skills or Flow validation failure

**jan-nano-4b (already installed)**:
- ✅ Already in tinyArms (research agent, 4.3GB)
- ✅ 100% offline
- ✅ $0 cost
- ❌ 65-75% agreement (10-15% worse than Flow)
- ❌ Not specialized (general-purpose model)
- ⚠️ Use only in Phase 1 before Flow installed

---

## Installation

```bash
# Phase 1: Use jan-nano-4b (already installed)
# No action needed

# Phase 2: Install Flow Judge
ollama pull flow-judge:3.8b
# Download: 3.8GB one-time

# Phase 3 (optional): Configure GPT-5-mini fallback
export OPENAI_API_KEY="sk-..."
# Only used for critical skills or validation failure
```

---

## Memory Budget

```
Concurrent Load (Phase 2):
  SmolLM2-360M (PromptBreeder): 250MB
  Flow Judge (pre-screening): 3,800MB
  Total: 4,050MB ✅ Fits 8GB M1

Alternative (Phase 1):
  SmolLM2-360M: 250MB
  jan-nano-4b: 4,300MB
  Total: 4,550MB ✅ Fits 8GB M1

Cloud Fallback (Phase 3):
  SmolLM2-360M: 250MB
  GPT-5-mini: 0MB (remote API)
  Total: 250MB ✅ Lightest
```

---

## References

- **Flow Judge**: https://huggingface.co/flow-ai/flow-judge
- **LLM-as-Judge Research**: G-Eval, Prometheus, PandaLM (see `docs/research/vector-3-llm-as-judge.md`)
- **Human Agreement**: 75-80% for Flow Judge vs 65-75% for general-purpose models

---

**Next**: [Task-Specific Patterns](04-task-specific-patterns.md)
