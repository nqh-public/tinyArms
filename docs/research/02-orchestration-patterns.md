> **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algorithms unchanged. Reference: docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md


# Orchestration Patterns for Tiered AI Systems

**Research Date**: 2025-10-29
**Sources**: Academic papers (arXiv), industry blogs, production system documentation

---

## Routing Decision Algorithms

### Confidence Scoring Methods

**Logit-Based Scoring** (Most Common):
- **Mean logit**: Average confidence across all generated tokens
- **Quantile logit**: p90/p95/p99 percentile of token confidences
- **Min logit**: Lowest confidence token in response (conservative)
- **Formula**: `confidence = mean(log_softmax(logits))`

**Answer Consistency Scoring**:
- Generate multiple responses (N=3-5) with temperature sampling
- Measure semantic similarity between responses
- **High consistency** (>0.85 similarity) → Use current tier
- **Low consistency** (<0.70 similarity) → Escalate to next tier
- **Method**: LLMs produce consistent answers when confident, inconsistent when uncertain
- **Implementation**: Leverage mixture of thought representations (Chain-of-Thought + Program-of-Thought)

**Semantic Agreement** (Open-Ended Tasks):
- Compare semantic meaning rather than exact token matches
- Use sentence embeddings (SBERT) for similarity scoring
- **Threshold**: Cosine similarity >0.90 = sufficient agreement

**Calibrated Confidence**:
- Raw model confidence often poorly calibrated
- **Gatekeeper method** (2025): Novel loss function for confidence calibration
- Trains deferral module to better estimate true accuracy
- Critical for high-stakes applications (healthcare, finance)

### Threshold Strategies

**Tiered Threshold Architecture** (Industry Standard):
- **High confidence (>0.85)**: Auto-approve, use current tier
- **Medium confidence (0.50-0.85)**: Escalate to next tier
- **Low confidence (<0.50)**: Escalate to highest tier or human review
- **Protected domains**: Apply stricter thresholds for regulated/sensitive content

**Continuous Optimization** (State-of-the-Art):
- **Markov-copula probabilistic model**: Models joint performance distribution of LLM sequence
- Enables rational tuning via continuous optimization (not grid search)
- **Performance**: 4.3% improvement in error-cost curve vs Bayesian optimization
- **Reference**: "Rational Tuning of LLM Cascades via Probabilistic Modeling" (2025)

**A/B Testing Framework**:
- Baseline: Static thresholds (0.70, 0.85, 0.95)
- Treatment: Dynamic thresholds adjusted by query type
- **Metrics**: Accuracy delta, cost reduction %, p95 latency
- **Iteration cycle**: 1-2 weeks per experiment
- **Winner criteria**: Statistical significance (p<0.05) + business metric improvement

**Per-Domain Tuning**:
- Different thresholds for different domains
- Example: Medical queries (strict, 0.95) vs chitchat (lenient, 0.60)
- Maintain threshold registry mapping domain → threshold values

### Decision Trees

```
Query arrives
    ↓
[Level 0: Rule-Based]
    ├─ Exact match found? → Return immediately (confidence=1.0)
    ├─ No match → Continue to Level 1
    ↓
[Level 1: Semantic Similarity]
    ├─ Embedding similarity >0.90 → Return (confidence=0.85-0.95)
    ├─ Similarity 0.70-0.90 → Level 2
    ├─ Similarity <0.70 → Skip to Level 3
    ↓
[Level 2: Small LLM]
    ├─ Generate response + confidence score
    ├─ Confidence >0.85 → Return
    ├─ Confidence 0.50-0.85 → Answer consistency check
    │   ├─ Generate 2 more responses
    │   ├─ Consistency >0.85 → Return
    │   ├─ Consistency <0.85 → Level 3
    ├─ Confidence <0.50 → Level 3
    ↓
[Level 3: Large LLM]
    ├─ Generate response
    ├─ Final answer (no further escalation)
    ↓
[Post-Processing]
    ├─ Log trace (tier path, latencies, confidence scores)
    ├─ Record cost metrics
    ├─ Return to user
```

**Tier Skipping Logic**:
- **Direct to Level 3 conditions**:
  - Query classified as "complex" (multi-intent, conditional reasoning)
  - Previous tier failures (>2 consecutive low confidence)
  - Protected domain (finance, healthcare, legal)
  - User-specified priority flag

---

## Fallback Logic Patterns

### Escalation Triggers

**Confidence-Based** (Primary Trigger):
- Confidence <threshold → Escalate
- Threshold varies by tier: L1=0.90, L2=0.70, L3=0.50 (human review)

**Timeout-Based**:
- **Per-tier timeouts**: L0=50ms, L1=200ms, L2=2s, L3=10s
- Timeout exceeded → Escalate to next tier immediately
- **Note**: Don't retry same tier on timeout, assume tier insufficient

**Error-Based**:
- Model inference error (OOM, CUDA error) → Escalate
- Invalid output format (JSON parsing failed) → Retry once, then escalate
- Rate limit hit → Fallback to cached response or escalate

**Answer Inconsistency**:
- Generate N responses (N=3-5)
- Semantic similarity between responses <0.70 → Escalate
- **Reasoning**: Model uncertainty indicates need for stronger model

### Tier Skipping Strategies

**Skip to Top Tier**:
- Query complexity score >0.80 (multi-intent, conditional)
- Previous session history shows repeated escalations for similar queries
- User explicitly requests "detailed" or "thorough" response
- Protected domain requiring maximum accuracy

**Skip Intermediate Tiers**:
- Level 1 similarity <0.50 → Skip Level 2, go directly to Level 3
- **Reasoning**: Large gap indicates Level 2 unlikely to succeed

**Cascade Shortcuts**:
- Maintain query type → tier mapping based on historical performance
- Example: "How do I..." questions → Start at Level 2 (skip Level 1)
- Update mappings weekly based on accuracy metrics

### Retry Strategies

**Same-Tier Retry** (Limited):
- **When**: Transient errors (timeout, rate limit, network error)
- **Max retries**: 1 per tier
- **Backoff**: 100ms, 200ms, 500ms exponential
- **Skip condition**: If same error twice, escalate instead of retry

**Higher-Tier Retry** (Standard):
- Default behavior: Escalate to next tier on confidence failure
- **Never** retry same tier for low confidence (model won't improve)

**Fallback to Cache**:
- On timeout/error, check semantic cache for similar query
- If found (similarity >0.95), return cached response
- Mark as "cached" in trace for quality monitoring

**Human Escalation**:
- When Level 3 confidence <0.50 OR
- When query flagged as sensitive/protected OR
- When compliance requires human-in-the-loop
- **Implementation**: Queue to human review system with full trace

### Error Handling Patterns

**Graduated Containment** (Governance):
- **Monitoring** (Tier 0): Log anomaly, continue
- **Planning restriction** (Tier 1): Prevent model from planning multi-step actions
- **Tool restriction** (Tier 2): Disable external tool calls
- **Isolation** (Tier 3): Quarantine session, route to human

**Circuit Breaker**:
- Track error rate per tier (sliding window, 1 minute)
- If error rate >20%, open circuit → Route all traffic to next tier
- **Auto-recovery**: Close circuit after 30s cooldown + 5 successful probes

**Graceful Degradation**:
- Level 3 down → Route to Level 2 + lower confidence threshold to 0.60
- All LLM tiers down → Fallback to Level 1 (semantic similarity only)
- All tiers down → Return cached response or "Service temporarily unavailable"

---

## Query Classification

### Complexity Detection

**Rule-Based Classifiers** (Fast, Tier 0):
- **Simple**: Single intent, <10 words, FAQ-style ("What is X?")
- **Moderate**: 2 intents, conditional ("If X then Y?"), 10-30 words
- **Complex**: 3+ intents, multi-step reasoning, >30 words, comparisons

**LLM-Based Classifier** (ModernBERT):
- Fine-tuned on labeled dataset of query complexity
- **Input**: Query text
- **Output**: Complexity score (0-1), intent labels, expected answer type
- **Latency**: ~50ms for classification
- **Accuracy**: 85-90% on held-out test set

**Feature-Based Scoring**:
- **Linguistic features**: Word count, sentence count, dependency tree depth
- **Semantic features**: Named entity count, specialized terminology density
- **Intent features**: Number of question words, conditional keywords ("if", "when")
- **Formula**: Weighted sum of features → complexity score

### Intent Detection

**Multi-Layered Classification**:
1. **BART zero-shot classification**: Broad intent categories (factual, procedural, opinion)
2. **Custom LLM classification**: Fine-grained intent (definitional, comparative, troubleshooting)
3. **Complexity estimation**: Simple/moderate/complex

**Semantic Router** (Open Source):
- Uses sentence transformers to encode query + predefined routes
- Compares embeddings via cosine similarity
- **Routes examples**:
  - FAQ route (similarity >0.90 to FAQ templates)
  - Technical support (similarity to troubleshooting patterns)
  - Escalation (no good match, similarity <0.60)

**Intent Registry**:
- Maintain catalog of known intents with example utterances
- **Structure**: Intent name, description, 5-10 example queries, target tier
- Update registry based on production traffic analysis (weekly)

### Multi-Intent Handling

**Decomposition Strategy**:
- Detect multiple intents in single query
- Split into sub-queries if intents are independent
- Route each sub-query separately
- Aggregate responses in post-processing

**Prioritization Strategy**:
- Rank intents by importance (primary, secondary, tertiary)
- Route based on primary intent
- Address secondary intents if confidence high after primary

**Complexity Escalation**:
- Multi-intent queries automatically classified as "moderate" or "complex"
- Start at higher tier (Level 2 instead of Level 1)
- Apply stricter confidence thresholds (0.80 instead of 0.70)

---

## Performance Monitoring

### Key Metrics

**Latency Metrics** (Three Tiers):
- **Token-level**: Time per token generated (measures model speed)
- **Model-level**: Total inference time per tier (batch throughput)
- **Application-level**: End-to-end response time (user experience)
- **Percentiles**: Track p50, p95, p99 for each tier
- **TTFT**: Time-to-first-token (streaming responsiveness)

**Cost Metrics**:
- **Per-tier cost**: Tokens consumed × model cost per 1K tokens
- **Per-request cost**: Sum of all tier costs in cascade
- **Cost per successful outcome**: Normalize by task success rate (not raw request count)
- **Efficiency metrics**: Cache hit rate, average tier depth, tier skip rate

**Quality Metrics**:
- **Task success rate**: Did response satisfy user intent? (binary or Likert scale)
- **Faithfulness**: Response grounded in provided context (0-1 score)
- **Retrieval quality**: Relevance of retrieved context (for RAG systems)
- **Safety compliance**: No harmful/biased content (policy violations)

**Routing Metrics**:
- **Tier distribution**: % of queries handled at each tier
- **Escalation rate**: % of queries requiring escalation
- **Tier skip rate**: % of queries bypassing intermediate tiers
- **Average tier depth**: Mean number of tiers used per query
- **Confidence distribution**: Histogram of confidence scores per tier

### Logging Patterns

**Distributed Tracing** (OpenTelemetry Standard):
- **Trace**: Entire request lifecycle across all tiers
- **Spans**: Each tier invocation (L0, L1, L2, L3)
- **Events**: Point-in-time annotations ("escalation triggered", "cache hit")

**Span Attributes** (What to Log):
- **Request metadata**: Session ID, user persona, query hash
- **Routing decisions**: Tier chosen, confidence score, skip reason
- **Model metadata**: Model name, prompt version, temperature, max_tokens
- **Performance data**: Latency, token count (input/output), cost
- **Errors**: Exception type, error message, retry count

**Structured Logging Format** (JSON):
```json
{
  "trace_id": "abc123",
  "timestamp": "2025-10-29T10:30:45Z",
  "tier": "level_2",
  "model": "qwen-3b",
  "query_hash": "def456",
  "confidence": 0.72,
  "decision": "escalate",
  "escalation_reason": "confidence_below_threshold",
  "latency_ms": 1243,
  "tokens_input": 45,
  "tokens_output": 128,
  "cost_usd": 0.00032
}
```

**Trace Visualization**:
- Waterfall view showing time spent in each tier
- Decision tree showing routing logic flow
- Confidence evolution across tiers

### Debug Strategies

**Why-Did-This-Route-Here Analysis**:
- Query arrives → Log classification results (intent, complexity)
- Log each tier's decision (confidence, escalation reason)
- Store full trace in debug mode for failed queries
- **Tools**: Trace viewer (Langfuse, Arize, Galileo)

**Retrospective Analysis**:
- Daily review of queries that reached Level 3
- **Question**: Could these have been handled at Level 2 with better prompts?
- Weekly threshold tuning based on accuracy vs cost tradeoffs

**Confidence Calibration Check**:
- Compare model confidence to actual accuracy
- **Metric**: ECE (Expected Calibration Error)
- If confidence poorly calibrated (ECE >0.10), retrain deferral module

**A/B Test Observability**:
- Tag requests with experiment ID (control vs treatment)
- Compare metrics between groups (latency, accuracy, cost)
- Slice by query type, user segment, time of day

**Alerting**:
- Alert on: P95 latency spike (>2x baseline), error rate >5%, tier 3 usage >30%
- Dashboard: Real-time tier distribution, cost burn rate, quality metrics

---

## Comparison to tinyArms Architecture

### tinyArms Current Design

**Level 0: Regex/Keyword Rules**
- Exact match lookups
- Pattern matching (regex)
- FAQ database

**Level 1: Semantic Similarity**
- embeddinggemma model
- Vector similarity search
- Threshold: >0.90 for match

**Level 2: Small LLM Inference**
- Qwen-3B model
- Generative responses
- Confidence scoring

**Level 3: Deep Analysis**
- Qwen-7B model
- Complex reasoning
- Highest quality, highest cost

### Gaps Identified

**Missing Confidence Calibration**:
- ❌ No deferral module for calibrated confidence scoring
- ✅ **Recommendation**: Implement Gatekeeper-style loss function for Level 2 → Level 3 routing

**Missing Answer Consistency Check**:
- ❌ No multi-response generation for consistency validation
- ✅ **Recommendation**: Generate N=3 responses at Level 2, escalate if consistency <0.85

**Limited Tier Skipping Logic**:
- ❌ No complexity classifier for direct routing to Level 3
- ✅ **Recommendation**: Add query complexity scorer to skip Level 1/2 for complex queries

**No Circuit Breaker**:
- ❌ No error rate monitoring or automatic tier bypass
- ✅ **Recommendation**: Implement sliding window error tracking with circuit breaker

**Basic Logging**:
- ❌ No distributed tracing or OpenTelemetry integration
- ✅ **Recommendation**: Add trace IDs, span logging, structured JSON logs

**Static Thresholds**:
- ❌ Thresholds hardcoded, no A/B testing framework
- ✅ **Recommendation**: Implement continuous optimization or at minimum per-domain thresholds

### Alignment with Industry Best Practices

**✅ Strengths**:
- Four-tier cascade (matches industry standard: rules → embeddings → small LLM → large LLM)
- Semantic similarity approach (embeddinggemma) aligns with semantic router patterns
- Cost-conscious design (avoid Level 3 when possible)

**⚠️ Opportunities**:
- Add confidence calibration for more reliable routing decisions
- Implement answer consistency checks to reduce unnecessary escalations
- Add query complexity classifier for smarter tier selection
- Implement distributed tracing for production debugging

---

## Top 3 Orchestration Patterns (Recommendations)

### 1. Answer Consistency Scoring (Highest Impact)

**What**: Generate multiple responses at each tier, measure semantic similarity
**Why**: LLMs produce consistent answers when confident, inconsistent when uncertain
**How**:
- At Level 2 (Qwen-3B), generate N=3 responses with temperature=0.7
- Compute pairwise cosine similarity using sentence embeddings
- If mean similarity >0.85 → Return response (confidence validated)
- If mean similarity <0.85 → Escalate to Level 3

**Expected Impact**:
- Reduce Level 3 usage by 20-30% (fewer false escalations)
- Improve accuracy by 5-10% (catch uncertain Level 2 responses)
- Add ~500ms latency at Level 2 (acceptable tradeoff)

**Implementation Effort**: Medium (1-2 days)

### 2. Confidence Calibration with Gatekeeper Loss

**What**: Train a deferral module to output calibrated confidence scores
**Why**: Raw model logits poorly calibrated, leading to over/under escalation
**How**:
- Collect dataset: (query, Level 2 response, Level 3 response, human rating)
- Train classifier: Input = query + L2 logits → Output = probability L2 correct
- Use Gatekeeper loss function (differentiable, optimizes calibration)
- Deploy as routing decision: If P(L2 correct) >0.70 → Use L2, else L3

**Expected Impact**:
- Improve error-cost curve by 4-5% (better threshold decisions)
- Reduce Level 3 usage by 15-20% (fewer unnecessary escalations)
- Increase Level 2 accuracy by 3-5% (better filtering of bad responses)

**Implementation Effort**: High (3-5 days, requires training data + training loop)

### 3. Distributed Tracing with OpenTelemetry

**What**: Structured logging with trace IDs, spans, and semantic attributes
**Why**: Production debugging impossible without visibility into routing decisions
**How**:
- Add OpenTelemetry SDK to tinyArms
- Create trace for each request (trace_id generated at entry point)
- Create span for each tier (level_0, level_1, level_2, level_3)
- Log attributes: confidence, decision, latency, cost, error
- Export to observability platform (Jaeger, Langfuse, or local JSON logs)

**Expected Impact**:
- Enable root cause analysis for routing issues
- Identify slow tiers via waterfall views
- Support A/B testing with trace-based segmentation
- Unblock future optimizations (need data to tune thresholds)

**Implementation Effort**: Medium (2-3 days, mostly integration work)

---

## Confidence Threshold Recommendations

### Default Thresholds (Starting Point)

**Level 0 → Level 1**:
- Threshold: No exact match found
- Confidence: N/A (rule-based, binary)

**Level 1 → Level 2**:
- Threshold: Embedding similarity <0.90
- Confidence: Cosine similarity score (0-1)

**Level 2 → Level 3**:
- Threshold: LLM confidence <0.70 OR answer consistency <0.85
- Confidence: Mean logit score (0-1) OR multi-response similarity

**Level 3 → Human**:
- Threshold: LLM confidence <0.50 OR protected domain query
- Confidence: Mean logit score (0-1)

### Per-Domain Thresholds (Tuned)

**High-stakes domains** (finance, healthcare, legal):
- Level 1 → Level 2: <0.95 (stricter)
- Level 2 → Level 3: <0.80 (stricter)
- Level 3 → Human: <0.70 (enable HITL)

**Casual domains** (chitchat, FAQs):
- Level 1 → Level 2: <0.85 (more lenient)
- Level 2 → Level 3: <0.60 (avoid L3 when possible)
- Level 3 → Human: <0.40 (rarely escalate)

### Tuning Strategy (Iterative)

**Week 1-2**: Deploy default thresholds, collect production data
**Week 3-4**: Analyze accuracy vs cost tradeoffs per threshold
**Week 5+**: Implement continuous optimization (Markov-copula model) OR run A/B tests

**Metrics to optimize**:
- Minimize: Cost per successful outcome
- Maximize: Task success rate
- Constraint: P95 latency <3s

---

## References

**Academic Papers**:
- Gatekeeper (2025): "Improving Model Cascades Through Confidence Tuning" - arXiv:2502.19335
- Rational Tuning (2025): "Rational Tuning of LLM Cascades via Probabilistic Modeling" - arXiv:2501.09345
- LLM Cascades (2023): "Large Language Model Cascades with Mixture of Thoughts" - arXiv:2310.03094
- Semantic Agreement (2024): "Semantic Agreement Enables Efficient Open-Ended LLM Cascades" - arXiv:2509.21837

**Industry Resources**:
- Multimodal.dev: "Using Confidence Scoring to Reduce Risk in AI-Driven Decisions"
- Tribe.ai: "Reducing Latency and Cost at Scale: How Leading Enterprises Optimize LLM Performance"
- Galileo.ai: "Multi-Agent Coordination Strategies" + "7 Key LLM Metrics"
- Microsoft Learn: "Trace and Observe AI Agents in Azure AI Foundry"
- Langfuse: "AI Agent Observability with Langfuse"

**Open Source Tools**:
- Semantic Router: https://github.com/aurelio-labs/semantic-router
- OpenTelemetry Python SDK: https://opentelemetry.io/docs/languages/python/
- Langfuse (Tracing): https://langfuse.com
- Sentence Transformers: https://www.sbert.net

---

**Research completed**: 2025-10-29
**Total sources reviewed**: 25+ papers, blog posts, and documentation
**Confidence in recommendations**: High (patterns validated across multiple production systems)
