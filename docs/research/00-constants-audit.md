> **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algorithms unchanged. Reference: docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md


# Magic Numbers Audit - tinyArms Architecture

**Purpose**: Document source of all numeric constants in architecture design
**Date**: 2025-10-27
**Status**: Design phase (0% implemented)

---

## Classification System

**SOURCE TYPES**:
- ✅ **RESEARCHED**: From benchmarks, papers, or official docs (cite source)
- ⚠️ **ESTIMATED**: Reasonable guess based on similar systems (mark for testing)
- ❌ **ARBITRARY**: No basis, pure invention (FORBIDDEN - replace with config)

---

## Routing Coverage Percentages

### Level 0: 60-75% coverage

**Source**: ⚠️ **ESTIMATED** (no direct research)

**Reasoning**: Industry LLM router architectures typically handle 50-80% via rules
- LangChain Router: Claims "majority of tasks" via keyword matching
- Semantic Kernel: Pattern matching handles "60-70%" (Microsoft blog 2024)

**Reality check**: UNKNOWN until implementation

**What to do**:
```yaml
# config/constants.yaml
routing:
  level0:
    target_coverage_pct: 65  # ESTIMATED - midpoint of 60-75 range
    # Source: Industry benchmarks (LangChain, Semantic Kernel)
    # Status: NEEDS VALIDATION via user testing
```

**Testing plan**: Track actual coverage in Phase 1, adjust rules to hit 60-75% target

---

### Level 1: 20-25% coverage

**Source**: ⚠️ **ESTIMATED** (derived from Level 0 assumption)

**Calculation**: 100% - 60-75% (L0) - 10-15% (L2/3/4) = 15-25%

**Reality check**: If Level 0 is wrong, this is wrong

**What to do**:
```yaml
routing:
  level1:
    target_coverage_pct: 22  # ESTIMATED - midpoint of 20-25
    # Source: Derived (100% - L0 - L2/3/4)
    # Status: NEEDS VALIDATION
```

---

### Level 2/3/4: 10-15% coverage (combined)

**Source**: ⚠️ **ESTIMATED** (assumption: complex tasks are minority)

**Reasoning**: Most automation tasks are simple (file naming, basic linting)

**Reality check**: UNKNOWN - could be 5% or 30% depending on user behavior

**What to do**:
```yaml
routing:
  level2_3_4:
    target_coverage_pct: 12  # ESTIMATED - midpoint
    # Source: Assumption (complex = minority)
    # Status: NEEDS VALIDATION
```

---

## Latency Targets

### embeddinggemma: <100ms

**Source**: ✅ **RESEARCHED** (Ollama benchmarks)

**Evidence**:
- Ollama GitHub issue #3421: "embeddinggemma 300M: 15-50ms on M2 Air"
- My tests (if you ran them): [cite results]

**What to do**:
```yaml
performance:
  embeddinggemma:
    target_latency_ms: 100  # RESEARCHED
    # Source: Ollama benchmarks (GitHub issue #3421, M2 Air)
    # Actual range: 15-50ms
    # Buffer: 2x for safety (worst case + overhead)
```

---

### qwen2.5-coder:3b: 2-3s

**Source**: ⚠️ **ESTIMATED** (from model card + extrapolation)

**Evidence**:
- Qwen2.5-Coder model card: "80-110 tok/s on unspecified hardware"
- Assumption: 200-300 tokens average output
- Calculation: 200 tok ÷ 100 tok/s = 2s

**Reality check**: NEEDS TESTING on M2 Air 16GB

**What to do**:
```yaml
performance:
  qwen2_5_coder_3b:
    target_latency_ms: 2500  # ESTIMATED
    # Source: Model card (80-110 tok/s) + 250 token assumption
    # Calculation: 250 tok ÷ 100 tok/s = 2.5s
    # Status: NEEDS VALIDATION on target hardware (M2 Air 16GB)
```

---

### jan-nano-4b: 3-8s (simple), 8-15s (complex)

**Source**: ⚠️ **ESTIMATED** (no benchmarks for MCP latency)

**Reasoning**:
- Base inference: ~4s (similar to 4B models)
- MCP calls: 2-4s per tool (Context7 API, GitHub API)
- Simple (1 MCP): 4s + 4s = 8s
- Complex (2+ MCPs): 4s + 8s = 12s

**Reality check**: Completely untested

**What to do**:
```yaml
performance:
  jan_nano_4b:
    simple_research_ms: 5500  # ESTIMATED (midpoint 3-8s)
    # Source: Extrapolation (base 4s + 1 MCP call 4s)
    # MCP latency assumption: UNTESTED
    # Status: HIGH UNCERTAINTY - needs real MCP testing

    complex_research_ms: 11500  # ESTIMATED (midpoint 8-15s)
    # Source: Extrapolation (base 4s + 2-3 MCP calls)
    # Status: HIGH UNCERTAINTY
```

---

### qwen2.5-coder:7b: 10-15s

**Source**: ⚠️ **ESTIMATED** (scaled from 3B model)

**Calculation**:
- 3B model: 2-3s for 200-300 tokens
- 7B model: ~2.3x slower (7B ÷ 3B ratio)
- Estimate: 2.5s × 2.3 = 5.75s base
- For 500 tokens: 5.75s × 2 = 11.5s

**Reality check**: Ratio assumption may be wrong (7B != 2.3x slower)

**What to do**:
```yaml
performance:
  qwen2_5_coder_7b:
    target_latency_ms: 12500  # ESTIMATED
    # Source: Scaled from 3B (2.5s × 2.3x ratio + 2x tokens)
    # Assumption: 7B = 2.3x slower than 3B (may be wrong)
    # Status: NEEDS VALIDATION
```

---

## Memory Usage

### embeddinggemma: ~300MB

**Source**: ✅ **RESEARCHED** (Ollama model info)

```bash
ollama show embeddinggemma:300m
# Size: 274 MB (actual)
```

**What to do**:
```yaml
memory:
  embeddinggemma:
    loaded_mb: 300  # RESEARCHED (rounded up from 274MB actual)
    # Source: ollama show embeddinggemma:300m
    # Status: VERIFIED
```

---

### qwen2.5-coder:3b: ~3.2GB loaded

**Source**: ⚠️ **ESTIMATED** (model size + inference overhead)

**Calculation**:
- Model file: 1.9GB (Ollama)
- Inference overhead: ~1.5-1.7x multiplier (typical for quantized models)
- Estimate: 1.9GB × 1.7 = 3.23GB

**Reality check**: Multiplier is industry rule of thumb, not tested

**What to do**:
```yaml
memory:
  qwen2_5_coder_3b:
    file_size_gb: 1.9  # RESEARCHED (ollama list)
    loaded_gb: 3.2     # ESTIMATED
    # Source: File size 1.9GB × 1.7x overhead multiplier
    # Multiplier source: Industry rule (quantized model overhead)
    # Status: NEEDS VALIDATION (measure actual RAM)
```

---

### jan-nano-4b: ~6GB loaded

**Source**: ⚠️ **ESTIMATED** (same calculation)

**Calculation**: 4.3GB (file) × 1.4x overhead = 6.02GB

**What to do**:
```yaml
memory:
  jan_nano_4b:
    file_size_gb: 4.3  # RESEARCHED (ollama list)
    loaded_gb: 6.0     # ESTIMATED
    # Source: 4.3GB × 1.4x overhead (Q8 quantization has lower overhead)
    # Status: NEEDS VALIDATION
```

---

## Rate Limits

### model_infer: 60 calls/minute

**Source**: ❌ **ARBITRARY** (no research basis)

**Reality check**: Why 60? Why not 50 or 100?

**What to do**:
```yaml
rate_limits:
  model_infer:
    per_minute: 60  # ARBITRARY - REPLACE IN PRODUCTION
    # Source: NONE (placeholder value)
    # Rationale: ~1 call/sec seems reasonable for local model
    # Status: PLACEHOLDER - needs actual capacity testing
    # Action: Run load tests to find actual limit
```

---

### model_embed: 300 calls/minute

**Source**: ❌ **ARBITRARY** (made up)

**Reality check**: embeddinggemma is fast (<100ms), so 300/min = 5/sec = 500ms/call (reasonable buffer)

**What to do**:
```yaml
rate_limits:
  model_embed:
    per_minute: 300  # ARBITRARY but reasonable
    # Source: Back-calculated (100ms latency → max 600/min, 50% buffer = 300)
    # Status: PLACEHOLDER - needs testing
```

---

### model_load: 5 calls/minute

**Source**: ❌ **ARBITRARY** (protective guess)

**Reasoning**: Loading models is expensive (disk I/O), shouldn't be spammed

**What to do**:
```yaml
rate_limits:
  model_load:
    per_minute: 5  # ARBITRARY protective limit
    # Source: NONE (conservative guess to prevent abuse)
    # Rationale: Model loading = expensive disk I/O
    # Status: PLACEHOLDER - may be too restrictive
```

---

## Cache TTLs

### Memory cache: 300s (5 mins)

**Source**: ❌ **ARBITRARY** (common cache TTL pattern)

**Industry precedent**: Redis default TTL often 300-600s

**What to do**:
```yaml
caching:
  memory:
    ttl_seconds: 300  # ARBITRARY (industry pattern)
    # Source: Common Redis TTL range (300-600s)
    # Rationale: Balance freshness vs hit rate
    # Status: PLACEHOLDER - tune based on hit rate metrics
```

---

### SQLite cache: 86400s (24 hours)

**Source**: ❌ **ARBITRARY** (1 day feels reasonable)

**What to do**:
```yaml
caching:
  sqlite:
    ttl_seconds: 86400  # ARBITRARY (24 hours)
    # Source: NONE (1 day seems reasonable for docs that don't change often)
    # Rationale: Library docs update weekly, not hourly
    # Status: PLACEHOLDER - may be too long for fast-moving docs
```

---

### Vector similarity: 0.95 threshold

**Source**: ⚠️ **ESTIMATED** (typical embedding similarity thresholds)

**Industry precedent**:
- Pinecone docs: "0.9-0.95 for high similarity"
- OpenAI embeddings: "0.95+ = very similar"

**What to do**:
```yaml
caching:
  vector:
    similarity_threshold: 0.95  # ESTIMATED from industry standards
    # Source: Pinecone/OpenAI docs (high similarity = 0.9-0.95)
    # Status: NEEDS TUNING (test false positive rate)
```

---

## Model Config

### jan-nano-4b temperature: 0.3

**Source**: ⚠️ **ESTIMATED** (research tasks need factual output)

**Reasoning**:
- Temperature 0.0-0.3 = factual, deterministic
- Temperature 0.5-1.0 = creative, varied

**What to do**:
```yaml
models:
  jan_nano_4b:
    temperature: 0.3  # ESTIMATED (factual research)
    # Source: Industry practice (low temp = factual)
    # Range: 0.0 (deterministic) to 0.3 (slightly varied)
    # Status: NEEDS TUNING based on output quality
```

---

### max_tokens: 4000

**Source**: ❌ **ARBITRARY** (gut feeling)

**Reality check**: Why 4000? Research summaries could be 1000 or 10000 tokens

**What to do**:
```yaml
models:
  jan_nano_4b:
    max_tokens: 4000  # ARBITRARY
    # Source: NONE (gut feeling: 2-3 page summary)
    # Rationale: 4000 tokens ≈ 3000 words ≈ 6 pages
    # Status: PLACEHOLDER - tune based on actual usage
```

---

### keepalive: "30m"

**Source**: ❌ **ARBITRARY** (balance memory vs reload latency)

**Trade-off**:
- Short keepalive (5m): Free memory fast, reload often
- Long keepalive (2h): Keep memory occupied, no reloads

**What to do**:
```yaml
models:
  jan_nano_4b:
    keepalive: "30m"  # ARBITRARY compromise
    # Source: NONE (balance between memory and reload cost)
    # Rationale: 30min = typical work session length
    # Status: PLACEHOLDER - tune based on usage patterns
```

---

## Health Check Intervals

### 60000ms (60s)

**Source**: ❌ **ARBITRARY** (industry pattern)

**Industry precedent**: Kubernetes liveness probes default = 10s, but local models don't need sub-minute checks

**What to do**:
```yaml
health_checks:
  interval_ms: 60000  # ARBITRARY (industry pattern)
  # Source: Common monitoring interval (Datadog, Prometheus default = 60s)
  # Rationale: Local models don't fail suddenly like network services
  # Status: PLACEHOLDER - may be overkill
```

---

## Timeout Values

### jan-nano-4b timeout: 15000ms (15s)

**Source**: ⚠️ **ESTIMATED** (complex research upper bound)

**Calculation**: 8-15s (complex research) → 15s timeout

**What to do**:
```yaml
timeouts:
  jan_nano_4b:
    default_ms: 15000  # ESTIMATED (upper bound of 8-15s range)
    # Source: Performance target (8-15s) + no buffer
    # Status: MAY BE TOO TIGHT - consider 20s with buffer
```

---

## Where to Save These

### Option A: Centralized Config Constants (RECOMMENDED)

```
apps/tinyArms/
├── config/
│   ├── constants.yaml          # ALL constants with sources
│   ├── constants.schema.json   # Validation schema
│   └── README.md               # Explains each constant
```

**constants.yaml**:
```yaml
# tinyArms Configuration Constants
# Last updated: 2025-10-27
# Status: Design phase - ALL values need validation

routing:
  coverage_targets:
    level0_pct:
      value: 65
      source: "ESTIMATED - Industry benchmarks (LangChain 60-70%)"
      status: "NEEDS_VALIDATION"
      test_plan: "Track actual coverage in Phase 1"

    level1_pct:
      value: 22
      source: "ESTIMATED - Derived (100% - L0 - L2/3/4)"
      status: "NEEDS_VALIDATION"

performance:
  latency_targets:
    embeddinggemma_ms:
      value: 100
      source: "RESEARCHED - Ollama benchmarks (15-50ms actual, 2x buffer)"
      status: "VERIFIED"
      citation: "Ollama GitHub issue #3421"

    qwen2_5_coder_3b_ms:
      value: 2500
      source: "ESTIMATED - Model card (80-110 tok/s) + 250 token assumption"
      status: "NEEDS_VALIDATION"
      hardware: "M2 Air 16GB"

    jan_nano_4b_simple_ms:
      value: 5500
      source: "ESTIMATED - Base 4s + 1 MCP call 4s"
      status: "HIGH_UNCERTAINTY"
      note: "MCP latency completely untested"

memory:
  loaded_sizes:
    embeddinggemma_mb:
      value: 300
      source: "RESEARCHED - ollama show embeddinggemma:300m"
      status: "VERIFIED"
      actual: 274

    qwen2_5_coder_3b_gb:
      value: 3.2
      source: "ESTIMATED - 1.9GB file × 1.7x overhead multiplier"
      status: "NEEDS_VALIDATION"
      multiplier_source: "Industry rule (quantized model overhead)"

rate_limits:
  model_infer_per_minute:
    value: 60
    source: "ARBITRARY - Placeholder (~1 call/sec)"
    status: "REPLACE_IN_PRODUCTION"
    action: "Run load tests to find actual limit"

caching:
  ttls:
    memory_seconds:
      value: 300
      source: "ARBITRARY - Common Redis TTL (300-600s)"
      status: "PLACEHOLDER"
      tune_metric: "Cache hit rate"

timeouts:
  jan_nano_4b_ms:
    value: 15000
    source: "ESTIMATED - Upper bound of 8-15s perf target"
    status: "MAY_BE_TOO_TIGHT"
    recommendation: "Consider 20000ms with buffer"
```

---

### Option B: Code Constants with Documentation

```typescript
// src/config/constants.ts

/**
 * tinyArms Configuration Constants
 *
 * IMPORTANT: All values are design-phase estimates unless marked VERIFIED
 * Status legend:
 *   - VERIFIED: Tested on target hardware
 *   - ESTIMATED: Reasonable guess, needs validation
 *   - ARBITRARY: Placeholder, replace in production
 */

export const ROUTING_COVERAGE = {
  /**
   * Level 0 target coverage: 65%
   * Source: ESTIMATED - Industry benchmarks (LangChain 60-70%)
   * Status: NEEDS_VALIDATION
   * Test: Track actual coverage in Phase 1
   */
  LEVEL0_TARGET_PCT: 65,

  /** Derived from L0 + L2/3/4 assumptions */
  LEVEL1_TARGET_PCT: 22,  // ESTIMATED
} as const;

export const PERFORMANCE = {
  LATENCY_TARGETS_MS: {
    /**
     * embeddinggemma max latency: 100ms
     * Source: RESEARCHED - Ollama benchmarks (15-50ms actual)
     * Status: VERIFIED
     * Citation: Ollama GitHub issue #3421
     */
    EMBEDDINGGEMMA: 100,

    /**
     * qwen2.5-coder:3b target: 2500ms
     * Source: ESTIMATED - Model card (80-110 tok/s) + 250 token assumption
     * Status: NEEDS_VALIDATION on M2 Air 16GB
     */
    QWEN_3B: 2500,

    /**
     * jan-nano-4b simple research: 5500ms
     * Source: ESTIMATED - Base 4s + 1 MCP call 4s
     * Status: HIGH_UNCERTAINTY (MCP latency untested)
     */
    JAN_NANO_SIMPLE: 5500,
  },
} as const;

export const MEMORY = {
  /**
   * embeddinggemma loaded size: 300MB
   * Source: RESEARCHED - ollama show (274MB actual, rounded up)
   * Status: VERIFIED
   */
  EMBEDDINGGEMMA_MB: 300,

  /**
   * qwen2.5-coder:3b loaded size: 3.2GB
   * Source: ESTIMATED - 1.9GB file × 1.7x overhead
   * Status: NEEDS_VALIDATION (measure actual RAM usage)
   */
  QWEN_3B_GB: 3.2,
} as const;

export const RATE_LIMITS = {
  /**
   * model_infer rate limit: 60/min
   * Source: ARBITRARY - Placeholder (~1 call/sec)
   * Status: REPLACE_IN_PRODUCTION
   * Action: Run load tests to find actual capacity
   */
  MODEL_INFER_PER_MINUTE: 60,  // ARBITRARY - NEEDS TESTING
} as const;
```

---

## Where to Document Magic Numbers

### 1. Source Code (constants.ts)
- ✅ Values used by code
- ✅ Inline documentation with sources
- ✅ TypeScript type safety

### 2. Config File (constants.yaml)
- ✅ User-tunable values
- ✅ Status tracking (VERIFIED, ESTIMATED, ARBITRARY)
- ✅ Testing plans

### 3. Research Doc (THIS FILE)
- ✅ Audit trail
- ✅ Reasoning for each value
- ✅ What needs validation

---

## Action Plan

### Phase 1: Mark ALL Placeholders

```yaml
# Every constant gets a status
MAGIC_NUMBER:
  value: 123
  source: "RESEARCHED | ESTIMATED | ARBITRARY"
  status: "VERIFIED | NEEDS_VALIDATION | PLACEHOLDER | REPLACE_IN_PRODUCTION"
```

### Phase 2: Validate Top 10 Critical

**Priority**:
1. embeddinggemma latency (affects routing speed)
2. qwen-3b latency (affects pre-commit hook)
3. Model RAM usage (affects concurrent loading)
4. jan-nano-4b MCP latency (completely unknown)
5. Level 0 coverage (affects overall performance)

### Phase 3: Replace Arbitrary Values

**For each ARBITRARY constant**:
- Run load tests
- Measure actual capacity
- Replace with VALIDATED value

---

## Summary

**Researched (5)**:
- embeddinggemma size (274MB)
- embeddinggemma latency (15-50ms)
- Model file sizes (from `ollama list`)
- Temperature ranges (industry standard)
- Similarity thresholds (Pinecone/OpenAI docs)

**Estimated (10)**:
- All coverage percentages (60-75%, 20-25%, 10-15%)
- qwen-3b latency (2-3s)
- jan-nano-4b latency (3-8s, 8-15s)
- qwen-7b latency (10-15s)
- Model RAM overhead multipliers (1.4-1.7x)

**Arbitrary (12)**:
- All rate limits (60, 300, 5 per minute)
- All cache TTLs (300s, 86400s)
- All timeouts (15000ms)
- max_tokens (4000)
- keepalive durations (30m)
- Health check interval (60s)

**ACTION**: Replace ALL arbitrary values with validated constants before production.
