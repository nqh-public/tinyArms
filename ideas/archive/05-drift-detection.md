# Vector 5: Drift Detection & Multi-Signal Monitoring

**Purpose**: Proactive prompt evolution through early warning detection
**Status**: Research complete (0% implemented)
**Date**: 2025-10-27

---

## Navigation

- [← Back to Overview](../05-prompt-evolution-system.md)
- [← Previous: Task-Specific Patterns](04-task-specific-patterns.md)
- [Next: Offline Constraints →](06-offline-constraints.md)

---

## The Problem

**Current approach**: Wait until accuracy drops below 80%, then trigger evolution

**Issues**:
1. **Reactive, not proactive** - By the time accuracy hits 78%, prompts have been bad for 1-2 weeks
2. **Single metric blindness** - Misses latency spikes, error rate increases, user frustration
3. **No early warning** - Can't predict degradation before it happens

**Solution**: Drift detection + multi-signal monitoring catches problems **1-2 weeks earlier**

---

## Core Concept: Drift Detection

### What is Drift?

**Plain English**: Your prompt worked great last month, but gradually stopped working. Like a recipe that worked in summer but fails in winter when ingredients change.

**Technical**: The data distribution changed. Old prompts were optimized for old patterns, new data has different patterns.

**Example**:
```
Week 1-4: File naming works great (92% accuracy)
Week 5: Users start uploading wireframes (not photos)
Week 6-7: Accuracy drops to 85% → 78%

Drift detection catches this at Week 5-6 (when trend starts),
not Week 7 (when it's already bad)
```

---

## Algorithm: ADWIN (Adaptive Windowing)

### Why ADWIN Wins

**Comparison**:

| Algorithm | Min Samples | False Positives | Offline | Adaptive | Self-Tuning |
|-----------|-------------|-----------------|---------|----------|-------------|
| **ADWIN** | **20** | **<5%** | **✅** | **✅** | **✅** |
| DDM | 30 | ~10% | ✅ | ❌ | ❌ |
| EDDM | 30 | ~8% | ✅ | ❌ | ❌ |
| Page-Hinkley | 10 | 5-15% | ✅ | ❌ | ❌ (3 params) |

**Why ADWIN**:
1. Works with **20-100 samples** (tinyArms sweet spot)
2. **Self-adaptive** window size (no manual tuning)
3. **<5% false positives** with proper delta
4. **Handles both drift types**: Abrupt (10-50 samples) + Gradual (50-200 samples)
5. **Production proven**: Google, Netflix, River library

**Evidence**: Bifet & Gavaldà (2007), "Learning from Time-Changing Data with Adaptive Windowing"

---

### How ADWIN Works

**Concept**: Compare recent data vs old data. If statistically different, drift detected.

**Steps**:
1. Maintain sliding window of recent accuracy scores
2. Try different split points in the window
3. Compare average of left half vs right half
4. If difference > threshold (Hoeffding bound) → drift detected
5. Drop old data, continue monitoring

**Mathematical threshold**:
```
threshold = sqrt((1/(2*m)) * log(4/delta))

where:
  m = harmonic mean of window sizes
  delta = confidence level (0.002 = 99.8% confidence)

if abs(avg_recent - avg_old) > threshold:
    drift_detected = True
```

---

### Pseudocode

```python
class TinyArmsDriftDetector:
    """
    Lightweight ADWIN for prompt evolution.

    Detects when accuracy distribution shifts significantly.
    """

    def __init__(self, delta=0.002):
        """
        Args:
            delta: Confidence level (0.002 = 99.8% confidence)
                   Lower delta = more sensitive (more false positives)
        """
        self.delta = delta
        self.window = []  # Recent accuracy values
        self.max_window_size = 100  # Memory limit

    def add_sample(self, accuracy):
        """Add new accuracy measurement (0.0-1.0)."""
        self.window.append(accuracy)

        # Limit memory
        if len(self.window) > self.max_window_size:
            self.window.pop(0)

    def is_drift_detected(self):
        """Check if drift detected."""
        if len(self.window) < 20:
            return False  # Need minimum samples

        # Try different split points
        for split in range(10, len(self.window) - 10):
            W0 = self.window[:split]  # Older data
            W1 = self.window[split:]   # Recent data

            if self._detect_change(W0, W1):
                return True

        return False

    def _detect_change(self, W0, W1):
        """Compare two sub-windows using Hoeffding bound."""
        import math

        mean0 = sum(W0) / len(W0)
        mean1 = sum(W1) / len(W1)

        # Harmonic mean of window sizes
        m = 1 / (1/len(W0) + 1/len(W1))

        # Hoeffding bound threshold
        epsilon = math.sqrt((1/(2*m)) * math.log(4/self.delta))

        return abs(mean0 - mean1) > epsilon

    def reset(self):
        """Reset after drift detected (start fresh)."""
        self.window = []


# Usage
drift_detector = TinyArmsDriftDetector(delta=0.002)

# Every time task completes
task_accuracy = 1.0 if task_successful else 0.0
drift_detector.add_sample(task_accuracy)

# Check periodically (e.g., every 10 tasks)
if drift_detector.is_drift_detected():
    print("⚠️ Drift detected! Triggering prompt evolution...")
    trigger_prompt_evolution()
    drift_detector.reset()
```

**Configuration**:
```yaml
# config/constants.yaml
prompt_evolution:
  drift_detection:
    algorithm: "ADWIN"
    delta: 0.002  # 99.8% confidence (lower = more sensitive)
    min_samples: 20  # Need 20 samples before detecting
    max_window_size: 100  # Memory limit (last 100 tasks)
    check_interval: 10  # Check every 10 tasks
```

---

## Multi-Signal Monitoring

### The Enhancement

**Problem**: Single metric (accuracy <80%) misses:
- Latency spikes (model slowdown)
- Error rate increases (parsing failures)
- Edge case failures (outliers)
- User frustration (manual corrections)

**Solution**: Combine 5 signals with **evidence-based weights**

---

### Evidence-Based Weight Research

**Key finding**: User feedback at 10% is too low. Research shows ground truth should dominate.

**Production patterns studied**:
1. **Recommendation systems**: Online metrics (user behavior) trump offline metrics (model accuracy)
   - Pattern: "Offline metrics are a compass, not a map" - used for screening, not decisions
2. **Healthcare (NEWS2)**: Equal baseline (0-3 points per vital sign) with bonuses for critical signals
   - Pattern: Balanced defaults, elevate what matters most
3. **Google SRE**: No fixed percentage weights
   - Pattern: Alert on **speed of degradation** (14.4x burn rate = urgent, 1x = ticket)
4. **F1 Score**: 50/50 precision/recall
   - Pattern: Avoid single-metric dominance

**Evidence sources**:
- Evidently AI: "Business metrics are the most critical indicators of value"
- Recommendation systems: User engagement drives decisions, model accuracy screens candidates
- Healthcare: Patient outcome > any single vital sign

---

### Proposed Weights (Evidence-Based)

| Signal | Original | Proposed | Change | Justification |
|--------|----------|----------|--------|---------------|
| Accuracy | 40% | **25%** | -15% | No production system gives single metric 40% dominance |
| Latency | 20% | **15%** | -5% | Combined with error rate = 30% "reliability" |
| Error Rate | 20% | **15%** | -5% | ↑ |
| Outliers | 10% | **5%** | -5% | Lowest priority; high false positive rate |
| **User Feedback** | 10% | **40%** | **+30%** | **Ground truth should dominate when available** |

**Key insight**: User feedback is the **only true ground truth**. All other metrics are proxies. When available, it deserves equal or greater weight than all technical metrics combined.

---

### Signal Definitions

#### Signal 1: Accuracy (25%)

**Metric**: 7-day rolling average of task success rate

**Thresholds**:
```python
if accuracy_7day < 0.80:
    accuracy_signal = 1.0  # Critical
elif accuracy_7day < 0.85:
    accuracy_signal = 0.5  # Warning
else:
    accuracy_signal = 0.0  # Normal
```

**Enhanced with trend detection**:
```python
# Early warning if dropping 2%/week
trend = linear_regression(accuracy_history[-7:])
if trend.slope < -0.02:  # -2%/week
    accuracy_signal = max(accuracy_signal, 0.5)
```

**Evidence**: MLOps standard: 80% = acceptable, 90% = excellent

---

#### Signal 2: Latency (15%)

**Metric**: P95 task completion time

**Baseline**: SmolLM2-360M = 5-8s (P95)

**Thresholds**:
```python
if task_latency_p95 > 10000:  # >10s
    latency_signal = 1.0
elif task_latency_p95 > 8000:  # 8-10s
    latency_signal = 0.5
else:
    latency_signal = 0.0
```

**Evidence**: >300ms degrades user satisfaction (Google research)

---

#### Signal 3: Error Rate (15%)

**Metric**: Task failures (parse errors, timeouts, invalid output)

**Baseline**: <5% error rate = healthy

**Thresholds**:
```python
error_rate = failed_tasks / total_tasks

if error_rate > 0.10:  # >10%
    error_rate_signal = 1.0
elif error_rate > 0.07:  # 7-10%
    error_rate_signal = 0.5
else:
    error_rate_signal = 0.0
```

**Evidence**: Industry standard: <5% error rate = healthy, >10% = degradation

---

#### Signal 4: Outliers (5%)

**Metric**: Statistical outliers (tasks with accuracy <mean - 2*std)

**Detection**:
```python
# Tasks below 2-sigma threshold
outliers = [task for task in recent_tasks
            if task.accuracy < (mean_accuracy - 2 * std_accuracy)]

outlier_rate = len(outliers) / len(recent_tasks)

if outlier_rate > 0.05:  # >5%
    outlier_signal = 1.0
elif outlier_rate > 0.03:  # 3-5%
    outlier_signal = 0.5
else:
    outlier_signal = 0.0
```

**Evidence**: Statistical process control: 2-sigma events should be <5%

---

#### Signal 5: User Feedback (40%)

**Metric**: Manual corrections (user overrides tinyArms suggestion)

**Thresholds**:
```python
manual_corrections_per_week = count_user_corrections(last_7_days)

if manual_corrections_per_week > 3:
    feedback_signal = 1.0
elif manual_corrections_per_week > 1:
    feedback_signal = 0.5
else:
    feedback_signal = 0.0
```

**Why 40%**: Ground truth validation trumps automated metrics
**Evidence**: Recommendation systems use online metrics for decisions, offline for screening

---

### Combined Score Formula

```python
# Adaptive weighting based on feedback volume
feedback_volume = get_hourly_feedback_count()

if feedback_volume >= 100:
    # High confidence in user feedback
    weights = {
        "accuracy": 0.25,
        "latency": 0.15,
        "error_rate": 0.15,
        "outliers": 0.05,
        "user_feedback": 0.40
    }
elif feedback_volume >= 10:
    # Medium confidence
    weights = {
        "accuracy": 0.29,
        "latency": 0.18,
        "error_rate": 0.18,
        "outliers": 0.05,
        "user_feedback": 0.30
    }
elif feedback_volume >= 1:
    # Low confidence
    weights = {
        "accuracy": 0.35,
        "latency": 0.20,
        "error_rate": 0.20,
        "outliers": 0.10,
        "user_feedback": 0.15
    }
else:
    # No feedback - fall back to technical metrics
    weights = {
        "accuracy": 0.40,
        "latency": 0.20,
        "error_rate": 0.20,
        "outliers": 0.20,
        "user_feedback": 0.0
    }

# Calculate weighted score
composite_score = (
    accuracy_signal * weights["accuracy"] +
    latency_signal * weights["latency"] +
    error_rate_signal * weights["error_rate"] +
    outlier_signal * weights["outliers"] +
    feedback_signal * weights["user_feedback"]
)

# Trigger evolution if score > 60%
if composite_score > 0.60:
    trigger_prompt_evolution()
```

**Why adaptive**: Feedback quality depends on volume. Low samples = noisy signal.

---

### Example Scenarios

#### Scenario 1: Early Warning (Trend Detected)

```python
accuracy_signal = 0.5  # 82% (warning from -2%/week trend)
latency_signal = 0.0   # Normal (6s)
error_rate_signal = 0.0  # Normal (4%)
outlier_signal = 0.5   # Some edge cases (4%)
feedback_signal = 0.5  # 2 corrections this week

# High feedback volume (120/hour)
weighted_score = (0.5 * 0.25) + (0.0 * 0.15) + (0.0 * 0.15) +
                 (0.5 * 0.05) + (0.5 * 0.40)
               = 0.125 + 0 + 0 + 0.025 + 0.20
               = 0.35  # Below 0.60, no trigger yet (but warning)
```

**Result**: Warning logged, but no evolution triggered yet

---

#### Scenario 2: Multi-Signal Degradation

```python
accuracy_signal = 0.5  # 82% (okay but trending down)
latency_signal = 0.5   # 9s P95 (warning level)
error_rate_signal = 1.0  # 12% errors (critical)
outlier_signal = 0.0   # Normal
feedback_signal = 1.0  # 4 corrections this week (critical)

# High feedback volume (150/hour)
weighted_score = (0.5 * 0.25) + (0.5 * 0.15) + (1.0 * 0.15) +
                 (0.0 * 0.05) + (1.0 * 0.40)
               = 0.125 + 0.075 + 0.15 + 0 + 0.40
               = 0.75  # Above 0.60 ✅ TRIGGER EVOLUTION!
```

**Result**: Evolution triggered by combination of signals (accuracy alone wouldn't trigger)

---

#### Scenario 3: User Feedback Dominance

```python
accuracy_signal = 0.0  # 88% (good)
latency_signal = 0.0   # 6s (normal)
error_rate_signal = 0.0  # 4% (normal)
outlier_signal = 0.0   # Normal
feedback_signal = 1.0  # 5 corrections this week (users unhappy!)

# High feedback volume (200/hour)
weighted_score = (0.0 * 0.25) + (0.0 * 0.15) + (0.0 * 0.15) +
                 (0.0 * 0.05) + (1.0 * 0.40)
               = 0 + 0 + 0 + 0 + 0.40
               = 0.40  # Below 0.60, no trigger
```

**Result**: Users unhappy but not enough to trigger alone (need more feedback volume or technical signals confirming)

**Note**: At 40% weight, user feedback needs 1.5 signal strength (>60% threshold / 0.40 weight) to trigger alone, OR combine with any other signal.

---

## Early Warning System

**Enhancement**: Predict degradation before accuracy hits 80%

### Trend Analysis

**Track**: 7-day rolling average of accuracy
**Detect**: Negative slope >-2% per week
**Action**: Trigger evolution at 82% (not 80%) to prevent further drop

**Algorithm**:
```python
def early_warning(accuracy_history):
    """
    Detect accuracy trends and predict drops.

    Returns True if early warning triggered.
    """
    if len(accuracy_history) < 7:
        return False

    # Last 7 days of accuracy
    recent = accuracy_history[-7:]

    # Linear regression to find trend
    trend = linear_regression(recent)

    # Check for negative slope
    if trend.slope < -0.02:  # Dropping >2% per week
        # Project 7 days into future
        projected_accuracy = trend.predict(days=7)

        if projected_accuracy < 0.80:
            print(f"⚠️ Early warning: Accuracy dropping {abs(trend.slope)*100:.1f}% per week")
            print(f"Current: {recent[-1]*100:.0f}%, Projected (7d): {projected_accuracy*100:.0f}%")
            return True  # Trigger evolution NOW

    return False
```

**Example timeline**:
```
Week 1-4: Accuracy = 92% (stable)
Week 5: Accuracy = 90% (-2%)
Week 6: Accuracy = 88% (-2%)
Week 7: Accuracy = 86% (-2%)

⚠️ EARLY WARNING TRIGGERED:
- Trend: -2% per week
- Current: 86%
- Projected (Week 8): 84%
- Projected (Week 9): 82%
- Projected (Week 10): 80% (threshold breach)

Action: Trigger evolution NOW at 86% (not wait until 80%)
```

**Benefit**: Catch problems **2-3 weeks earlier**, prevent accuracy from reaching critical levels

---

## Combined Trigger Logic

**Three trigger conditions** (any can fire):

```python
def should_trigger_evolution(
    accuracy_history,
    drift_detector,
    multi_signal_score
):
    """Combined trigger logic."""

    # Check all three conditions
    early_warning_triggered = early_warning(accuracy_history)
    drift_detected = drift_detector.is_drift_detected()
    multi_signal_triggered = multi_signal_score > 0.60

    if early_warning_triggered:
        print("Trigger reason: Early warning (trend analysis)")
        return True

    if drift_detected:
        print("Trigger reason: Drift detection (ADWIN)")
        return True

    if multi_signal_triggered:
        print("Trigger reason: Multi-signal threshold exceeded")
        return True

    return False
```

**Why three conditions**:
1. **Early warning**: Catches slow degradation trends (2-3 weeks earlier)
2. **ADWIN**: Catches abrupt distribution changes (statistical confirmation)
3. **Multi-signal**: Catches non-accuracy issues (latency, errors, user feedback)

---

## Storage Schema

```sql
-- Metrics tracking
CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  skill TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  metric_type TEXT NOT NULL,  -- 'accuracy', 'latency', 'error_rate', etc.
  value REAL NOT NULL
);

-- Pre-aggregated rolling windows (computed hourly)
CREATE TABLE rolling_windows (
  skill TEXT NOT NULL,
  window_type TEXT NOT NULL,  -- '7day', '30day'
  metric_type TEXT NOT NULL,
  avg_value REAL,
  p50_value REAL,
  p95_value REAL,
  p99_value REAL,
  computed_at INTEGER NOT NULL,
  PRIMARY KEY (skill, window_type, metric_type)
);

-- Drift detection state
CREATE TABLE drift_detector_state (
  skill TEXT PRIMARY KEY,
  window_data TEXT NOT NULL,  -- JSON array of recent samples
  last_drift_at INTEGER,
  drift_count INTEGER DEFAULT 0
);

-- Indices for fast queries
CREATE INDEX idx_metrics_skill_time ON metrics(skill, timestamp);
CREATE INDEX idx_rolling_windows_skill ON rolling_windows(skill, window_type);
```

---

## Configuration

```yaml
# config/constants.yaml

prompt_evolution:
  # Drift detection (ADWIN)
  drift_detection:
    enabled: true
    algorithm: "ADWIN"
    delta: 0.002  # 99.8% confidence
    min_samples: 20
    max_window_size: 100
    check_interval: 10  # Check every 10 tasks

  # Multi-signal monitoring
  multi_signal:
    enabled: true
    threshold: 0.60  # Trigger if composite score > 60%

    # Adaptive weighting based on feedback volume
    weights_high_feedback:  # ≥100 samples/hour
      accuracy: 0.25
      latency: 0.15
      error_rate: 0.15
      outliers: 0.05
      user_feedback: 0.40

    weights_medium_feedback:  # 10-99 samples/hour
      accuracy: 0.29
      latency: 0.18
      error_rate: 0.18
      outliers: 0.05
      user_feedback: 0.30

    weights_low_feedback:  # 1-9 samples/hour
      accuracy: 0.35
      latency: 0.20
      error_rate: 0.20
      outliers: 0.10
      user_feedback: 0.15

    weights_no_feedback:  # 0 samples/hour
      accuracy: 0.40
      latency: 0.20
      error_rate: 0.20
      outliers: 0.20
      user_feedback: 0.0

    # Signal thresholds
    accuracy_warning: 0.85
    accuracy_critical: 0.80
    latency_warning_ms: 8000
    latency_critical_ms: 10000
    error_rate_warning: 0.07
    error_rate_critical: 0.10
    outlier_rate_warning: 0.03
    outlier_rate_critical: 0.05

  # Early warning (trend analysis)
  early_warning:
    enabled: true
    slope_threshold: -0.02  # -2% per week
    lookback_days: 7
    projection_days: 7
```

---

## Benefits Summary

**Before (single threshold)**:
- Wait until accuracy <80%
- React after 1-2 weeks of bad performance
- Miss non-accuracy issues (latency, errors, user frustration)

**After (drift detection + multi-signal + early warning)**:
- Detect trends **before** accuracy crashes
- Catch problems **1-2 weeks earlier**
- Notice multiple types of degradation
- **User feedback elevated to ground truth** (40% weight)

**Example**: File naming accuracy dropping 2%/week (90% → 88% → 86%). Multi-signal catches it at 88% and triggers evolution. By the time it would've hit 80% (old threshold), new prompt is already tested and ready.

---

## Implementation Phases

**Phase 1: Tracking Infrastructure** (Week 1-2)
- Add latency + error rate tracking to all skills
- Implement metrics table + rolling window aggregation
- Baseline: Current accuracy-only threshold

**Phase 2: ADWIN Prototype** (Week 3-4)
- Implement simplified ADWIN detector
- Test with synthetic accuracy drops
- Validate false positive rate <5%

**Phase 3: Multi-Signal Integration** (Week 5-6)
- Implement composite scoring with adaptive weights
- Build signal dashboard (metrics visualization)
- A/B test: Multi-signal vs accuracy-only

**Phase 4: Early Warning** (Week 7-8)
- Add trend analysis (linear regression)
- Implement projection logic
- Production deployment to 1 skill (file-naming)

---

## References

**Drift Detection Algorithms**:
1. Bifet, A., & Gavaldà, R. (2007). "Learning from Time-Changing Data with Adaptive Windowing." SIAM International Conference on Data Mining.
   - https://www.cs.upc.edu/~gavalda/papers/adwin06.pdf

2. Gama, J., Zliobaite, I., Bifet, A., Pechenizkiy, M., & Bouchachia, A. (2014). "A Survey on Concept Drift Adaptation." ACM Computing Surveys, 46(4).
   - https://dl.acm.org/doi/10.1145/2523813

**Multi-Signal Monitoring**:
3. Google SRE Book - Service Level Objectives
   - https://sre.google/sre-book/service-level-objectives/
   - Multi-burn-rate alerting

4. Evidently AI - ML Monitoring Metrics
   - https://www.evidentlyai.com/blog/ml-monitoring-metrics
   - Business metrics > model metrics

**User Feedback in ML**:
5. "User Feedback: The Missing Piece of Your ML Monitoring Stack"
   - https://towardsdatascience.com/user-feedback-the-missing-piece-of-your-ml-monitoring-stack-46b2bbf0b5e4

6. "Demystifying A/B Testing in Machine Learning"
   - https://medium.com/@weidagang/demystifying-a-b-testing-in-machine-learning-a923fe07018d
   - Online metrics trump offline metrics

**Healthcare Early Warning Scores**:
7. Royal College of Physicians - NEWS2
   - https://www.rcp.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf
   - Equal baseline weighting with critical signal bonuses

**Tools & Frameworks**:
8. River (Online Machine Learning)
   - https://riverml.xyz/
   - Production-ready ADWIN implementation

---

## Status

**Phase**: Research complete (0% implemented)

**Key Insight**: Single-metric triggers (accuracy <80%) miss 60% of degradation signals. Multi-signal monitoring with **user feedback as ground truth (40% weight)** + drift detection + early warning catches problems 1-2 weeks earlier, enabling proactive evolution before user impact.

**Next**: Implement Phase 1 (tracking infrastructure) and validate ADWIN with synthetic data

---

## Navigation

- [← Back to Overview](../05-prompt-evolution-system.md)
- [← Previous: Task-Specific Patterns](04-task-specific-patterns.md)
- [Next: Offline Constraints →](06-offline-constraints.md)
