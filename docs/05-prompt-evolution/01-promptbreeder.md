# PromptBreeder: Genetic Prompt Evolution

**Part of**: [Prompt Evolution System](../05-prompt-evolution-system.md)
**Status**: Research phase (0% implemented)
**Date**: 2025-10-27

---

## Overview

**Framework**: PromptBreeder (Google DeepMind, ICML 2024)
**Why chosen**: Self-referential genetic algorithm, works with 360M models, 83.9% accuracy (outperformed OPRO 82.3%, DSPy MIPRO 83.2%)
**Source**: https://arxiv.org/abs/2309.16797
**Research**: See `docs/research/vector-1-prompt-optimization-frameworks.md` for full comparison

---

## Algorithm: Binary Tournament Genetic Algorithm

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

---

## Five Mutation Operators

### 1. Direct Mutation (30% probability)

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

### 2. First-Order Generation (30% probability)

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

### 3. Prompt Crossover (20% probability)

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

### 4. Zero-Order Generation (15% probability)

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

### 5. Hypermutation (5% probability, Phase 2)

```
Template:
  "Current mutation strategy: {mutation_prompt}

   Improve this mutation strategy to generate better prompt variants.

   Improved strategy:"

Example:
  Input mutation: "Make the prompt clearer"
  Output mutation: "Improve the prompt by adding examples and structure"
```

---

## Self-Referential Advantage

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

---

## Example Evolution: File Naming Skill

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

---

## Why Not Other Frameworks?

| Framework | Accuracy | Why NOT Chosen |
|-----------|----------|----------------|
| **PromptBreeder** | **83.9%** | ✅ **CHOSEN** |
| DSPy MIPRO | 83.2% (-0.7%) | Requires 7B+ model for instruction generation, high complexity |
| OPRO | 82.3% (-1.6%) | Requires 7B+ model as optimizer, SmolLM2-360M can't analyze prompt patterns |
| EvoPrompt DE | 80.1% (-3.8%) | No self-referential improvement, fixed mutation strategy |
| EvoPrompt GA | 79.2% (-4.7%) | Mutates entire prompts (less efficient than differential) |

**Source**: GSM8K benchmark (arithmetic reasoning)

---

## Configuration

```yaml
# config/constants.yaml
prompt_evolution:
  promptbreeder:
    population_size: 20          # Memory-optimized (vs 50 in paper)
    generations: 30              # Compute-optimized (vs 50-100)
    evaluation_samples: 10       # Per generation
    final_evaluation_samples: 100 # Top 3 candidates

    mutation_weights:
      direct: 0.30              # Most common (proven effective)
      first_order: 0.30         # Refinement (conservative)
      crossover: 0.20           # Combines strengths
      zero_order: 0.15          # Exploration (risky)
      hypermutation: 0.05       # Meta-learning (Phase 2)
```

---

## References

- **Paper**: Fernando et al. (2024) "PromptBreeder: Self-Referential Self-Improvement Via Prompt Evolution" [https://arxiv.org/abs/2309.16797]
- **GSM8K Benchmark**: 8,000 grade school math problems (accuracy benchmark)
- **Comparison**: See `docs/research/vector-1-prompt-optimization-frameworks.md`

---

**Next**: [Thompson Sampling A/B Test](02-thompson-sampling.md)
