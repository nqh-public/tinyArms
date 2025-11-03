> **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algorithms unchanged. Reference: docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md


# Confidence Scoring Patterns

**Status**: Researched (2025-10-29)
**Phase**: 02 (Confidence Scoring Implementation)
**Implementation**: Week 3
**Expected Impact**: 20-30% reduction in Level 3 escalations

---

## Problem Statement

**Current**: tinyArms has no mechanism to detect when Level 2 (Qwen2.5-Coder-3B) produces a good-enough answer vs when it needs escalation to Level 3 (7B model).

**Result**: Either (1) always escalate (expensive, defeats purpose of tiers), or (2) never escalate (inaccurate, defeats purpose of large model).

**Solution**: Implement confidence scoring at Level 2 to make intelligent escalation decisions.

---

## Confidence Scoring Methods

### Method 1: Answer Consistency Scoring (Recommended)

**Principle**: LLMs produce **consistent answers when confident**, inconsistent answers when uncertain.

**Algorithm**:
1. Generate N=3 responses with temperature=0.7 (enable sampling)
2. Encode all 3 responses into embeddings
3. Compute pairwise cosine similarity
4. Calculate mean similarity across all pairs
5. Threshold: >0.85 = confident, <0.85 = escalate

**Example**:

```python
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load once at startup
consistency_model = SentenceTransformer('all-MiniLM-L6-v2')  # 22M params, fast

def level_2_with_consistency(query):
    # Generate N=3 responses
    responses = []
    for _ in range(3):
        response = qwen_3b.generate(query, temperature=0.7)
        responses.append(response)

    # Embed responses
    embeddings = consistency_model.encode(responses)

    # Pairwise similarity
    similarities = []
    for i in range(len(responses)):
        for j in range(i+1, len(responses)):
            sim = cosine_similarity(
                embeddings[i].reshape(1, -1),
                embeddings[j].reshape(1, -1)
            )[0][0]
            similarities.append(sim)

    mean_similarity = sum(similarities) / len(similarities)

    # Decision
    if mean_similarity > 0.85:
        # High consistency → confident
        return responses[0], mean_similarity, "accepted"
    else:
        # Low consistency → escalate
        return None, mean_similarity, "escalate_to_l3"
```

**Trade-offs**:
- Latency: +500-700ms (3 generations + embedding)
- Accuracy: High (validated by AutoMix NeurIPS 2024)
- Memory: +100MB (consistency embedding model)

**When to use**: Default method for Level 2 routing

**Reference**: research/02-orchestration-patterns.md:18-24

---

### Method 2: Logit-Based Scoring (Fast Alternative)

**Principle**: Model's **internal confidence** (softmax probabilities) correlates with answer quality.

**Algorithm**:
1. Extract logits from generation
2. Compute log-softmax over vocabulary
3. Take mean/quantile/min of log probabilities
4. Threshold: e.g., mean logit >-2.0 = confident

**Example**:

```python
import torch

def confidence_from_logits(logits):
    # Mean logit approach
    log_probs = torch.nn.functional.log_softmax(logits, dim=-1)
    max_log_probs = log_probs.max(dim=-1).values  # Per-token confidence
    confidence = max_log_probs.mean().item()      # Average across tokens
    return confidence

# Usage
def level_2_with_logit_scoring(query):
    response, logits = qwen_3b.generate(query, return_logits=True)
    confidence = confidence_from_logits(logits)

    if confidence > -2.0:  # Tunable threshold
        return response, confidence, "accepted"
    else:
        return None, confidence, "escalate_to_l3"
```

**Trade-offs**:
- Latency: +0ms (no extra generation)
- Accuracy: Medium (raw logits poorly calibrated)
- Memory: +0MB (no extra models)

**When to use**: Latency-critical applications where 500ms is unacceptable

**Reference**: research/02-orchestration-patterns.md:10-16

---

### Method 3: Semantic Agreement (Open-Ended Tasks)

**Principle**: For subjective tasks (creative writing, brainstorming), use **semantic similarity** instead of exact token matching.

**Algorithm**:
1. Generate N=3-5 responses
2. Encode with sentence embeddings
3. Compute mean pairwise cosine similarity
4. Threshold: >0.90 = high agreement

**Difference from Method 1**: Higher threshold (0.90 vs 0.85) for open-ended tasks where paraphrasing is acceptable.

**When to use**: Non-coding tasks (if tinyArms expands to general assistant)

**Reference**: research/02-orchestration-patterns.md:26-29

---

### Method 4: Calibrated Confidence (Advanced, Phase 05)

**Principle**: Train a separate model to **predict whether Level 2 is correct**.

**Algorithm**:
1. Collect dataset: (query, L2 response, L3 response, human preference)
2. Train classifier: Input = query + L2 logits → Output = P(L2 correct)
3. Use **Gatekeeper loss function** for calibration
4. Deploy as routing decision

**Trade-offs**:
- Latency: +50ms (classifier inference)
- Accuracy: Highest (4-5% improvement over raw logits)
- Training: Requires 1000+ labeled samples

**When to use**: Phase 05 (after baseline confidence scoring is working)

**Reference**: research/02-orchestration-patterns.md:31-36, arXiv:2502.19335

---

## Recommended Thresholds (Starting Point)

### Level 1 → Level 2 Escalation
- **Metric**: Embedding similarity
- **Threshold**: <0.90
- **Interpretation**: If top semantic match has similarity <0.90, cached response is too dissimilar → invoke LLM

### Level 2 → Level 3 Escalation
- **Metric**: Answer consistency OR logit confidence
- **Threshold**: <0.85 (consistency) OR <-2.0 (logit)
- **Interpretation**: If Level 2 generates inconsistent answers, uncertainty is high → escalate

### Level 3 → Human Escalation
- **Metric**: Logit confidence (Level 3 also has uncertainty)
- **Threshold**: <0.50 (very low confidence)
- **Interpretation**: Even large model is uncertain → flag for human review

**Important**: These are **starting values**. Tune based on production data (Week 4-5).

**Reference**: research/02-orchestration-patterns.md:469-498, research/02-threshold-calibration-guide.md

---

## Per-Domain Threshold Tuning (Advanced)

### High-Stakes Domains (Security, Finance, Legal)
- **Level 1 → Level 2**: <0.95 (stricter)
- **Level 2 → Level 3**: <0.80 (stricter)
- **Reasoning**: Low tolerance for errors

### Casual Domains (General Coding, FAQs)
- **Level 1 → Level 2**: <0.85 (more lenient)
- **Level 2 → Level 3**: <0.60 (avoid expensive L3)
- **Reasoning**: Cost optimization priority

**Implementation**: Maintain threshold registry mapping `(domain, tier) → threshold_value`

**Reference**: research/02-orchestration-patterns.md:488-498

---

## Implementation Roadmap

### Week 3: Answer Consistency Scoring
```python
# Phase 02, Week 3 implementation

def route_with_confidence(query):
    # Level 0: Rules (unchanged)
    if exact_match(query):
        return cached_response

    # Level 1: Embedding (unchanged)
    embedding = embed(query)
    similarity = semantic_search(embedding)
    if similarity > 0.90:
        return matched_response

    # Level 2: WITH CONFIDENCE SCORING
    responses = []
    for i in range(3):
        responses.append(qwen_3b.generate(query, temperature=0.7))

    # Measure consistency
    embeddings = consistency_model.encode(responses)
    similarities = compute_pairwise_cosine(embeddings)
    mean_similarity = sum(similarities) / len(similarities)

    # Trace for debugging
    log_trace({
        "tier": "level_2",
        "consistency": mean_similarity,
        "decision": "accept" if mean_similarity > 0.85 else "escalate"
    })

    if mean_similarity > 0.85:
        return responses[0]  # Use first response (all 3 are similar)

    # Level 3: Escalate if uncertain
    response = qwen_7b.generate(query)
    return response
```

### Week 4-5: Threshold Calibration
1. Collect production data with confidence scores
2. Plot: Confidence vs Actual Accuracy
3. Identify optimal threshold (maximize accuracy, minimize L3 usage)
4. Update threshold registry

### Week 6-8 (Optional): Calibrated Confidence
1. Collect (query, L2 response, L3 response, human rating)
2. Train deferral classifier
3. Deploy if ECE (Expected Calibration Error) <0.10

---

## Expected Impact

### Without Confidence Scoring (Baseline)
- Assumption: Always escalate to L3 when L2 confidence unknown
- L3 usage: 30-50% of queries
- Cost: High (7B model inference)

### With Answer Consistency Scoring (Phase 02)
- Intelligent escalation based on measured uncertainty
- L3 usage: 10-20% of queries (**20-30% reduction**)
- Cost savings: 50-70% reduction in L3 calls

### With Calibrated Confidence (Phase 05)
- Further refinement of escalation decisions
- L3 usage: 8-15% of queries (**additional 5-10% reduction**)
- Diminishing returns (marginal improvement)

**Reference**: research/02-orchestration-patterns.md:412-428 (AutoMix: 50%+ cost reduction via self-verification)

---

## Validation Metrics

### Expected Calibration Error (ECE)
- **Definition**: Difference between predicted confidence and actual accuracy
- **Formula**: Average over bins of |confidence - accuracy|
- **Target**: ECE <0.10 (well-calibrated)
- **Interpretation**: If ECE high, confidence scores are misleading

### Escalation Rate
- **Definition**: % of queries that reach Level 3
- **Target**: 10-20% (most queries handled by L2)
- **Warning**: If <5%, may be under-escalating (accuracy suffers)

### Confidence Distribution
- **Visualization**: Histogram of consistency scores
- **Healthy pattern**: Bimodal (many high-confidence, some low-confidence)
- **Unhealthy pattern**: Uniform (model always uncertain)

**Reference**: research/02-orchestration-patterns.md:280-344

---

## Common Pitfalls

### 1. Over-Escalation
- **Symptom**: 80%+ queries reach Level 3
- **Cause**: Threshold too strict (e.g., consistency >0.95)
- **Fix**: Lower threshold to 0.80-0.85

### 2. Under-Escalation
- **Symptom**: Accuracy <70%, L3 usage <5%
- **Cause**: Threshold too lenient (e.g., consistency >0.60)
- **Fix**: Raise threshold to 0.85-0.90

### 3. Poorly Calibrated Logits
- **Symptom**: Raw logit confidence doesn't correlate with accuracy
- **Cause**: Model training didn't optimize for calibration
- **Fix**: Use answer consistency instead OR train deferral module (Phase 05)

---

## Production Examples

### AutoMix (NeurIPS 2024)
- **Method**: Self-verification (small LM checks own answer)
- **Performance**: 50%+ cost reduction
- **Pattern**: Generate → Verify → Escalate if low confidence

### FrugalGPT (Stanford 2023)
- **Method**: Generation scoring function
- **Thresholds**: GPT-J >0.96, J1-L >0.37 (empirically tuned)
- **Performance**: 98% cost reduction, 4% accuracy improvement

### RouteLLM (LMSYS 2024)
- **Method**: Pre-generation routing (predict difficulty before inference)
- **Performance**: 85% cost reduction @ 95% GPT-4 quality
- **Pattern**: Classifier decides strong vs weak model BEFORE generation

**Reference**: research/03-real-world-implementations.md

---

## Next Steps

1. **Week 3**: Implement answer consistency scoring at Level 2
2. **Week 4**: Deploy to production, collect confidence + accuracy data
3. **Week 5**: Tune thresholds based on data (plot confidence vs accuracy)
4. **Week 6+**: Optionally train calibrated deferral module (if ECE >0.10)

**Dependencies**:
- Phase 01 tracing (need to log confidence scores)
- sentence-transformers library (consistency model)
- Production workload (tune thresholds on real queries)

**Full implementation details**: See research/02-orchestration-patterns.md
