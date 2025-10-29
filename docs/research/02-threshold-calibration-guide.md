# Threshold Calibration Guide

**Status**: Researched (2025-10-29)
**Phase**: 02 (Confidence Scoring + Threshold Tuning)
**Implementation**: Week 3-5
**Purpose**: Operational guidance for tuning confidence thresholds in production

---

## Problem Statement

**Challenge**: Raw confidence scores (logits, similarity) don't directly translate to optimal routing decisions.

**Example**: Should consistency=0.82 trigger escalation? Depends on:
- Query difficulty distribution
- Cost vs accuracy trade-off preferences
- Domain-specific risk tolerance

**Solution**: Calibrate thresholds empirically using production data.

---

## Threshold Types

### Fixed Thresholds (Week 3-4)
- **Definition**: Static values set once, rarely changed
- **Example**: L2→L3 escalation at consistency <0.85
- **Pros**: Simple, predictable, easy to debug
- **Cons**: Not optimal for all query types

### Dynamic Thresholds (Week 5+)
- **Definition**: Adjust based on real-time metrics (query type, user preferences, cost budget)
- **Example**: High-stakes queries use 0.90, casual queries use 0.75
- **Pros**: Optimal per-query-type
- **Cons**: Complex, requires threshold registry

### Adaptive Thresholds (Week 6+, Advanced)
- **Definition**: ML model predicts optimal threshold per query
- **Example**: Continuous optimization (Markov-copula probabilistic model)
- **Pros**: Maximally optimal
- **Cons**: Requires significant training data + ML infrastructure

**Recommendation**: Start with **fixed thresholds** (Week 3-4), graduate to **dynamic** (Week 5) if domain-specific tuning is needed.

---

## Default Thresholds (Starting Values)

### Level 0 → Level 1
- **Trigger**: No exact match found
- **Confidence**: N/A (binary: match or no match)

### Level 1 → Level 2
- **Metric**: Embedding cosine similarity
- **Threshold**: <0.90
- **Reasoning**: Semantic match must be strong (>0.90) to avoid LLM invocation

### Level 2 → Level 3
- **Metric**: Answer consistency (pairwise similarity of N=3 responses)
- **Threshold**: <0.85
- **Reasoning**: Validated by AutoMix research (semantic agreement threshold)

### Level 3 → Human Review
- **Metric**: Logit confidence OR manual escalation flag
- **Threshold**: <0.50 (very uncertain) OR protected domain
- **Reasoning**: Large model uncertainty is rare, indicates truly hard query

**Reference**: research/02-orchestration-patterns.md:469-486

---

## Calibration Methodology

### Step 1: Collect Baseline Data (Week 3)

**Deploy with default thresholds**:
```python
# Configuration
THRESHOLDS = {
    "l1_to_l2": 0.90,  # Embedding similarity
    "l2_to_l3": 0.85,  # Answer consistency
    "l3_to_human": 0.50  # Logit confidence
}
```

**Log every routing decision**:
```json
{
  "query_id": "abc123",
  "tier_final": "level_2",
  "l1_similarity": 0.88,
  "l2_consistency": 0.87,
  "decision": "accepted_at_l2"
}
```

**Collect 1000+ queries** (7 days of production traffic)

---

### Step 2: Evaluate Accuracy vs Cost (Week 4)

**For each query, record**:
- Tier used (L0, L1, L2, L3)
- Confidence score at decision point
- Actual correctness (manual eval or user feedback)

**Create accuracy vs threshold plot**:
```
Accuracy
  ↑
100% |           ╱─────────────
     |          ╱
 90% |         ╱
     |        ╱  ← Optimal point (maximize accuracy, minimize cost)
 80% |       ╱
     |      ╱
 70% |─────╱
     |
     └──────────────────────→ Threshold
       0.60  0.70  0.80  0.90
         (always escalate) (rarely escalate)
```

**Identify optimal threshold**: Point where accuracy plateaus (diminishing returns from escalation)

---

### Step 3: A/B Test Candidate Thresholds (Week 5)

**Split traffic**:
- 50% Control: Threshold = 0.85 (baseline)
- 50% Treatment: Threshold = 0.80 (candidate)

**Measure**:
- Accuracy delta: Treatment vs Control
- L3 escalation rate: % increase
- Cost delta: Estimated from L3 usage

**Decision criteria**:
- If accuracy +2% AND cost +10% → Accept (worth it)
- If accuracy +0.5% AND cost +10% → Reject (not worth it)
- If accuracy -1% → Reject immediately (safety violation)

**Statistical significance**: p<0.05 (need ~500 queries per arm)

**Reference**: research/02-orchestration-patterns.md:50-56

---

### Step 4: Per-Domain Tuning (Week 5+, Optional)

**Identify domains** (manually or via classifier):
- Security-related code
- General coding tasks
- Documentation/comments
- Configuration files

**Tune thresholds per domain**:

| Domain | L1→L2 | L2→L3 | Reasoning |
|--------|-------|-------|-----------|
| Security | 0.95 | 0.90 | High stakes, prefer over-escalation |
| General code | 0.90 | 0.85 | Balanced |
| Documentation | 0.85 | 0.75 | Low stakes, avoid expensive L3 |
| Config files | 0.85 | 0.70 | Deterministic, L2 sufficient |

**Implementation**:
```python
DOMAIN_THRESHOLDS = {
    "security": {"l1_to_l2": 0.95, "l2_to_l3": 0.90},
    "general_code": {"l1_to_l2": 0.90, "l2_to_l3": 0.85},
    "documentation": {"l1_to_l2": 0.85, "l2_to_l3": 0.75},
    "config": {"l1_to_l2": 0.85, "l2_to_l3": 0.70}
}

def get_threshold(domain, transition):
    return DOMAIN_THRESHOLDS.get(domain, DEFAULT_THRESHOLDS)[transition]
```

**Reference**: research/02-orchestration-patterns.md:488-498

---

## Continuous Optimization (Advanced)

### Markov-Copula Probabilistic Model (Phase 05+)

**Method**: Model joint performance distribution of LLM sequence, optimize thresholds continuously.

**Algorithm**:
1. Model each tier's performance as random variable
2. Learn copula (joint distribution) from historical data
3. Solve optimization problem: Minimize cost subject to accuracy ≥ target
4. Output optimal threshold per tier

**Performance**: 4.3% improvement vs Bayesian optimization (grid search)

**Trade-offs**:
- Requires significant data (10K+ queries)
- Complex implementation (probabilistic modeling)
- Maintenance overhead (retrain monthly)

**When to use**: Production system at scale (100K+ queries/month)

**Reference**: arXiv:2501.09345 "Rational Tuning of LLM Cascades via Probabilistic Modeling"

---

## Threshold Registry Design

### Configuration File (YAML)

```yaml
# thresholds.yaml
version: "1.0"
updated: "2025-10-29"

global_defaults:
  l1_to_l2: 0.90
  l2_to_l3: 0.85
  l3_to_human: 0.50

per_domain:
  security:
    l1_to_l2: 0.95
    l2_to_l3: 0.90
  general_code:
    l1_to_l2: 0.90
    l2_to_l3: 0.85
  documentation:
    l1_to_l2: 0.85
    l2_to_l3: 0.75

per_user:
  power_user:
    # Prefer speed over accuracy
    l2_to_l3: 0.70
  enterprise_user:
    # Prefer accuracy over cost
    l2_to_l3: 0.90
```

### Runtime Loading

```python
import yaml

class ThresholdManager:
    def __init__(self, config_path):
        with open(config_path) as f:
            self.config = yaml.safe_load(f)

    def get_threshold(self, transition, domain=None, user_type=None):
        # Priority: user > domain > global
        if user_type and user_type in self.config.get("per_user", {}):
            return self.config["per_user"][user_type].get(transition)

        if domain and domain in self.config.get("per_domain", {}):
            return self.config["per_domain"][domain].get(transition)

        return self.config["global_defaults"][transition]

# Usage
thresholds = ThresholdManager("thresholds.yaml")
threshold = thresholds.get_threshold("l2_to_l3", domain="security", user_type="enterprise_user")
```

---

## Monitoring and Alerting

### Key Metrics to Track

**Escalation Rates**:
```python
# Daily metrics
l2_to_l3_rate = (queries_escalated_to_l3) / (queries_reaching_l2)
target_range = (0.10, 0.20)  # 10-20% escalation

if l2_to_l3_rate < 0.05:
    alert("Under-escalating: Check for accuracy issues")
elif l2_to_l3_rate > 0.30:
    alert("Over-escalating: Threshold may be too strict")
```

**Confidence Distribution**:
```python
# Weekly histogram
consistency_scores = [0.62, 0.87, 0.91, 0.78, ...]
histogram(consistency_scores, bins=[0.6, 0.7, 0.8, 0.9, 1.0])

# Healthy pattern: Bimodal (many high, some low)
# Unhealthy: Uniform (always uncertain)
```

**Cost vs Accuracy Trend**:
```python
# Monthly trend
monthly_metrics = [
    {"month": "Jan", "accuracy": 0.87, "cost_per_query": 0.003},
    {"month": "Feb", "accuracy": 0.89, "cost_per_query": 0.004},
]
plot_pareto_frontier(monthly_metrics)  # Accuracy vs cost trade-off
```

---

## Alerting Rules

**High Priority** (immediate action):
- L3 escalation rate >40% (threshold too strict)
- Accuracy <75% (threshold too lenient)
- ECE (calibration error) >0.15 (poor calibration)

**Medium Priority** (investigate weekly):
- L3 escalation rate <5% (potential under-escalation)
- Confidence distribution shifted (workload changed)

**Low Priority** (review monthly):
- Cost per query trend increasing >10% (threshold drift)

---

## Threshold Update Protocol

### When to Update Thresholds

**Trigger conditions**:
1. Accuracy below target for 3+ consecutive days
2. Cost exceeding budget for 1+ week
3. Major workload shift (new query types)
4. Model upgrade (Qwen2.5 → Qwen3)

### Update Process

1. **Propose change**: New threshold value + justification
2. **Simulate impact**: Historical replay (what would have happened?)
3. **A/B test**: 10% traffic for 3 days
4. **Review metrics**: Accuracy, cost, escalation rate
5. **Decision**:
   - Accept: Roll out to 100%
   - Reject: Revert to original threshold
   - Iterate: Try different value

### Rollback Plan

```python
# Version control for thresholds
THRESHOLD_HISTORY = [
    {"version": "1.0", "date": "2025-10-29", "l2_to_l3": 0.85},
    {"version": "1.1", "date": "2025-11-05", "l2_to_l3": 0.80},  # Active
]

def rollback_threshold(version):
    # Restore previous threshold if experiment fails
    config = THRESHOLD_HISTORY[version]
    apply_thresholds(config)
    log_event("Rolled back to version {version}")
```

---

## Example: Week-by-Week Calibration

### Week 3: Deploy with Defaults
- Thresholds: L1→L2 = 0.90, L2→L3 = 0.85
- Collect: 1000+ queries with confidence scores
- Baseline: L3 escalation rate = 25%

### Week 4: Analyze Data
- Plot: Accuracy vs Threshold
- Observation: Accuracy plateaus at threshold=0.80
- Hypothesis: Can lower threshold to 0.80, reduce L3 by 10%

### Week 5: A/B Test
- Control (50%): Threshold = 0.85
- Treatment (50%): Threshold = 0.80
- Result: Accuracy delta = +0.5%, L3 rate = 18% (vs 25%)
- Decision: Accept (7% cost reduction, minimal accuracy impact)

### Week 6: Per-Domain Tuning
- Analyze by domain: Security queries have 35% L3 rate
- Hypothesis: Security needs stricter threshold (0.90)
- A/B test security domain only
- Result: Accuracy +2%, L3 rate = 45% (acceptable for security)
- Decision: Accept domain-specific threshold

---

## Common Pitfalls

### 1. Premature Optimization
- **Mistake**: Tuning thresholds with <100 queries
- **Impact**: Overfitting to noise, unstable thresholds
- **Fix**: Collect 1000+ queries before tuning

### 2. Ignoring Domain Differences
- **Mistake**: Single global threshold for all query types
- **Impact**: Over-escalation for simple queries, under-escalation for complex
- **Fix**: Per-domain thresholds (Week 5+)

### 3. Not Monitoring Calibration
- **Mistake**: Set thresholds once, never revisit
- **Impact**: Threshold drift as workload changes
- **Fix**: Monthly calibration review

### 4. Chasing Perfect Accuracy
- **Mistake**: Setting threshold=0.95 to maximize accuracy
- **Impact**: 80%+ L3 usage, defeats purpose of tiers
- **Fix**: Accept 85-90% accuracy, optimize for cost

---

## Tools and Dashboards

### Threshold Tuning Dashboard (Recommended)

```
┌─────────────────────────────────────────────┐
│ Threshold Calibration Dashboard            │
├─────────────────────────────────────────────┤
│ Current Threshold: 0.85                     │
│ L3 Escalation Rate: 22% ▓▓▓▓▓░░░░░ (target: 15-25%) │
│ Accuracy: 87% ▓▓▓▓▓▓▓▓▓░ (target: >85%)   │
│ Cost per Query: $0.0032                     │
├─────────────────────────────────────────────┤
│ Simulation: If threshold = 0.80             │
│   Estimated L3 Rate: 18% (-4%)             │
│   Estimated Accuracy: 86% (-1%)            │
│   Estimated Cost: $0.0028 (-12%)           │
├─────────────────────────────────────────────┤
│ [Simulate] [A/B Test] [Apply]               │
└─────────────────────────────────────────────┘
```

### Visualization Tools
- **Plotly/Streamlit**: Interactive threshold slider
- **Grafana**: Real-time escalation rate monitoring
- **Jupyter Notebook**: Historical replay analysis

---

## Next Steps

1. **Week 3**: Deploy confidence scoring with default thresholds
2. **Week 4**: Collect 1000+ queries, analyze accuracy vs threshold
3. **Week 5**: A/B test optimal threshold candidates
4. **Week 6+**: Implement per-domain tuning if needed

**Dependencies**:
- Phase 01 tracing (log confidence scores)
- Phase 02 confidence scoring (answer consistency)
- Production workload (real queries for calibration)

**Full context**: See research/02-orchestration-patterns.md, research/02-confidence-scoring-patterns.md
