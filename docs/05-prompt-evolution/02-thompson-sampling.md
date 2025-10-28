# Thompson Sampling: Bayesian A/B Testing

**Part of**: [Prompt Evolution System](../05-prompt-evolution-system.md)
**Status**: Research phase (0% implemented)
**Date**: 2025-10-27

---

## Overview

**Framework**: Thompson Sampling (Bayesian Multi-Armed Bandit)
**Why chosen**: Dynamic allocation, no parameter tuning, handles small samples (15-25 votes vs 50 fixed), 40-50% more efficient
**Source**: Russo et al. (2018) "A Tutorial on Thompson Sampling", Stanford
**Research**: See `docs/research/vector-2-ab-testing-statistics.md` for full comparison

---

## Algorithm: Bayesian Bandit with Beta Distribution

```yaml
INITIALIZATION:
  FOR each variant (A, B, C):
    successes[variant] = 0  # User picked this variant
    failures[variant] = 0   # User picked another variant

AT EACH USER VOTE (dynamic allocation):
  # Step 1: Sample from Beta distributions
  FOR variant in [A, B, C]:
    # Beta distribution models "belief" about win rate
    theta[variant] = sample_from_Beta(
      alpha = successes[variant] + 1,
      beta = failures[variant] + 1
    )
    # theta = "believed win rate" for this draw

  # Step 2: Show variant with highest sample (probabilistic selection)
  chosen = argmax(theta)
  # Early on: distributions overlap → exploration
  # Later: winner's distribution shifts right → exploitation

  # Step 3: User picks best result
  user_selection = show_options_and_get_vote(chosen, other_variants)

  # Step 4: Bayesian update
  IF user_selection == chosen:
    successes[chosen] += 1
  ELSE:
    failures[chosen] += 1
    successes[user_selection] += 1
    failures[NOT chosen, NOT user_selection] += 1

STOPPING CRITERIA (check after every 5 votes):
  # Condition 1: High Bayesian confidence
  monte_carlo_samples = 10000
  samples_A = Beta.sample(α_A, β_A, size=monte_carlo_samples)
  samples_B = Beta.sample(α_B, β_B, size=monte_carlo_samples)
  samples_C = Beta.sample(α_C, β_C, size=monte_carlo_samples)

  prob_A_wins = mean(samples_A > samples_B AND samples_A > samples_C)
  # Similar for B, C

  IF max(prob_A_wins, prob_B_wins, prob_C_wins) > 0.95:
    STOP → Declare winner

  # Condition 2: Max votes reached
  IF total_votes >= 50:
    STOP → Declare variant with highest mean

  # Condition 3: Max time elapsed
  IF days_elapsed >= 7:
    STOP → Declare variant with highest mean OR "no difference"
```

---

## Why Beta Distribution?

### Mathematical Properties

```
Conjugate prior for Bernoulli likelihood:
  Prior: Beta(α, β)
  Likelihood: Bernoulli(θ)  # Binary vote: 👍 or 👎
  Posterior: Beta(α + successes, β + failures)

No numerical integration needed (closed-form update)
```

### Intuitive Meaning

- **α (alpha)** = "successes + 1" (pseudo-count of wins)
- **β (beta)** = "failures + 1" (pseudo-count of losses)
- **Mean** = α / (α + β) = empirical win rate
- **Variance** decreases as α + β increases (more data = tighter belief)

---

## Example: Vote-by-Vote Evolution

```
VOTE 1:
  State: A = Beta(1,1), B = Beta(1,1), C = Beta(1,1)  # Uniform priors
  Sample: A=0.52, B=0.48, C=0.61
  Show: C (highest sample)
  User picks: C ✅
  Update: C = Beta(2,1)  # α += 1

VOTE 2:
  State: A = Beta(1,1), B = Beta(1,1), C = Beta(2,1)
  Sample: A=0.43, B=0.39, C=0.73
  Show: C (higher prior → higher samples)
  User picks: A ❌ (overrides)
  Update: A = Beta(2,1), C = Beta(2,2)  # α += 1 for A, β += 1 for C

VOTE 5:
  State: A = Beta(3,2), B = Beta(1,4), C = Beta(2,3)
  Mean win rates: A=0.60, B=0.20, C=0.40
  Sample: A=0.64, B=0.11, C=0.38
  Show: A (consistently higher)

VOTE 15:
  State: A = Beta(10,5), B = Beta(2,13), C = Beta(3,12)
  Mean win rates: A=0.67, B=0.13, C=0.20
  Traffic allocation: A gets 60%, B gets 15%, C gets 25% (dynamic!)

  Bayesian confidence check:
    P(A > B AND A > C | data) = 0.94
  Continue (need 0.95)

VOTE 20:
  State: A = Beta(14,6), B = Beta(2,18), C = Beta(4,16)
  P(A wins | data) = 0.97 > 0.95 ✅
  STOP EARLY → Declare A winner (saved 30 votes!)
```

**Key insight**: Dynamic allocation sends 60% traffic to winner A, only 20% to losers B/C, learns faster.

---

## UI Example

**When next file needs naming**:

```
┌─────────────────────────────────────────────────────────────┐
│ 🦖 tinyArms: File Naming - Help Us Improve!                │
├─────────────────────────────────────────────────────────────┤
│ File: Screenshot-2024-10-27.png                            │
│                                                             │
│ We're testing new prompts. Choose your preferred name:     │
│                                                             │
│ Option A: hero-section-mobile-mockup.png                   │
│   (Confidence: 67% ████████████░░░░░░)                     │
│                                                             │
│ Option B: website-header-blue-accent.png                   │
│   (Confidence: 13% ███░░░░░░░░░░░░░░)                      │
│                                                             │
│ Option C: hero-mobile-v1.png                               │
│   (Confidence: 20% ████░░░░░░░░░░░░░)                      │
│                                                             │
│ [A] [B] [C] [Skip]    Votes so far: 15/50                  │
│                                                             │
│ 💡 Tip: Option A is leading. Need 5 more votes to confirm. │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Not Other Methods?

| Method | Avg Votes | Traffic to Winner | Early Stop | Complexity | Why NOT Chosen |
|--------|-----------|-------------------|------------|------------|----------------|
| **Thompson Sampling** | **15-25** | **60% dynamic** | ✅ YES | MEDIUM | ✅ **CHOSEN** |
| Sequential Testing | 25-35 | 33% fixed | ✅ YES | LOW | Wastes 67% traffic on losers, no dynamic allocation |
| UCB | 20-30 | 50-60% dynamic | ✅ YES | MEDIUM | Requires tuning exploration constant, deterministic (less diverse) |
| Fixed A/B | 50 | 33% fixed | ❌ NO | LOW | 40-50% slower, no early stopping, no dynamic allocation |

**Source**: Comparison studies, Stanford tutorial, Towards Data Science

**Performance improvement**: Thompson Sampling saves **40-50% votes** vs fixed allocation (50 → 15-25 votes).

---

## Sequential Boundary Check (Backup)

**If Bayesian confidence doesn't reach 0.95 by vote 30**:

```
Use Evan Miller's sequential boundary:
  boundary = 2.25 * sqrt(N_planned)
          = 2.25 * sqrt(50)
          = 15.9 votes difference

IF winner_votes - runner_up_votes >= 16:
  STOP → Declare winner

ELSE IF votes >= 50:
  STOP → Declare winner OR "no significant difference"
```

**Rationale**: Failsafe if Bayesian doesn't converge (rare with good variants).

---

## Configuration

```yaml
# config/constants.yaml
prompt_evolution:
  thompson_sampling:
    min_votes: 15                    # Minimum before stopping
    max_votes: 50                    # Hard cap
    max_duration_days: 7             # Time limit
    confidence_threshold: 0.95       # Bayesian confidence
    check_interval: 5                # Check stopping criteria every N votes

    monte_carlo_samples: 10000       # For confidence calculation
    sequential_boundary_factor: 2.25 # Evan Miller's formula

    show_probability: 0.5            # 50% of tasks show A/B choice
```

---

## References

- **Tutorial**: Russo et al. (2018) "A Tutorial on Thompson Sampling" [https://arxiv.org/abs/1707.02038]
- **Sequential Testing**: Evan Miller's A/B testing tools [https://www.evanmiller.org/sequential-ab-testing.html]
- **Beta Distribution**: Conjugate prior for Bernoulli trials
- **Comparison**: See `docs/research/vector-2-ab-testing-statistics.md`

---

**Next**: [LLM-as-Judge Pre-Screening](03-llm-as-judge.md)
