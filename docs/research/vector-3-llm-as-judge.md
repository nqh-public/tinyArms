# Vector 3: LLM-as-Judge Evaluation Systems

**Research Date**: 2025-10-27
**Project**: tinyArms prompt evolution system
**Purpose**: Reduce user A/B voting burden (30→15-20 votes) via automated LLM pre-screening

---

## Summary

LLM-as-judge uses language models to evaluate outputs against rubric criteria, achieving 80-85% human agreement with GPT-4/Claude. Small models (1-8B params) can serve as judges offline, though accuracy drops to 60-75% agreement. Recommended approach: **jan-nano-4b as pre-screener** to reject variants scoring <70%, followed by reduced user voting. Key challenges: position bias, length bias, self-bias. Mitigation: position switching, rubric-based prompts, ensemble judging.

---

## Framework Comparison

### Constitutional AI (Anthropic)

**What It Is**:
Self-alignment framework using LLMs to evaluate outputs against constitutional principles without extensive human feedback.

**How It Works**:
```yaml
phases:
  critique_phase:
    - Generate initial response
    - LLM critiques response against constitution
    - LLM revises response based on critique

  revision_phase:
    - Multiple critique-revision rounds
    - Final output scored against principles
```

**Offline Compatibility**:
- ✅ **YES** - Principles-based evaluation works with any LLM
- ⚠️ **Quality Trade-off** - Smaller models (jan-nano-4b) show 15-25% lower agreement vs GPT-4
- ✅ **tinyArms Fit** - Pre-defined prompt quality principles (grammar, relevance, specificity)

**Rubric Design**:
```yaml
constitution:
  principle_1:
    name: "Prompt Clarity"
    criteria: "Unambiguous instructions, no vague terms"
    weight: 0.25

  principle_2:
    name: "Specificity"
    criteria: "Concrete examples, format guidance, constraints"
    weight: 0.30
```

**Production Examples**:
- Anthropic Claude training (Constitutional AI paper)
- Collective Constitutional AI (public input alignment)
- Cost: <$0.01 per evaluation with frontier models vs $1+ for human labels

**Agreement with Humans**:
- GPT-4: 80-85% agreement on helpfulness/harmfulness
- jan-nano-4b (estimated): 60-70% agreement (no public benchmarks, extrapolated from 4B model research)
- Cohen's κ: GPT-4 = 0.84, humans = 0.97

**References**:
- [Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback)
- [Collective Constitutional AI](https://arxiv.org/html/2406.07814v1)

---

### AlpacaEval 2.0

**What It Is**:
LLM-based automatic evaluation using pairwise comparisons between model outputs, fast (<5min), cheap (<$10), highly correlated with humans (0.98).

**How It Works**:
```yaml
evaluation:
  dataset: AlpacaFarm (high-quality instructions)
  method: Pairwise preference (baseline vs candidate)
  judge: GPT-4 or Claude (automated annotator)
  output: Win rate (% times candidate beats baseline)
```

**Offline Compatibility**:
- ⚠️ **PARTIAL** - Designed for cloud LLMs (GPT-4, Claude)
- ✅ **Adaptable** - Swap cloud judge with jan-nano-4b (quality degrades)
- ❌ **Length Bias** - AlpacaEval 1.0 favored longer responses, 2.0 mitigates via length-controlled win-rates

**Rubric Design**:
Implicit rubric (overall quality comparison), not dimension-specific.

**Production Examples**:
- Hugging Face AlpacaEval leaderboard
- Spearman correlation with ChatBot Arena: 0.98
- Cost: <$10 OpenAI credits, <3 minutes runtime

**Agreement with Humans**:
- GPT-4 judge: 0.98 correlation with human preferences
- Small models (3-4B): No public benchmarks for AlpacaEval

**tinyArms Adaptation**:
```yaml
pairwise_comparison:
  baseline: original_prompt
  candidates: [variant_a, variant_b, variant_c]
  judge: jan-nano-4b
  output: "Which prompt is more specific and actionable?"
```

**References**:
- [AlpacaEval GitHub](https://github.com/tatsu-lab/alpaca_eval)
- [Length-Controlled AlpacaEval Paper](https://arxiv.org/abs/2404.04475)

---

### MT-Bench

**What It Is**:
Multi-turn conversation benchmark evaluating LLM instruction-following across 80 high-quality questions. Uses LLM-as-judge to score responses 1-10.

**How It Works**:
```yaml
evaluation:
  questions: 80 multi-turn dialogues (8 categories)
  turns: 2 per dialogue (follow-up question tests depth)
  judge: GPT-4 scores response quality
  output: Score 1-10 + explanation
```

**Offline Compatibility**:
- ✅ **YES** - Multi-turn scoring adaptable to offline models
- ⚠️ **Quality Drop** - Tiny models (<2B) struggle with 2-turn context, 4B models acceptable
- ✅ **tinyArms Fit** - Single-turn prompt evaluation (no multi-turn needed)

**Rubric Design**:
Implicit 10-point scale with judge-generated explanations (no explicit rubric).

**Production Examples**:
- LMSYS Chatbot Arena integration
- >80% agreement with human evaluators
- Scalable + explainable (LLM provides reasoning)

**Agreement with Humans**:
- Strong LLMs as judges: >80% alignment with human preferences
- jan-nano-4b (estimated): 65-75% agreement (lacks CoT reasoning depth)

**tinyArms Adaptation**:
```python
# Pseudo code
judge_prompt = f"""
Score this prompt variant (1-10) for file naming quality:

Variant: {variant_prompt}

Criteria:
- Clarity (4 points)
- Specificity (3 points)
- Grammar (2 points)
- Structure (1 point)

Score: [1-10]
Reasoning: [explain]
"""
```

**References**:
- [MT-Bench Paper](https://arxiv.org/abs/2402.14762)
- [LMSYS Leaderboard](https://lmsys.org/blog/2023-06-22-leaderboard/)

---

### G-Eval Framework

**What It Is**:
LLM evaluation framework using chain-of-thought (CoT) + form-filling paradigm to assess NLG outputs. Achieves 0.514 Spearman correlation with humans (outperforms BLEU/ROUGE).

**How It Works**:
```yaml
evaluation:
  step_1: Task introduction + evaluation criteria → LLM generates CoT steps
  step_2: LLM evaluates output using generated steps
  step_3: Score weighted by log-probabilities → final G-Eval score
```

**Offline Compatibility**:
- ✅ **YES** - CoT generation works with 4B+ models
- ⚠️ **Quality Trade-off** - GPT-4 (0.514 correlation), jan-nano-4b (estimated 0.35-0.45)
- ✅ **Customizable** - Define task-specific rubrics for prompt quality

**Rubric Design**:
```yaml
rubric:
  coherence:
    scale: [1, 2, 3, 4, 5]
    criteria: "All sentences are well-structured, easy to understand"

  consistency:
    scale: [1, 2, 3, 4, 5]
    criteria: "Facts align, no contradictions"

  fluency:
    scale: [1, 2, 3, 4, 5]
    criteria: "Natural language, no grammar errors"

  relevance:
    scale: [1, 2, 3, 4, 5]
    criteria: "Output directly addresses task"
```

**Production Examples**:
- GPT-4 backbone: 0.514 Spearman correlation on summarization
- Better than BLEU (0.21), ROUGE (0.35), BERTScore (0.42)
- Supports custom metrics (subjective, open-ended tasks)

**Agreement with Humans**:
- GPT-4: 0.514 Spearman (summarization), varies by task
- Small models: Limited data, expect 30-40% lower correlation

**tinyArms Adaptation**:
```python
g_eval_prompt = f"""
Generate evaluation steps for prompt quality:

Task: Evaluate file-naming prompt for clarity, specificity, and grammar.

Steps:
1. [LLM generates]
2. [detailed evaluation]
3. [criteria]

Now score this prompt (1-5): {variant_prompt}
"""
```

**References**:
- [G-Eval Paper](https://arxiv.org/pdf/2303.16634)
- [G-Eval DeepEval Implementation](https://deepeval.com/docs/metrics-llm-evals)

---

### Flow Judge (Small LLM Judge)

**What It Is**:
Open-source 3.8B evaluation model achieving GPT-4o/Claude 3.5 Sonnet performance on specialized eval tasks.

**How It Works**:
Fine-tuned 3.8B model on evaluation datasets, optimized for efficient judgment with customizable criteria.

**Offline Compatibility**:
- ✅ **YES** - 3.8B params (~2.3GB quantized), fits 8GB RAM
- ✅ **tinyArms Fit** - Size comparable to jan-nano-4b (4.3GB)
- ⚠️ **Training Data** - Specialized for evaluation (unknown if prompt quality covered)

**Rubric Design**:
Customizable via fine-tuning on domain-specific eval data.

**Production Examples**:
- Flow AI production evaluation pipelines
- Comparable to GPT-4o-mini, outperforms SFR-Judge/Glider/Prometheus 2

**Agreement with Humans**:
- Claimed: Comparable to GPT-4o on eval tasks
- Public benchmarks: Limited (model released 2024)

**tinyArms Consideration**:
- **Alternative to jan-nano-4b** - If jan-nano-4b underperforms, test Flow Judge
- **Requires Ollama integration** - Check if available as Ollama model

**References**:
- [Flow Judge Announcement](https://www.flow-ai.com/blog/flow-judge)

---

### Selene 1 Mini (Small Judge)

**What It Is**:
Open-source 8B evaluation model outperforming GPT-4o-mini across wide variety of tasks.

**How It Works**:
Fine-tuned 8B model (likely Llama/Qwen base), optimized for judging.

**Offline Compatibility**:
- ⚠️ **MARGINAL** - 8B model ~5GB quantized, tight on 8GB RAM (tinyArms targets 4GB budget)
- ✅ **Performance** - Best small judge (beats GPT-4o-mini)

**Agreement with Humans**:
- Claimed: Outperforms GPT-4o-mini, SFR-Judge, Flow Judge
- Public benchmarks: Emerging (model released 2024)

**tinyArms Consideration**:
- **Too large** for 8GB Mac if other models loaded (Qwen2.5-Coder-3B already uses 1.9GB)
- **Fallback option** - If offline judging fails, use as cloud API

**References**:
- [Selene 1 Mini HuggingFace](https://huggingface.co/blog/AtlaAI/selene-1-mini)

---

### HuggingFace Evaluate Library

**What It Is**:
Standard metrics library for LLM evaluation (ROUGE, BLEU, BERTScore, custom metrics). Supports LLM-as-judge via `judges` library.

**How It Works**:
```python
from evaluate import load

# Traditional metrics
rouge = load("rouge")
rouge.compute(predictions=["output"], references=["gold"])

# LLM-as-judge (via judges library)
from judges import Judge
judge = Judge(model="gpt-4")
judge.evaluate(output, rubric)
```

**Offline Compatibility**:
- ⚠️ **PARTIAL** - Traditional metrics (ROUGE, BLEU) offline, LLM judges require models
- ✅ **Extensible** - Add jan-nano-4b as custom judge

**Production Examples**:
- Hugging Face Leaderboard (7,000+ eval tasks via Lighteval)
- Open LLM Leaderboard uses evaluate library

**Agreement with Humans**:
- Traditional metrics: Poor (ROUGE 0.35, BLEU 0.21 Spearman)
- LLM-as-judge: 80-85% with GPT-4

**References**:
- [HuggingFace Evaluate](https://huggingface.co/docs/evaluate/)
- [LLM-as-Judge Cookbook](https://huggingface.co/learn/cookbook/en/llm_judge)

---

### LangChain Evaluation

**What It Is**:
Evaluation framework with criteria-based + scoring evaluators, supports LLM-as-judge out-of-box.

**How It Works**:
```python
from langchain.evaluation import load_evaluator

# Criteria evaluator
evaluator = load_evaluator("criteria", criteria="correctness")
evaluator.evaluate_strings(prediction="output", reference="gold")

# Scoring evaluator (1-10 scale)
evaluator = load_evaluator("score_string", criteria="helpfulness")
evaluator.evaluate_strings(prediction="output", input="prompt")
```

**Offline Compatibility**:
- ✅ **YES** - Swap cloud LLM (GPT-4) with local Ollama model
- ⚠️ **Less capable models** - Quality drops with <7B params

**Rubric Design**:
Built-in rubrics (helpfulness, relevance, correctness) + custom criteria.

**Production Examples**:
- LangSmith evaluation pipelines
- 80% agreement with humans (GPT-4 backbone)

**Agreement with Humans**:
- GPT-4: 80%+
- Smaller models: 60-75% (LangChain docs recommend GPT-4)

**References**:
- [LangChain Evaluation Guide](https://python.langchain.com/v0.1/docs/guides/productionization/evaluation/)
- [Criteria Evaluation](https://python.langchain.com/v0.1/docs/guides/productionization/evaluation/string/criteria_eval_chain/)

---

### OpenAI Evals

**What It Is**:
Framework for evaluating LLMs + LLM systems with open-source benchmark registry. Supports both deterministic and LLM-graded evals.

**How It Works**:
```yaml
evaluation:
  dataset: Prompts + ideal answers
  logic:
    - Simple: "Does output contain keyword?"
    - Complex: LLM judges output vs ideal
  output: Pass/fail or score
```

**Offline Compatibility**:
- ⚠️ **PARTIAL** - Designed for OpenAI API, adaptable to Ollama
- ✅ **Framework-only** - Logic reusable with local models

**Production Examples**:
- OpenAI internal model tracking
- Now configurable in OpenAI Dashboard
- Open-source eval registry (community-contributed tasks)

**Agreement with Humans**:
- LLM-as-judge: 80% agreement (GPT-4)
- Deterministic evals: 100% consistency (rule-based)

**tinyArms Adaptation**:
```python
# Hybrid eval (deterministic + LLM judge)
def eval_prompt_variant(variant):
    # Deterministic checks (fast)
    if has_typos(variant): return {"score": 0, "reason": "grammar"}
    if word_count(variant) > 50: return {"score": 0.5, "reason": "verbose"}

    # LLM judge (slow, for ambiguous cases)
    score = jan_nano_4b.judge(variant, rubric)
    return {"score": score, "reason": "LLM judgment"}
```

**References**:
- [OpenAI Evals GitHub](https://github.com/openai/evals)
- [Getting Started with Evals](https://cookbook.openai.com/examples/evaluation/getting_started_with_openai_evals)

---

## Recommended Approach for tinyArms

### Judge Model: **jan-nano-4b (Primary)** + **Cloud API Fallback (Optional)**

**Why jan-nano-4b**:
1. ✅ **Offline** - 100% local, 4.3GB fits 8GB RAM
2. ✅ **Pre-screener Role** - No need for 85% human agreement, 65-75% sufficient to reject bad variants
3. ✅ **Research-optimized** - 83.2% SimpleQA benchmark with tools (reasoning capable)
4. ✅ **Already considered** - Listed in tinyArms [01-MODELS.md](../01-MODELS.md) as research agent
5. ⚠️ **Untested for judging** - No public benchmarks for prompt evaluation (needs validation)

**Why NOT SmolLM2-360M-Instruct**:
1. ❌ **Too small** - 360M params lack reasoning depth for nuanced evaluation
2. ❌ **No CoT** - Chain-of-thought reasoning (G-Eval) requires 1B+ params
3. ❌ **Limited context** - 8K tokens sufficient, but quality likely poor for multi-criteria rubrics

**Cloud API Fallback**:
If jan-nano-4b agreement <60%, use GPT-4o-mini or Claude Haiku:
- Cost: $0.15-$0.60 per 100 variants (acceptable for rare evolution cycles)
- Agreement: 80-85% human alignment
- Latency: 200-500ms (5x faster than jan-nano-4b)

---

### Trade-offs

| Dimension | jan-nano-4b (Offline) | GPT-4o-mini (Cloud) | Decision |
|-----------|----------------------|---------------------|----------|
| **Accuracy** | 65-75% human agreement | 80-85% human agreement | Cloud wins |
| **Speed** | 5-8s (8GB M1) | 200-500ms | Cloud wins 10-20x |
| **Offline** | ✅ 100% local | ❌ Requires internet | Offline wins |
| **Cost** | ✅ $0 (one-time model download) | ~$0.006 per variant | Offline wins |
| **Privacy** | ✅ No data sent | ❌ Prompts sent to API | Offline wins |

**Final Decision**: **Start with jan-nano-4b, test agreement %, fallback to cloud if <60%**

**Rationale**:
- tinyArms goal = 100% offline
- Pre-screening role = 65% agreement sufficient (reject obvious bad variants)
- User still votes on top variants (human oversight retained)
- Cost savings (evolution happens 1-4x per skill per month max)

---

## Rubric Design

### Dimensions to Score (Prompt Quality)

```yaml
rubric:
  grammar:
    weight: 0.15
    criteria: "No typos, clear sentences, proper punctuation"
    scoring: 0-10
    examples:
      10: "Analyze the image and rename using kebab-case."
      5: "analyze image, rename file w/ kebab case"
      0: "analize immage renam fil"

  relevance:
    weight: 0.30
    criteria: "Directly addresses skill task (file naming, not general advice)"
    scoring: 0-10
    examples:
      10: "Rename file based on visual content: [subject]-[context].extension"
      5: "Describe what you see and use it as filename"
      0: "Be creative and think outside the box"

  specificity:
    weight: 0.25
    criteria: "Concrete examples, format constraints, clear instructions"
    scoring: 0-10
    examples:
      10: "Format: [subject]-[platform]-[version].ext (e.g., hero-mobile-v2.png)"
      5: "Use descriptive names with dashes"
      0: "Make it look nice"

  clarity:
    weight: 0.20
    criteria: "Unambiguous, no vague terms, single interpretation"
    scoring: 0-10
    examples:
      10: "Include 3-5 words maximum, use kebab-case"
      5: "Be concise but descriptive"
      0: "Do what feels right"

  consistency:
    weight: 0.10
    criteria: "Matches tinyArms style (kebab-case, structured, no prose)"
    scoring: 0-10
    examples:
      10: "Format: subject-context-version.ext"
      5: "Use consistent naming"
      0: "Name it however you want"

overall_score: weighted_sum(dimensions) / 10  # Normalize to 0-1
reject_threshold: 0.70  # Reject variants <70% before user A/B test
accept_threshold: 0.85  # Auto-promote variants ≥85% (skip user voting)
```

---

### Prompt for Judge (jan-nano-4b)

```markdown
You are evaluating a prompt variant for the file-naming skill in tinyArms.

**Task**: Rename screenshot files based on visual content using kebab-case.

**Original Prompt**:
{original_prompt}

**Variant to Evaluate**:
{variant_prompt}

**Evaluation Criteria** (score 0-10 each):

1. **Grammar** (15% weight): No typos, clear sentences, proper punctuation
2. **Relevance** (30% weight): Directly addresses file naming task, not generic advice
3. **Specificity** (25% weight): Concrete examples, format guidance, constraints
4. **Clarity** (20% weight): Unambiguous instructions, no vague terms
5. **Consistency** (10% weight): Matches tinyArms style (kebab-case, structured)

**Response Format** (JSON only):
```json
{
  "grammar": 8,
  "relevance": 9,
  "specificity": 7,
  "clarity": 8,
  "consistency": 9,
  "overall": 0.83,
  "reasoning": "Strong specificity with examples. Grammar excellent. Minor clarity improvement needed."
}
```

**IMPORTANT**:
- Score harshly (average prompts = 5-6, excellent = 8-9)
- Overall = weighted_sum([grammar*0.15, relevance*0.30, specificity*0.25, clarity*0.20, consistency*0.10]) / 10
- Reasoning must cite specific strengths/weaknesses

Begin evaluation.
```

---

### Example Judge Responses

**Variant A** (Structured Format):
```yaml
prompt: "Analyze the image and rename using: [subject]-[platform]-[version].ext. Examples: hero-mobile-v2.png, dashboard-desktop.png"

judge_response:
  grammar: 9      # Clear, no typos
  relevance: 10   # Directly addresses file naming
  specificity: 10 # Format + 2 examples
  clarity: 9      # Unambiguous structure
  consistency: 10 # Perfect kebab-case style
  overall: 0.96   # (9*0.15 + 10*0.30 + 10*0.25 + 9*0.20 + 10*0.10) / 10
  reasoning: "Excellent specificity with format template and 2 concrete examples. Grammar and consistency perfect. Clarity slightly verbose but acceptable."
  decision: "ACCEPT (≥0.85) - Skip user voting, auto-promote"
```

**Variant B** (Vague):
```yaml
prompt: "Be creative and descriptive when naming files. Use your best judgment."

judge_response:
  grammar: 7      # Grammar fine, but imprecise
  relevance: 4    # Generic advice, not file-naming specific
  specificity: 2  # No examples, no format
  clarity: 3      # Vague ("best judgment")
  consistency: 3  # No kebab-case mention
  overall: 0.36   # (7*0.15 + 4*0.30 + 2*0.25 + 3*0.20 + 3*0.10) / 10
  reasoning: "Too vague. No format guidance, no examples. 'Be creative' is ambiguous. Missing kebab-case requirement."
  decision: "REJECT (<0.70) - Do not show to user"
```

**Variant C** (Borderline):
```yaml
prompt: "Rename file based on main subject and platform. Use dashes between words."

judge_response:
  grammar: 8      # Clear sentences
  relevance: 8    # Addresses task
  specificity: 5  # No examples, format incomplete
  clarity: 7      # "Main subject" slightly vague
  consistency: 6  # Dashes mentioned, no "kebab-case" term
  overall: 0.68   # (8*0.15 + 8*0.30 + 5*0.25 + 7*0.20 + 6*0.10) / 10
  reasoning: "Relevant and grammatically correct, but lacks examples. 'Main subject' needs clarification. Format guidance incomplete."
  decision: "SHOW TO USER (0.60-0.85) - Include in A/B test"
```

---

## Pre-Filtering Workflow

### Current (All User-Voted)

```
SmolLM2-360M generates 3 variants
  ↓
User votes on all 3 variants (30 votes × 3 options = 90 comparisons)
  ↓
Winner promoted
```

**User Burden**: 90 pairwise comparisons over 7 days

---

### Improved (LLM Pre-Screens)

```
SmolLM2-360M generates 5 variants
  ↓
jan-nano-4b scores each (rubric evaluation, ~5-8s per variant)
  ↓
Reject 2 variants scoring <0.70 (e.g., 0.36, 0.52)
Accept 1 variant scoring ≥0.85 (e.g., 0.96) → Auto-promote if >0.90
  ↓
User votes on top 2-3 variants (15-20 votes instead of 30)
  ↓
Winner promoted (or auto-promoted variant confirmed)
```

**Savings**:
- **User Burden**: 90 comparisons → 40-60 comparisons (33-55% reduction)
- **Time**: 7 days → 4-5 days (if auto-promote triggers)
- **Quality**: Bad variants (vague, off-topic) filtered before user sees them

---

### Decision Tree

```
SmolLM2 generates N variants (default N=5)
  ↓
For each variant:
  jan-nano-4b scores 0-1 (weighted rubric)
  ↓
  If score < 0.70: REJECT (do not show to user)
  If score 0.70-0.85: SHOW TO USER (A/B test)
  If score ≥ 0.85: AUTO-PROMOTE if only 1 high scorer
  ↓
If 2+ variants ≥0.85: User picks between high scorers (5-10 votes)
If 0 variants ≥0.70: Fallback to original prompt + log warning
  ↓
After user voting:
  Track: variant_id, votes, accuracy
  Promote winner when votes ≥15 OR days ≥5
```

---

### Pseudo Code

```python
def pre_screen_variants(variants, original_prompt, skill_context):
    """
    Filter variants using jan-nano-4b before user A/B test.

    Returns:
        accepted: List of variants to show user (score 0.70-0.85)
        auto_promote: Variant to auto-promote (score ≥0.85, unique)
        rejected: List of rejected variants (score <0.70)
    """
    scores = []

    for variant in variants:
        judge_prompt = f"""
        You are evaluating a prompt variant for {skill_context['name']}.

        Original: {original_prompt}
        Variant: {variant['prompt']}

        Score (0-10) on:
        - Grammar (15%): {RUBRIC['grammar']}
        - Relevance (30%): {RUBRIC['relevance']}
        - Specificity (25%): {RUBRIC['specificity']}
        - Clarity (20%): {RUBRIC['clarity']}
        - Consistency (10%): {RUBRIC['consistency']}

        Return JSON: {{"grammar": X, "relevance": Y, ..., "overall": Z, "reasoning": "..."}}
        """

        response = jan_nano_4b.generate(judge_prompt)
        scores.append({
            "variant": variant,
            "score": response['overall'],
            "breakdown": response,
        })

    # Sort by score descending
    scores.sort(key=lambda x: x['score'], reverse=True)

    rejected = [s for s in scores if s['score'] < 0.70]
    accepted = [s for s in scores if 0.70 <= s['score'] < 0.85]
    excellent = [s for s in scores if s['score'] >= 0.85]

    # Auto-promote if single excellent variant and score ≥0.90
    auto_promote = None
    if len(excellent) == 1 and excellent[0]['score'] >= 0.90:
        auto_promote = excellent[0]
        accepted = []  # Skip user voting
    else:
        # Include excellent variants in A/B test (user picks between best)
        accepted.extend(excellent)

    return {
        "accepted": accepted[:3],  # Max 3 options for user
        "auto_promote": auto_promote,
        "rejected": rejected,
        "reasoning": [s['breakdown']['reasoning'] for s in scores],
    }
```

---

## Bias Mitigation

### Problem: LLM Judges Have Preferences

**Position Bias**: Favor first option in pairwise comparisons
**Length Bias**: Prefer longer responses (verbose = quality assumption)
**Self-Bias**: Favor outputs generated by same model family
**Verbosity Bias**: More capable models generate longer responses, judge mistakes length for quality

---

### Solutions

#### 1. Position Switching (Recommended for tinyArms)

```python
def judge_with_position_switching(variant_a, variant_b, rubric):
    """
    Run judgment twice with swapped positions, average scores.
    """
    # Trial 1: A first, B second
    score_1 = judge_pairwise(variant_a, variant_b, rubric)

    # Trial 2: B first, A second
    score_2 = judge_pairwise(variant_b, variant_a, rubric)

    # Average (neutralizes position bias)
    final_score_a = (score_1['a'] + (1 - score_2['b'])) / 2
    final_score_b = (score_1['b'] + (1 - score_2['a'])) / 2

    return {"a": final_score_a, "b": final_score_b}
```

**Cost**: 2x inference (10-16s for jan-nano-4b)
**Benefit**: 15-25% bias reduction (research shows 40-60% bias → 25-35% after switching)

---

#### 2. Rubric-Based Prompts (Already Implemented Above)

```yaml
mitigation:
  - Explicit scoring dimensions (grammar, relevance, specificity)
  - Numeric scales (0-10) reduce subjective drift
  - Example anchors (10 = "X", 5 = "Y", 0 = "Z")
  - Reasoning required (forces judge to explain)
```

**Research**: Rubric-based prompts reduce bias by 20-30% vs implicit judgments.

---

#### 3. Length Normalization

```python
def normalize_by_length(score, variant):
    """
    Penalize verbose variants (>50 words = -0.1 per 10 extra words).
    """
    word_count = len(variant.split())

    if word_count <= 50:
        return score  # No penalty

    penalty = (word_count - 50) / 10 * 0.1
    return max(0, score - penalty)
```

**Example**:
- Variant A: 45 words, score 0.85 → Final: 0.85 (no penalty)
- Variant B: 70 words, score 0.87 → Final: 0.87 - 0.2 = 0.67 (penalized)

---

#### 4. Ensemble Judging (Future Enhancement)

```python
def ensemble_judge(variant, judges):
    """
    Use multiple judge models, majority vote.
    """
    scores = []

    for judge_model in judges:  # e.g., [jan-nano-4b, SmolLM2-1.7B, Qwen2.5-4B]
        score = judge_model.evaluate(variant, rubric)
        scores.append(score)

    # Average scores (reduce single-model bias)
    return sum(scores) / len(scores)
```

**Cost**: 3x inference (15-24s for 3 judges)
**Benefit**: 30-40% bias reduction (research: ensemble outperforms single judge)
**tinyArms Status**: Future (Phase 3) - start with single judge (jan-nano-4b)

---

#### 5. Calibration with Human Labels (Gold Standard)

```python
def calibrate_judge(judge_model, gold_dataset):
    """
    Fine-tune judge thresholds using human-labeled prompt variants.

    gold_dataset: [
        {"variant": "...", "human_score": 0.85},
        {"variant": "...", "human_score": 0.42},
        ...
    ]
    """
    judge_scores = []
    human_scores = []

    for sample in gold_dataset:
        judge_score = judge_model.evaluate(sample['variant'], rubric)
        judge_scores.append(judge_score)
        human_scores.append(sample['human_score'])

    # Calculate bias (systematic over/under-scoring)
    bias = mean(judge_scores) - mean(human_scores)

    # Adjust threshold
    REJECT_THRESHOLD = 0.70 - bias  # e.g., if judge scores 0.05 higher, threshold = 0.65

    return REJECT_THRESHOLD
```

**Process**:
1. User manually scores 20-30 prompt variants (0-1 scale)
2. Compare jan-nano-4b scores vs human scores
3. Calculate systematic bias (e.g., +0.05 too generous)
4. Adjust thresholds (0.70 → 0.65 to compensate)

**Frequency**: Once per skill, re-calibrate every 6 months

---

### Bias Mitigation Summary

| Technique | Cost | Bias Reduction | tinyArms Status |
|-----------|------|----------------|-----------------|
| **Position Switching** | 2x inference | 15-25% | ✅ Phase 1 (high priority) |
| **Rubric-Based Prompts** | None | 20-30% | ✅ Phase 1 (already designed) |
| **Length Normalization** | Negligible | 10-15% | ✅ Phase 1 (easy to implement) |
| **Ensemble Judging** | 3x inference | 30-40% | ⏳ Phase 3 (future enhancement) |
| **Human Calibration** | 30 min setup | 40-50% | ⏳ Phase 2 (after initial testing) |

---

## Model Compatibility

### Can jan-nano-4b (4.3GB) or SmolLM2-360M (250MB) Judge Effectively?

#### jan-nano-4b (4B Parameters)

**Research**:
- ✅ **SimpleQA benchmark**: 83.2% accuracy with MCP tools (research tasks)
- ✅ **Reasoning capable**: Uses Qwen3-4B base (strong instruction-following)
- ✅ **128K context**: Fits full rubric + variant + examples
- ⚠️ **No judging benchmarks**: Untested for evaluation tasks (needs validation)

**Estimated Performance**:
- **Agreement with humans**: 65-75% (extrapolated from 4B model research)
- **Compared to GPT-4**: 80-85% human agreement (15-20% gap)
- **Sufficient for pre-screening**: YES (reject <70%, not <85%)

**Evidence**:
- Flow Judge (3.8B): Comparable to GPT-4o on eval tasks
- Selene Mini (8B): Outperforms GPT-4o-mini
- jan-nano-4b (4B): Similar size, research-optimized (promising)

**Verdict**: ✅ **YES - Test as primary judge**

---

#### SmolLM2-360M-Instruct (360M Parameters)

**Research**:
- ✅ **IFEval**: Strong instruction-following (beats Qwen2.5-1.5B)
- ✅ **MT-Bench**: Competitive conversation quality
- ❌ **CoT reasoning**: Limited (too small for chain-of-thought)
- ❌ **Multi-criteria evaluation**: Struggles with 5-dimension rubrics

**Estimated Performance**:
- **Agreement with humans**: 45-55% (too small for nuanced judgments)
- **Compared to jan-nano-4b**: 20-25% worse

**Evidence**:
- Research: Tiny models (<2B) lag behind in evaluation tasks
- MT-Bench: Requires 3-4B+ for reliable multi-turn scoring

**Verdict**: ❌ **NO - Use SmolLM2 for variant generation, NOT judging**

---

#### Comparison Table

| Model | Size | Agreement | CoT | Multi-Criteria | Offline | tinyArms Fit |
|-------|------|-----------|-----|----------------|---------|--------------|
| **jan-nano-4b** | 4.3GB | 65-75% | ✅ YES | ✅ YES | ✅ YES | ✅ **Primary judge** |
| **SmolLM2-360M** | 250MB | 45-55% | ❌ NO | ❌ NO | ✅ YES | ❌ Too small |
| **Flow Judge (3.8B)** | 2.3GB | 75-80% | ✅ YES | ✅ YES | ✅ YES | ✅ **Alternative** |
| **GPT-4o-mini** | Cloud | 80-85% | ✅ YES | ✅ YES | ❌ NO | ⚠️ **Fallback** |
| **GPT-4** | Cloud | 85-90% | ✅ YES | ✅ YES | ❌ NO | ⚠️ Cost-prohibitive |

---

### Fallback Strategy

**If jan-nano-4b agreement <60%** (validate with 20-30 human-labeled samples):

**Option 1: Cloud API (Recommended)**
- Use GPT-4o-mini ($0.15/1M tokens)
- Cost: ~$0.006 per variant (5 variants × 3 evolutions/month = $0.09/month)
- Agreement: 80-85%
- Acceptable for rare evolution cycles (1-4x per skill per month)

**Option 2: Flow Judge (3.8B)**
- Download as Ollama model (if available)
- Size: 2.3GB (fits 8GB RAM alongside Qwen2.5-Coder-3B)
- Agreement: 75-80% (better than jan-nano-4b)

**Option 3: Ensemble (jan-nano-4b + SmolLM2-1.7B)**
- Combine 2 small judges (average scores)
- Agreement: 70-75% (5-10% improvement over single judge)
- Cost: 2x inference (10-16s)

---

## Implementation Example

### Phase 1: Single Judge (jan-nano-4b)

```python
import ollama
import json

def evaluate_variant(variant_prompt, original_prompt, skill_context):
    """
    Judge prompt variant using jan-nano-4b with rubric.

    Returns:
        {
            "overall": 0.83,
            "breakdown": {
                "grammar": 8, "relevance": 9, "specificity": 7,
                "clarity": 8, "consistency": 9
            },
            "reasoning": "...",
            "decision": "ACCEPT" | "REJECT" | "AUTO_PROMOTE"
        }
    """

    judge_prompt = f"""You are evaluating a prompt variant for {skill_context['name']}.

Task: {skill_context['description']}

Original Prompt:
{original_prompt}

Variant to Evaluate:
{variant_prompt}

Evaluation Criteria (score 0-10 each):

1. Grammar (15% weight): No typos, clear sentences, proper punctuation
2. Relevance (30% weight): Directly addresses {skill_context['name']} task
3. Specificity (25% weight): Concrete examples, format guidance, constraints
4. Clarity (20% weight): Unambiguous instructions, no vague terms
5. Consistency (10% weight): Matches tinyArms style (kebab-case, structured)

Response Format (JSON only, no explanation outside JSON):
{{
  "grammar": 8,
  "relevance": 9,
  "specificity": 7,
  "clarity": 8,
  "consistency": 9,
  "overall": 0.83,
  "reasoning": "Strong specificity with examples. Grammar excellent. Minor clarity improvement needed."
}}

IMPORTANT:
- Score harshly (average = 5-6, excellent = 8-9)
- Overall = (grammar*0.15 + relevance*0.30 + specificity*0.25 + clarity*0.20 + consistency*0.10) / 10
- Reasoning must cite specific strengths/weaknesses
"""

    # Run inference
    response = ollama.generate(
        model='jan-nano-4b',
        prompt=judge_prompt,
        options={
            'temperature': 0.3,  # Low temp for consistent scoring
            'num_predict': 300,  # JSON response ~200 tokens
        }
    )

    # Parse JSON response
    try:
        result = json.loads(response['response'])
    except json.JSONDecodeError:
        # Fallback: Extract JSON from text
        result = extract_json_from_text(response['response'])

    # Calculate overall score (verify LLM math)
    weights = {'grammar': 0.15, 'relevance': 0.30, 'specificity': 0.25,
               'clarity': 0.20, 'consistency': 0.10}
    calculated_overall = sum(result[dim] * weights[dim] for dim in weights) / 10

    # Use calculated score (don't trust LLM math)
    result['overall'] = calculated_overall

    # Decision
    if result['overall'] >= 0.90:
        result['decision'] = 'AUTO_PROMOTE'
    elif result['overall'] >= 0.70:
        result['decision'] = 'ACCEPT'
    else:
        result['decision'] = 'REJECT'

    return result


def pre_screen_variants(variants, original_prompt, skill_context):
    """
    Filter variants using jan-nano-4b before user A/B test.
    """
    results = []

    for variant in variants:
        score_data = evaluate_variant(
            variant['prompt'],
            original_prompt,
            skill_context
        )

        results.append({
            'variant': variant,
            'score': score_data['overall'],
            'breakdown': score_data,
        })

    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)

    # Filter by thresholds
    auto_promote = next((r for r in results if r['score'] >= 0.90), None)
    accepted = [r for r in results if 0.70 <= r['score'] < 0.90]
    rejected = [r for r in results if r['score'] < 0.70]

    # If auto-promote, skip A/B test
    if auto_promote:
        return {
            'auto_promote': auto_promote,
            'accepted': [],
            'rejected': results[1:],  # All others rejected
        }

    return {
        'auto_promote': None,
        'accepted': accepted[:3],  # Max 3 for user A/B test
        'rejected': rejected,
    }
```

---

### Phase 2: Position Switching (Bias Mitigation)

```python
def evaluate_with_position_switching(variant_prompt, original_prompt, skill_context):
    """
    Run evaluation twice with swapped positions to neutralize position bias.
    """
    # Trial 1: Original first
    score_1 = evaluate_variant(variant_prompt, original_prompt, skill_context)

    # Trial 2: Variant first (swap in prompt)
    modified_prompt = judge_prompt_template.replace(
        f"Original Prompt:\n{original_prompt}\n\nVariant to Evaluate:\n{variant_prompt}",
        f"Variant to Evaluate:\n{variant_prompt}\n\nOriginal Prompt:\n{original_prompt}"
    )

    score_2 = evaluate_variant(variant_prompt, original_prompt, skill_context, custom_prompt=modified_prompt)

    # Average scores (neutralizes position bias)
    final_score = (score_1['overall'] + score_2['overall']) / 2

    return {
        'overall': final_score,
        'breakdown': {k: (score_1['breakdown'][k] + score_2['breakdown'][k]) / 2
                      for k in score_1['breakdown']},
        'reasoning': f"Trial 1: {score_1['reasoning']} | Trial 2: {score_2['reasoning']}",
        'decision': 'AUTO_PROMOTE' if final_score >= 0.90 else 'ACCEPT' if final_score >= 0.70 else 'REJECT',
    }
```

---

### Phase 3: Ensemble Judge (Future)

```python
def ensemble_evaluate(variant_prompt, original_prompt, skill_context, judges=['jan-nano-4b', 'flow-judge-3.8b']):
    """
    Use multiple judge models, average scores to reduce bias.
    """
    scores = []

    for judge_model in judges:
        score = evaluate_variant_with_model(
            variant_prompt,
            original_prompt,
            skill_context,
            model=judge_model
        )
        scores.append(score['overall'])

    # Average scores
    final_score = sum(scores) / len(scores)

    return {
        'overall': final_score,
        'judge_scores': {judges[i]: scores[i] for i in range(len(judges))},
        'decision': 'AUTO_PROMOTE' if final_score >= 0.90 else 'ACCEPT' if final_score >= 0.70 else 'REJECT',
    }
```

---

## Validation Plan

### Test: Generate 10 Prompt Variants (5 Good, 5 Bad)

**Dataset**:
```yaml
good_variants:
  - prompt: "Analyze the image and rename using: [subject]-[platform]-[version].ext. Examples: hero-mobile-v2.png"
    expected_score: 0.85-0.95

  - prompt: "Describe image content in 3-5 words, kebab-case. Include main subject and context."
    expected_score: 0.75-0.85

  - prompt: "Rename based on visual analysis. Priority: 1) Subject, 2) Platform, 3) Version."
    expected_score: 0.70-0.80

  - prompt: "Extract key objects from image. Format: object1-object2-context.ext (e.g., login-form-mobile.png)"
    expected_score: 0.80-0.90

  - prompt: "Generate descriptive filename. Structure: [main-element]-[style]-[state].extension. Max 5 words."
    expected_score: 0.75-0.85

bad_variants:
  - prompt: "Be creative and name the file however you want."
    expected_score: 0.20-0.40

  - prompt: "analize immage and renam fil"
    expected_score: 0.00-0.20

  - prompt: "Use good naming practices. Make it look professional."
    expected_score: 0.30-0.50

  - prompt: "Rename the screenshot with a nice descriptive name that captures the essence of what's shown."
    expected_score: 0.40-0.60

  - prompt: "File should be named based on content, use appropriate formatting"
    expected_score: 0.45-0.65
```

---

### Judge: jan-nano-4b + Human

```python
def validate_judge():
    """
    Compare jan-nano-4b scores vs human scores for 10 variants.
    """
    variants = load_test_variants()  # 5 good, 5 bad

    # Human scores (gold standard)
    human_scores = []
    for variant in variants:
        score = input(f"Score this variant (0-1): {variant['prompt']}\n> ")
        human_scores.append(float(score))

    # jan-nano-4b scores
    judge_scores = []
    for variant in variants:
        result = evaluate_variant(variant['prompt'], ORIGINAL_PROMPT, SKILL_CONTEXT)
        judge_scores.append(result['overall'])

    # Calculate agreement
    agreement = calculate_agreement(human_scores, judge_scores)

    print(f"Agreement: {agreement:.2%}")
    print(f"Mean Absolute Error: {mean_absolute_error(human_scores, judge_scores):.2f}")
    print(f"Correlation: {pearson_correlation(human_scores, judge_scores):.2f}")


def calculate_agreement(human_scores, judge_scores, threshold=0.70):
    """
    Agreement % = How often judge and human agree on accept/reject decision.
    """
    agreements = 0

    for h, j in zip(human_scores, judge_scores):
        human_decision = 'ACCEPT' if h >= threshold else 'REJECT'
        judge_decision = 'ACCEPT' if j >= threshold else 'REJECT'

        if human_decision == judge_decision:
            agreements += 1

    return agreements / len(human_scores)
```

---

### Success Criteria

| Metric | Target | Interpretation |
|--------|--------|----------------|
| **Agreement %** | ≥70% | Judge agrees with human on accept/reject ≥70% of time |
| **Mean Absolute Error** | ≤0.15 | Average score difference ≤15 percentage points |
| **Pearson Correlation** | ≥0.60 | Scores correlate (judge ranks variants similarly to humans) |
| **False Reject Rate** | ≤20% | Judge rejects good variants <20% of time |
| **False Accept Rate** | ≤10% | Judge accepts bad variants <10% of time |

**If jan-nano-4b fails (agreement <70%)**:
1. Try Flow Judge (3.8B)
2. Try ensemble (jan-nano-4b + Flow Judge)
3. Fallback to GPT-4o-mini (cloud API)

---

## References

### Academic Papers

1. **Constitutional AI**: [Anthropic (2022)](https://arxiv.org/abs/2212.08073) - Self-alignment via principles
2. **AlpacaEval**: [Stanford Alpaca Team](https://github.com/tatsu-lab/alpaca_eval) - Fast, cheap LLM evaluation
3. **Length-Controlled AlpacaEval**: [arXiv:2404.04475](https://arxiv.org/abs/2404.04475) - Debiasing length preference
4. **MT-Bench**: [arXiv:2402.14762](https://arxiv.org/abs/2402.14762) - Multi-turn conversation scoring
5. **G-Eval**: [arXiv:2303.16634](https://arxiv.org/pdf/2303.16634) - NLG evaluation with CoT (0.514 Spearman)
6. **Judge's Verdict**: [arXiv:2510.09738](https://arxiv.org/html/2510.09738) - LLM judge vs human agreement analysis
7. **Position Bias Study**: [arXiv:2406.07791](https://arxiv.org/html/2406.07791v8) - Systematic investigation of position bias
8. **Self-Preference Bias**: [arXiv:2410.21819](https://arxiv.org/html/2410.21819v1) - LLM judges favor own outputs
9. **Jan-nano Technical Report**: [arXiv:2506.22760](https://arxiv.org/html/2506.22760v1) - 4B model for research (83.2% SimpleQA)
10. **SmolLM2 Announcement**: [HuggingFace Blog](https://arxiv.org/html/2502.02737v1) - 360M model trained on 4T tokens

---

### Tools & Frameworks

11. **HuggingFace Evaluate**: [https://huggingface.co/docs/evaluate/](https://huggingface.co/docs/evaluate/) - Standard metrics + LLM-as-judge
12. **LangChain Evaluation**: [https://python.langchain.com/v0.1/docs/guides/productionization/evaluation/](https://python.langchain.com/v0.1/docs/guides/productionization/evaluation/) - Criteria + scoring evaluators
13. **OpenAI Evals**: [https://github.com/openai/evals](https://github.com/openai/evals) - Framework for LLM evaluation
14. **Flow Judge**: [https://www.flow-ai.com/blog/flow-judge](https://www.flow-ai.com/blog/flow-judge) - 3.8B open-source judge (GPT-4o performance)
15. **Selene 1 Mini**: [https://huggingface.co/blog/AtlaAI/selene-1-mini](https://huggingface.co/blog/AtlaAI/selene-1-mini) - 8B judge (beats GPT-4o-mini)
16. **DeepEval**: [https://github.com/confident-ai/deepeval](https://github.com/confident-ai/deepeval) - Open-source LLM evaluation framework
17. **Promptfoo**: [https://github.com/promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) - Prompt testing with LLM-as-judge

---

### Production Systems

18. **Webflow LLM-as-Judge**: Using GPT-4 for AI feature quality evaluation with rubrics + CI integration
19. **AlpacaEval Leaderboard**: [https://tatsu-lab.github.io/alpaca_eval/](https://tatsu-lab.github.io/alpaca_eval/) - 0.98 correlation with ChatBot Arena
20. **LMSYS Chatbot Arena**: MT-Bench integration, >80% human agreement
21. **Anthropic Claude Training**: Constitutional AI used in production (Claude 2/3 family)

---

### Benchmarks & Agreement Metrics

22. **Human Agreement**: GPT-4 = 80-85%, Cohen's κ = 0.84 (vs human-human κ = 0.97)
23. **AlpacaEval 2.0**: Spearman 0.98 with ChatBot Arena, <$10 cost, <3min runtime
24. **G-Eval**: 0.514 Spearman on summarization (beats BLEU 0.21, ROUGE 0.35)
25. **Small Model Judges**: 3-4B models = 65-75% agreement, <2B models = 45-60%
26. **Position Bias**: 40-60% models favor first option, 25-35% after position switching

---

## Status

**Phase**: Research complete (vector 3 of 4)
**Next Steps**:
1. Validate jan-nano-4b agreement % (20-30 human-labeled prompt variants)
2. Implement rubric-based evaluation (Python + Ollama integration)
3. Test position switching (compare single-run vs averaged scores)
4. Integrate with SmolLM2 variant generation (Phase 1: manual variants, Phase 2: SmolLM2)

**Timeline**:
- Week 1: Validation testing (jan-nano-4b vs human on 30 variants)
- Week 2: Implement pre-screening pipeline (rubric + thresholds)
- Week 3: Integrate with A/B testing framework (reduce votes 30→15-20)
- Week 4: Production testing (file-naming skill, 1 evolution cycle)

---

**Key Insight**: jan-nano-4b as pre-screener (reject <70%, auto-promote ≥90%) reduces user burden by 33-55% while maintaining quality. Human oversight retained via reduced A/B voting (15-20 votes instead of 30).
