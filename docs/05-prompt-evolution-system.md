# SmolLM2-360M: Prompt Evolution System

**Purpose**: Meta-learning system that continuously improves tinyArms prompts through user feedback
**Status**: Research phase (0% implemented)
**Date**: 2025-10-27

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
**Why chosen**: Self-referential genetic algorithm, works with 360M models, 83.9% accuracy (outperformed OPRO 82.3%, DSPy MIPRO 83.2%)
**Source**: https://arxiv.org/abs/2309.16797
**Research**: See `docs/research/vector-1-prompt-optimization-frameworks.md` for full comparison

#### Algorithm: Binary Tournament Genetic Algorithm

```yaml
INITIALIZATION:
  population_size: 20  # Smaller than paper's 50 (memory constraint)
  generations: 30      # vs 50-100 in paper
  evaluation_samples: 10  # Per generation

  # Seed population with baseline + manual variants
  population[0] = current_prompt
  population[1..19] = SmolLM2.generate_initial_variants(current_prompt)

FOR generation in 1..30:
  # Step 1: Binary tournament selection
  prompt_A = random_from_population()
  prompt_B = random_from_population()

  # Step 2: Evaluate both (10 examples from failure set)
  score_A = test_accuracy(prompt_A, samples=10)
  score_B = test_accuracy(prompt_B, samples=10)

  # Step 3: Winner advances
  winner = prompt_A if score_A > score_B else prompt_B
  loser = prompt_B if score_A > score_B else prompt_A

  # Step 4: Mutate winner (5 operators, pick randomly)
  mutation_type = weighted_random([
    ("direct", 0.30),           # 30% - "Make this prompt clearer"
    ("first_order", 0.30),      # 30% - "Refine this prompt"
    ("crossover", 0.20),        # 20% - "Combine two prompts"
    ("zero_order", 0.15),       # 15% - "Generate fresh from scratch"
    ("hypermutation", 0.05)     # 5% - "Mutate the mutation strategy"
  ])

  mutated_prompt = apply_mutation(winner, mutation_type)

  # Step 5: Replace loser
  population.replace(loser, mutated_prompt)

  # Step 6: Track best
  IF score(mutated_prompt) > score(current_best):
    current_best = mutated_prompt

# Final evaluation on 100 examples
RETURN top_3_prompts_from_population(evaluated_on=100)
```

#### Five Mutation Operators

**1. Direct Mutation (30% probability)**
```
Template:
  "Current prompt: {prompt}

   Recent failures:
   {failure_examples}

   Task: Generate an improved prompt that fixes these failures.
   Make it more specific and structured.

   New prompt:"

Example:
  Input: "Rename this file based on visual content"
  Output: "Analyze the image and rename using format: [subject]-[context]-[type].kebab-case"
```

**2. First-Order Generation (30% probability)**
```
Template:
  "Current prompt: {prompt}
   Success rate: {accuracy}%

   Refine this prompt to improve clarity and task alignment.
   Keep the core idea but add structure or examples.

   Refined prompt:"

Example:
  Input: "Summarize this article"
  Output: "Condense this article's main points into 3 key sentences"
```

**3. Prompt Crossover (20% probability)**
```
Template:
  "Prompt A: {prompt_a}
   Prompt B: {prompt_b}

   Combine the best elements of both prompts into one.

   Combined prompt:"

Example:
  A: "Explore character development"
  B: "Examine plot structure"
  Output: "Analyze how character development drives plot structure"
```

**4. Zero-Order Generation (15% probability)**
```
Template:
  "Task: {skill_description}

   Generate a fresh prompt for this task from scratch.
   Ignore previous prompts.

   New prompt:"

Example:
  Task: Math word problems
  Output: "Break down this problem into steps and solve systematically"
```

**5. Hypermutation (5% probability, Phase 2)**
```
Template:
  "Current mutation strategy: {mutation_prompt}

   Improve this mutation strategy to generate better prompt variants.

   Improved strategy:"

Example:
  Input mutation: "Make the prompt clearer"
  Output mutation: "Improve the prompt by adding examples and structure"
```

#### Self-Referential Advantage

**Traditional methods**: Fixed mutation strategy
**PromptBreeder**: Mutation strategies EVOLVE too

```
Generation 1:
  Mutation: "Make prompt clearer"
  Result: Basic improvements

Generation 15:
  Mutation (evolved): "Add structured format with examples"
  Result: Better improvements

Generation 30:
  Mutation (evolved): "Add format + examples + constraints based on failures"
  Result: Optimal improvements
```

**Performance gain**: +2-3% accuracy over fixed strategies (DSPy MIPRO, OPRO)

#### Example Evolution

**File Naming Skill**:
```
Initial prompt (v1):
  "Rename this file based on visual content. Be descriptive and use kebab-case."
  Accuracy: 78%

Generation 5 (Direct Mutation):
  "Analyze the image content and rename with descriptive keywords in kebab-case"
  Accuracy: 79%

Generation 12 (Crossover):
  "Analyze image and rename: [subject]-[context]-[type].kebab-case
   Examples: hero-mobile-screenshot.png"
  Accuracy: 82%

Generation 25 (First-Order Refinement):
  "Rename based on visual analysis. Priority: 1) Main subject, 2) Platform,
   3) Version. Format: subject-platform-version.extension"
  Accuracy: 85% ← WINNER (after full evaluation on 100 examples)
```

#### Why Not Other Frameworks?

| Framework | Accuracy | Why NOT Chosen |
|-----------|----------|----------------|
| **PromptBreeder** | **83.9%** | ✅ **CHOSEN** |
| DSPy MIPRO | 83.2% (-0.7%) | Requires 7B+ model for instruction generation, high complexity |
| OPRO | 82.3% (-1.6%) | Requires 7B+ model as optimizer, SmolLM2-360M can't analyze prompt patterns |
| EvoPrompt DE | 80.1% (-3.8%) | No self-referential improvement, fixed mutation strategy |
| EvoPrompt GA | 79.2% (-4.7%) | Mutates entire prompts (less efficient than differential) |

**Source**: GSM8K benchmark (arithmetic reasoning)

---

### Step 2: Thompson Sampling A/B Test

**Framework**: Thompson Sampling (Bayesian Multi-Armed Bandit)
**Why chosen**: Dynamic allocation, no parameter tuning, handles small samples (15-25 votes vs 50 fixed), 40-50% more efficient
**Source**: Russo et al. (2018) "A Tutorial on Thompson Sampling", Stanford
**Research**: See `docs/research/vector-2-ab-testing-statistics.md` for full comparison

#### Algorithm: Bayesian Bandit with Beta Distribution

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

#### Why Beta Distribution?

**Mathematical Properties**:
```
Conjugate prior for Bernoulli likelihood:
  Prior: Beta(α, β)
  Likelihood: Bernoulli(θ)  # Binary vote: 👍 or 👎
  Posterior: Beta(α + successes, β + failures)

No numerical integration needed (closed-form update)
```

**Intuitive Meaning**:
- α (alpha) = "successes + 1" (pseudo-count of wins)
- β (beta) = "failures + 1" (pseudo-count of losses)
- Mean = α / (α + β) = empirical win rate
- Variance decreases as α + β increases (more data = tighter belief)

#### Example: Vote-by-Vote Evolution

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

#### UI Example

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

#### Why Not Other Methods?

| Method | Avg Votes | Traffic to Winner | Early Stop | Complexity | Why NOT Chosen |
|--------|-----------|-------------------|------------|------------|----------------|
| **Thompson Sampling** | **15-25** | **60% dynamic** | ✅ YES | MEDIUM | ✅ **CHOSEN** |
| Sequential Testing | 25-35 | 33% fixed | ✅ YES | LOW | Wastes 67% traffic on losers, no dynamic allocation |
| UCB | 20-30 | 50-60% dynamic | ✅ YES | MEDIUM | Requires tuning exploration constant, deterministic (less diverse) |
| Fixed A/B | 50 | 33% fixed | ❌ NO | LOW | 40-50% slower, no early stopping, no dynamic allocation |

**Source**: Comparison studies, Stanford tutorial, Towards Data Science

**Performance improvement**: Thompson Sampling saves **40-50% votes** vs fixed allocation (50 → 15-25 votes).

#### Sequential Boundary Check (Backup)

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

### Step 3: Learn from Choices

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

# Output:
# Skill: file-naming
# Current accuracy: 78% (down from 92%)
# Prompt version: 1 (active since 2024-09-15)
# Recent failures: 15/70 tasks (21%)
# Status: Evolution triggered, A/B testing in progress

# Force prompt evolution (skip waiting for drop)
tinyarms prompt evolve file-naming --variants 5

# Output:
# Generating 5 prompt variants with SmolLM2...
# Variants saved. Next 50 tasks will A/B test.

# View A/B test results
tinyarms prompt results file-naming

# Output:
# Evolution Session: abc123
# Variant A: 12 votes, 87% accuracy
# Variant B: 8 votes, 82% accuracy
# Variant C: 15 votes, 91% accuracy ← WINNING
# 5 tasks remaining in test period

# Manually promote a variant
tinyarms prompt promote file-naming variant_c
```

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

## Example: Image File Naming Evolution

### Initial Prompt (v1)

```markdown
# skills/file-naming.md (v1)

You are renaming a file based on its visual content.

Analyze the image and generate a descriptive filename using kebab-case.

Be concise but specific.
```

**Accuracy**: 92% (Weeks 1-6)

**Note**: For comprehensive task-specific prompt patterns with proven examples, see [research/vector-4-task-specific-patterns.md](research/vector-4-task-specific-patterns.md). This research covers effective/ineffective patterns for all 4 tinyArms skills with 51 cited sources.

---

### Accuracy Drop (Week 7)

**Failures**:
- Screenshot-2024.png → "untitled-screen.png" (too generic)
- IMG_4521.jpg → "photo-landscape.jpg" (missed: "golden-gate-bridge")
- dashboard-final-v2.png → "ui-dashboard.png" (lost version number)

**Root cause analysis**:
- No structure guidance (too vague)
- No examples (model guesses format)
- No priority guidance (misses key details)

---

### SmolLM2 Generates Variants (Week 8)

**Variant A** (Structured Format):
```markdown
Analyze the image and rename using this structure:
[main-subject]-[context]-[type].extension

Examples:
- golden-gate-bridge-sunset-photo.jpg
- dashboard-mobile-wireframe-v3.png
- hero-section-desktop-mockup.png

Format: kebab-case, 3-5 words
```

**Variant B** (Color Context):
```markdown
Describe the image as a filename. Include:
1. Main subject/objects
2. Distinctive colors (if notable)
3. Purpose/context

Format: subject-color-context.extension
Max 5 words, kebab-case

Examples:
- blue-button-component-hover.png
- red-alert-modal-mobile.png
```

**Variant C** (Prioritized Metadata):
```markdown
Rename based on visual analysis.

Priority order:
1. Main subject/purpose (required)
2. Platform (mobile/desktop/tablet)
3. Version number (if visible in filename or image)
4. State (hover, active, error, etc.)

Format: subject-platform-version-state.extension
Use kebab-case, omit unavailable fields

Examples:
- login-form-mobile-v2.png
- error-modal-desktop-active.png
- product-card-tablet.png
```

---

### A/B Testing Results (Week 8-9)

```
File: Screenshot-2024-10-28.png (landing page hero section on iPhone)

Variant A output: "hero-section-mobile-landing.png"
Variant B output: "blue-hero-mobile-header.png"
Variant C output: "hero-mobile-landing-v1.png"

User choice: Variant A (clear, no redundant "v1")

---

File: dashboard_FINAL_v3.png

Variant A output: "dashboard-admin-interface-v3.png"
Variant B output: "gray-dashboard-layout.png"
Variant C output: "dashboard-desktop-v3.png"

User choice: Variant C (captured version number!)

---

After 30 votes:
Variant A: 10 votes (33%)
Variant B: 5 votes (17%)
Variant C: 15 votes (50%) ← WINNER

Variant C accuracy: 91% (up from 78%)
```

---

### Promotion (Week 10)

```yaml
# config.yaml - Auto-updated
skills:
  file-naming:
    prompt_template: skills/file-naming-v2.md  # ← New version
    prompt_version: 2
    evolved_at: "2024-11-10T08:00:00Z"
    evolution_history:
      - version: 1
        active_period: "2024-09-15 to 2024-11-10"
        accuracy: 0.78
        reason: "Accuracy drop"
      - version: 2
        active_since: "2024-11-10"
        accuracy: 0.91
        source: "SmolLM2 evolution (variant C)"
```

**New prompt file created**:
```bash
skills/file-naming-v2.md  # Variant C promoted
```

**Monitoring continues**: If v2 accuracy drops, trigger evolution again

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

## Storage Schema

```sql
-- SQLite tables

CREATE TABLE prompt_evolution_sessions (
  id TEXT PRIMARY KEY,
  skill TEXT NOT NULL,
  original_prompt_hash TEXT NOT NULL,
  triggered_at TIMESTAMP NOT NULL,
  trigger_reason TEXT,  -- "accuracy_drop", "manual", "scheduled"
  status TEXT DEFAULT 'active',  -- active, completed, cancelled
  completed_at TIMESTAMP
);

CREATE TABLE prompt_variants (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES prompt_evolution_sessions(id),
  variant_letter TEXT,  -- A, B, C
  prompt_template TEXT NOT NULL,
  reasoning TEXT,  -- Why SmolLM2 generated this variant
  votes INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0.0
);

CREATE TABLE ab_test_results (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES prompt_evolution_sessions(id),
  variant_id TEXT REFERENCES prompt_variants(id),
  task_id TEXT NOT NULL,
  user_choice BOOLEAN,  -- TRUE if user picked this variant
  task_success BOOLEAN,  -- TRUE if task completed successfully
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prompt_history (
  id TEXT PRIMARY KEY,
  skill TEXT NOT NULL,
  version INTEGER NOT NULL,
  prompt_template_path TEXT NOT NULL,
  active_from TIMESTAMP NOT NULL,
  active_to TIMESTAMP,
  accuracy_start REAL,
  accuracy_end REAL,
  evolution_source TEXT,  -- "SmolLM2", "manual", "initial"
  notes TEXT
);
```

---

## Cost Analysis

**Per evolution cycle**:
- SmolLM2 inference: ~5-8s (one-time)
- A/B testing: 30 user choices (spread over 7 days)
- Storage: ~5KB per evolution session

**ROI**:
- Accuracy improvement: 5-15%
- User time saved: 2-3 hours/week (fewer manual prompt tweaks)
- Model swap avoidance: If prompt evolution fixes accuracy, no need to upgrade to larger model

**Break-even**: 1 evolution cycle = worth it if saves >1 hour of manual prompt engineering

---

## Testing Plan

### Phase 1: Manual Testing

1. Create 3 manual variants for file-naming
2. Run A/B test with 30 real files
3. Measure:
   - User choice distribution
   - Accuracy improvement
   - User satisfaction (survey)

**Success criteria**: Winner accuracy >85% (up from 78%)

---

### Phase 2: SmolLM2 Testing

1. Use SmolLM2 to generate variants (same failure examples)
2. Compare SmolLM2 variants vs manual variants
3. Measure:
   - Variant quality (do they make sense?)
   - User choice distribution
   - Accuracy improvement

**Success criteria**: SmolLM2 variants perform ≥ manual variants

---

### Phase 3: Production Testing

1. Deploy to 1 skill (file-naming)
2. Monitor for 1 month
3. Measure:
   - Number of evolution cycles triggered
   - Average accuracy improvement
   - User annoyance (A/B dialog frequency)

**Success criteria**: 2-3 evolution cycles, accuracy stable >85%, <10% users complain

---

## Risks & Mitigations

### Risk 1: Evolution Fatigue

**Problem**: Users annoyed by frequent A/B choice dialogs

**Mitigation**:
- Cooldown: Max 1 evolution per skill per week
- Sampling: Only 50% of tasks show A/B choice
- Skip button: Always allow using current prompt

---

### Risk 2: SmolLM2 Generates Bad Variants

**Problem**: Variants are nonsensical or redundant

**Mitigation**:
- Manual review: Flag for human review if accuracy <70%
- Rollback: Auto-rollback to previous prompt if new prompt performs worse
- Diversity check: Reject variants too similar to original

---

### Risk 3: Overfitting to User

**Problem**: Prompts optimize for one user's preferences, not general use

**Mitigation**:
- Multi-user data: Aggregate votes from multiple users
- Canonical examples: Include gold-standard examples in evaluation
- Periodic reset: Option to reset to default prompt if user wants

---

## References

- **SmolLM2 model card**: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
- **SmolLM2 announcement**: https://huggingface.co/blog/smollm2
- **Ollama SmolLM2 models**: https://ollama.com/library/smollm2
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
