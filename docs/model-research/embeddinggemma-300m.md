# EmbeddingGemma-300M: Proven Strengths & Weaknesses

**Research Date**: 2025-10-28
**Source**: Google AI Model Card, Hugging Face (model page + blog), MTEB Leaderboard, Ollama Registry
**Status**: Production ready (selected as Level 1)

---

## Executive Summary

**EmbeddingGemma-300M is the SEMANTIC ROUTING model for tinyArms** - highest-ranking open multilingual text embedding model under 500M parameters on MTEB benchmark (61.15 multilingual, 69.67 English). **CRITICAL: This is an ENCODER-ONLY model** (BERT-style) that produces vector embeddings, NOT a generative LLM. Cannot produce text, only 768-dimensional vectors for semantic similarity, classification, and retrieval. Supports 100+ languages including Hungarian and Vietnamese. Memory-efficient (<200MB RAM with quantization), designed for on-device AI.

**Selected for tinyArms**: Fast semantic routing (Level 1), file classification, intent extraction, constitutional principle matching.

---

## Model Variants

| Model | Params | Size | Context | Output Dimensions | License |
|-------|--------|------|---------|-------------------|---------|
| **EmbeddingGemma-300M** | **308M** | **622MB (BF16)** | **2048 tokens** | **768 (truncatable to 512/256/128)** | **Gemma ToU** |

**Architecture**: Encoder-only transformer based on Gemma 3 with T5Gemma initialization
**Training Data**: ~320B tokens (web documents, code, technical docs, synthetic task-specific data)
**Supported Languages**: 100+ spoken languages
**Quantization**: Supports QAT (Quantization-Aware Training) for <200MB RAM usage
**Matryoshka Representation Learning**: Single model produces multiple embedding sizes (768d, 512d, 256d, 128d)

**License**: Gemma Terms of Use (research + commercial use allowed)
**Source**: https://ai.google.dev/gemma/docs/embeddinggemma/model_card

---

## Proven Strength #1: MTEB Benchmark Performance

### Verified Scores (Full Precision, 768d)

| Benchmark | Mean (Task) | Mean (TaskType) | Source |
|-----------|-------------|-----------------|--------|
| **Multilingual v2** | **61.15** | **54.31** | [Model Card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card) |
| **English v2** | **69.67** | **65.11** | [Model Card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card) |
| **Code v1** | **68.76** | **68.76** | [Model Card](https://ai.google.dev/gemma/docs/embeddinggemma/model_card) |

**Ranking**: "Highest-ranking open multilingual text embedding model under 500M on the Massive Text Embedding Benchmark (MTEB)" at release (September 2025)
**Source**: [Google Developers Blog](https://developers.googleblog.com/en/introducing-embeddinggemma/)

### Matryoshka Representation Learning (MRL) Performance

**768d vs Smaller Dimensions** (Multilingual v2):

| Dimension | Mean Task | Mean TaskType | Quality vs 768d |
|-----------|-----------|---------------|-----------------|
| 768d | 61.15 | 54.31 | 100% |
| 512d | 60.71 | 53.89 | 99.3% |
| 256d | 59.68 | 53.01 | 97.6% |
| 128d | 58.23 | 51.77 | 95.2% |

**Trade-off**: Lower dimensions = faster storage/search, minimal quality loss
**Source**: [Model Card - Table 4](https://ai.google.dev/gemma/docs/embeddinggemma/model_card)

### What This Means

**Best quality under 500MB in multilingual setting**

**Why it matters for tinyArms**:
- **Semantic routing**: High MTEB = accurate task classification (routes to correct Level)
- **Multilingual NQH monorepo**: English, Hungarian, Vietnamese all supported
- **Code embeddings**: 68.76 Code v1 score validates code similarity detection
- **Intent extraction**: Classification task performance ensures accurate routing decisions

**tinyArms Use Cases**:
- File type classification (design, screenshot, code, docs)
- Intent extraction ("fix bug" vs "add feature" vs "refactor")
- Constitutional principle matching (which of 17 principles applies?)
- Semantic similarity search (find similar code violations)

**Confidence**: HIGH - MTEB is industry-standard embedding benchmark, official scores from Google

---

## Proven Strength #2: Memory Efficiency

### Resource Usage

| Metric | Value | Source |
|--------|-------|--------|
| Model size (disk) | 622MB (BF16 full precision) | [Ollama](https://ollama.com/library/embeddinggemma:300m) |
| Quantized size | <200MB (QAT) | [Google Blog](https://developers.googleblog.com/en/introducing-embeddinggemma/) |
| Parameters | 308M (100M model + 200M embedding) | [HF Model Card](https://huggingface.co/google/embeddinggemma-300m) |
| Context window | 2048 tokens | [Ollama](https://ollama.com/library/embeddinggemma:300m) |
| Batch size | 2048 | [Ollama](https://ollama.com/library/embeddinggemma:300m) |

**Official claim**: "Small enough to run on less than 200MB of RAM with quantization"
**Source**: [Google Developers Blog](https://developers.googleblog.com/en/introducing-embeddinggemma/)

### What This Means

**Sub-200MB = 8-16GB RAM friendly**

**Why it matters for tinyArms**:
- Runs alongside Level 2 models (Qwen-3B: ~2GB loaded)
- Total stack: <200MB (Level 1) + 2GB (Level 2) = 2.2GB (leaves 13.8GB free on 16GB Mac)
- Can run 24/7 as daemon (low overhead)
- Fits on mobile devices (iPhone, iPad)

**Confidence**: HIGH - Official Google claim with QAT quantization

---

## Proven Strength #3: Inference Speed

### EdgeTPU Performance (Official Benchmark)

| Hardware | Input Tokens | Latency | Source |
|----------|--------------|---------|--------|
| EdgeTPU | 256 tokens | <15ms | [Google Blog](https://developers.googleblog.com/en/introducing-embeddinggemma/) |

**Official claim**: "Less than 15ms embedding inference time (256 input tokens) on EdgeTPU"
**Source**: [Google Developers Blog](https://developers.googleblog.com/en/introducing-embeddinggemma/)

### M2 MacBook Air Performance

**Status**: ❌ NO verified benchmark found

**Searched sources**:
- Ollama GitHub issues (no M2-specific data)
- Hugging Face discussions (no M2 benchmarks)
- Reddit/HN (no community benchmarks)

**Known performance issue**: [GitHub Issue #12239](https://github.com/ollama/ollama/issues/12239) reports EmbeddingGemma is "slow" compared to bge-m3 on GPU (9.79s vs 6.77s batched, RTX 4090), but NOT specific to M2 Air.

**Estimated M2 Air performance**: 50-100ms per embedding (extrapolated from EdgeTPU, needs validation)

**Confidence**: LOW - NO published M2 Air benchmarks, needs empirical testing

---

## Proven Strength #4: Multilingual Support

### Language Coverage

**Officially supported**: 100+ spoken languages
**Training data**: ~320B tokens from diverse sources including 100+ languages
**Source**: [HF Model Card](https://huggingface.co/google/embeddinggemma-300m)

### MTEB Multilingual Performance

**Multilingual v2 benchmark**: 61.15 mean task score (54.31 mean tasktype)
**English v2 benchmark**: 69.67 mean task score (65.11 mean tasktype)
**Code v1 benchmark**: 68.76 mean task score

**Languages verified for tinyArms**:
- ✅ English (primary) - 69.67 MTEB English v2
- ✅ Hungarian (NQH requirement) - covered in 100+ languages claim
- ✅ Vietnamese (NQH requirement) - covered in 100+ languages claim
- ✅ Code (TypeScript, Go, Python) - 68.76 MTEB Code v1

**Confidence**: MEDIUM - Official support claimed, MTEB multilingual score verified, but NO language-specific breakdowns published

---

## Proven Strength #5: Domain Fine-tuning Capability

### Medical Domain Fine-tuning (MIRIAD Dataset)

| Model | Parameters | NDCG@10 | Source |
|-------|-----------|---------|--------|
| Base EmbeddingGemma | 268M | 0.8340 | [HF Blog](https://huggingface.co/blog/embeddinggemma) |
| **Fine-tuned EmbeddingGemma** | 268M | **0.8862** | [HF Blog](https://huggingface.co/blog/embeddinggemma) |
| Qwen3-Embedding-0.6B | 596M | 0.8493 | [HF Blog](https://huggingface.co/blog/embeddinggemma) |

**Improvement**: +0.0522 NDCG@10 (6.2% gain)
**Beats larger model**: Fine-tuned 268M beats Qwen3 596M by 4.3%

### What This Means

**Domain-specific fine-tuning yields measurable improvements**

**Why it matters for tinyArms**:
- Future fine-tuning for code violation embeddings (constitutional principles)
- Task-specific optimization (routing accuracy)
- Proof that model can adapt to specialized domains

**Confidence**: HIGH - Published benchmark on standard medical retrieval dataset

---

## What EmbeddingGemma CANNOT Do

### Critical Limitation: ENCODER-ONLY (NOT Generative)

**❌ NOT a generative model** (cannot produce text):
- ❌ Can't write code
- ❌ Can't explain violations
- ❌ Can't generate suggestions
- ❌ Can't answer questions
- ❌ Can't rewrite files

**Architecture**: Encoder-only transformer (like BERT), NOT decoder (like GPT/Llama)

**Example**:
```javascript
// ❌ WRONG: This will fail
const response = await embedModel.generate("Write a function to...");
// Error: Model only produces embeddings, not text

// ✅ CORRECT: This works
const embedding = await embedModel.embed("Write a function to...");
const similar = findSimilar(embedding, database);
// Returns: 768-dimensional vector [0.123, -0.456, ...]
```

**Use Cases It CANNOT Handle**:
- Code linting (needs Level 2: Qwen-3B)
- File renaming (needs generative model)
- Explanation generation (needs LLM)
- Complex reasoning (needs Level 2/3)

**What It CAN Handle**:
- ✅ Semantic routing (find intent, route to correct Level)
- ✅ Similarity search (find similar documents/violations)
- ✅ Classification (file type, task type)
- ✅ Clustering (group similar tasks)

---

## Critical Gaps & Unknowns

### 1. M2 MacBook Air Speed Benchmarks (HIGH PRIORITY)

**Missing**:
- ❌ Latency per embedding (single, batch)
- ❌ Cold start time (first embedding after model load)
- ❌ Memory usage (actual loaded footprint)
- ❌ P50/P95/P99 latency percentiles

**Impact**: HIGH - Speed determines if <100ms routing target is achievable

**Known**: <15ms on EdgeTPU (official), performance issue on RTX 4090 (GitHub #12239)

**Validation needed**: Benchmark on M2 Air 16GB (target: <100ms P95)

**Confidence**: LOW - NO published M2 Air data

---

### 2. Hungarian/Vietnamese Embedding Quality (MEDIUM PRIORITY)

**Missing**:
- ❌ MTEB scores per language (only multilingual aggregate provided)
- ❌ Hungarian similarity accuracy
- ❌ Vietnamese similarity accuracy
- ❌ Code + Hungarian comments handling
- ❌ Mixed language performance (EN + HU + VN)

**Impact**: MEDIUM - Affects NQH monorepo multilingual support

**Known**: 100+ languages claim (official), 61.15 MTEB Multilingual v2 (aggregate)

**Validation needed**: Test embedding quality for Hungarian/Vietnamese text pairs

**Confidence**: MEDIUM - Official multilingual support claimed, MTEB multilingual score verified, but no language-specific breakdowns

---

### 3. Code Embedding Quality Benchmarks (MEDIUM PRIORITY)

**Missing**:
- ❌ CodeSearchNet benchmark scores
- ❌ Language-specific performance (TS vs Go vs Python)
- ❌ Code similarity accuracy (duplicate detection)
- ❌ Syntax vs semantic understanding

**Impact**: MEDIUM - Affects semantic routing for code files

**Known**: 68.76 MTEB Code v1 (verified), trained on code + technical docs

**Validation needed**: Test code similarity detection on TypeScript/Go files

**Confidence**: MEDIUM - MTEB Code v1 score verified, but no language-specific breakdowns

---

### 4. Similarity Threshold Calibration (HIGH PRIORITY)

**Missing**:
- ❌ Optimal threshold for routing decisions (currently arbitrary)
- ❌ False positive rate at different thresholds (0.6, 0.7, 0.75, 0.8, 0.85)
- ❌ False negative rate at different thresholds
- ❌ Routing accuracy by task type

**Impact**: HIGH - Incorrect routing = poor user experience (misclassified tasks)

**Current setting**: 0.75 similarity threshold (arbitrary, needs tuning)

**Validation needed**: Test routing accuracy on 50+ labeled tasks at different thresholds

**Confidence**: LOW - No published guidance on optimal thresholds

---

### 5. Quantization Quality Degradation (LOW PRIORITY)

**Missing**:
- ❌ MTEB scores for Q8_0 and Q4_0 quantization
- ❌ Speed improvement from quantization
- ❌ Ollama quantization format (BF16 vs Q8 vs Q4)

**Impact**: LOW - BF16 (622MB) already small enough for tinyArms

**Known**: QAT supports mixed precision, Q8_0, Q4_0 with "minimal performance degradation" (Model Card mentions but no specific scores)

**Validation needed**: Test quantized models if 622MB is too large

**Confidence**: MEDIUM - QAT mentioned in Model Card, but no detailed quantization benchmark table

---

## Comparison: EmbeddingGemma vs Alternatives

### vs nomic-embed-text (DIFFERENT MODEL)

**CRITICAL CLARIFICATION**: EmbeddingGemma and nomic-embed-text are DIFFERENT models.

**Proof**:
- EmbeddingGemma: 308M params, 622MB (Ollama: `embeddinggemma:300m`)
- nomic-embed-text: 137M params, 274MB (Ollama: `nomic-embed-text`)
- Different developers: Google (EmbeddingGemma) vs Nomic AI (nomic-embed-text)
- Different architectures: Gemma 3-based vs custom Nomic architecture

**Sources**:
- EmbeddingGemma: https://ollama.com/library/embeddinggemma:300m
- nomic-embed-text: https://ollama.com/library/nomic-embed-text

**User's initial claim was INCORRECT**: They are NOT the same model aliased differently.

### vs nomic-embed-text (Performance Comparison)

| Metric | EmbeddingGemma-300M | nomic-embed-text v1.5 | Winner |
|--------|---------------------|----------------------|--------|
| Parameters | 308M | 137M | EmbeddingGemma (larger) |
| Size | 622MB | 274MB | nomic (smaller) |
| MTEB Multilingual | **61.15** | ❌ (English-focused) | **EmbeddingGemma** |
| MTEB English | 69.67 | ❌ (not on leaderboard top 100) | Likely EmbeddingGemma |
| Context window | 2048 tokens | **2K tokens** | Tie |
| Multilingual | **100+ languages** | Limited | **EmbeddingGemma** |
| Speed (claimed) | <15ms (EdgeTPU) | ❌ | Unknown |

**nomic-embed-text claim**: "Surpasses OpenAI text-embedding-ada-002 and text-embedding-3-small"
**Source**: [Ollama Registry](https://ollama.com/library/nomic-embed-text)

**Decision**: EmbeddingGemma selected for tinyArms (multilingual requirement)

---

### vs MiniLM Models (English-Only)

| Metric | EmbeddingGemma-300M | MiniLM-L6-v2 | Winner |
|--------|---------------------|--------------|--------|
| Size | 622MB | ~80MB | MiniLM |
| MTEB English | **69.67** | ~58.2 | **EmbeddingGemma** |
| MTEB Multilingual | **61.15** | ❌ (English only) | **EmbeddingGemma** |
| Hungarian/Vietnamese | **Supported** | ❌ | **EmbeddingGemma** |
| Context window | 2048 tokens | 512 tokens | **EmbeddingGemma** |

**Decision**: EmbeddingGemma wins (multilingual requirement, longer context)

---

### vs all-mpnet-base-v2 (Higher Quality, English-Only)

| Metric | EmbeddingGemma-300M | all-mpnet-base-v2 | Winner |
|--------|---------------------|-------------------|--------|
| Size | 622MB | ~420MB | mpnet |
| MTEB English | 69.67 | ~69.6 | Tie |
| MTEB Multilingual | **61.15** | ❌ (English only) | **EmbeddingGemma** |
| Hungarian/Vietnamese | **Supported** | ❌ | **EmbeddingGemma** |

**Trade-off**: Comparable English quality, but EmbeddingGemma adds multilingual

**Decision**: EmbeddingGemma wins (multilingual requirement)

---

## Why EmbeddingGemma-300M Was Selected for tinyArms

**Rationale** (from model selection process):

1. ✅ **Best multilingual quality under 500M** (61.15 MTEB Multilingual v2)
2. ✅ **Strong English performance** (69.67 MTEB English v2)
3. ✅ **Code embedding support** (68.76 MTEB Code v1)
4. ✅ **100+ languages** (Hungarian, Vietnamese covered)
5. ✅ **Memory-efficient** (622MB disk, <200MB RAM quantized)
6. ✅ **Ollama support** (production-ready, `ollama pull embeddinggemma:300m`)
7. ✅ **Open license** (Gemma Terms of Use, commercial allowed)

**Use Cases in tinyArms**:
- **Level 1 semantic routing** (classify task intent, route to correct level)
- **File type classification** (screenshot, code, design, docs)
- **Constitutional principle matching** (which of 17 principles applies?)
- **Intent extraction** ("fix bug" vs "add feature" vs "refactor")

**What it doesn't do**:
- ❌ Text generation (needs Level 2: Qwen-3B)
- ❌ Code linting (needs Level 2: Qwen-3B)
- ❌ Complex reasoning (needs Level 2/3)

---

## Recommendation for tinyArms

### Current Status: PRODUCTION READY ✅ (with validation requirements)

**Stack Position**: Level 1 (semantic routing)

**Routing Logic**:
```javascript
// Level 0: Rules (instant, regex-based)
if (isSimplePattern(task)) return handleWithRules(task);

// Level 1: Semantic routing (target: <100ms)
const embedding = await embedModel.embed(task.description);
const intent = classifyIntent(embedding);

if (intent.confidence > THRESHOLD) {
  // High confidence - route directly
  return routeToLevel(intent.level);
} else {
  // Low confidence - escalate to Level 2
  return routeToLevel(2);
}

// Level 2: LLM (2-3s, Qwen-3B)
const result = await llmModel.analyze(task);
```

**Performance Target**: <100ms latency (needs M2 Air validation)

---

### Option A: Keep as Level 1 (RECOMMENDED, REQUIRES VALIDATION)

**Rationale**:
- ✅ Proven 61.15 MTEB Multilingual (best under 500M)
- ✅ Proven 69.67 MTEB English (comparable to larger models)
- ✅ Proven 68.76 MTEB Code (validates code embeddings)
- ✅ 100+ languages (Hungarian, Vietnamese covered)
- ✅ Ollama support confirmed (`ollama pull embeddinggemma:300m`)
- ✅ 622MB disk, <200MB RAM quantized (8-16GB RAM friendly)
- ⚠️ NO M2 Air speed benchmarks (needs validation)

**Validation requirements**:
1. **M2 Air speed benchmark** (target: <100ms P95) - HIGH PRIORITY
2. **Similarity threshold tuning** (test 0.6-0.85) - HIGH PRIORITY
3. **Hungarian/Vietnamese quality** (test embeddings) - MEDIUM PRIORITY
4. **Code similarity accuracy** (test TypeScript/Go) - MEDIUM PRIORITY

**Trade-off**: Best quality proven, but speed unverified on target hardware

---

### Option B: Switch to nomic-embed-text (NOT RECOMMENDED)

**Alternative**: nomic-embed-text v1.5 (137M params, 274MB)

**Rationale**:
- ✅ Smaller (274MB vs 622MB)
- ✅ Claims to beat OpenAI ada-002
- ❌ NO MTEB multilingual scores published
- ❌ English-focused (limited multilingual support)
- ❌ NO Hungarian/Vietnamese verification
- ❌ NO MTEB leaderboard presence (not in top 100)

**Decision**: Don't switch - EmbeddingGemma has proven multilingual MTEB scores

---

### Option C: Hybrid Stack (NOT RECOMMENDED, COMPLEX)

**Idea**: Use different embedding models per language
- English: nomic-embed-text (smaller)
- Multilingual: EmbeddingGemma-300M

**Rationale**:
- ✅ Optimizes size for English-only tasks
- ❌ Complexity (2 models, language detection)
- ❌ Memory overhead (both models loaded)
- ❌ Maintenance burden (2 models to update)

**Decision**: Don't implement - complexity outweighs 348MB savings

---

## Validation Test Plan

### Phase 1: Installation Verification (1 day)

**Steps**:
```bash
# Install via Ollama
ollama pull embeddinggemma:300m

# Verify model
ollama list | grep embeddinggemma

# Test embedding
ollama embeddings -m embeddinggemma:300m -p "This is a test sentence"

# Expected: 768-dimensional vector (JSON array)
```

**Success criteria**: Model downloads, produces 768-dimensional embeddings

---

### Phase 2: M2 Air Speed Benchmarking (2 days)

**Test cases**:
- Single embedding: 10 samples (cold start + warm)
- Batch embeddings: 10, 50, 100 items
- Long text: 256 tokens, 512 tokens, 1024 tokens, 2048 tokens

**Metrics**:
- Average latency (target: <100ms)
- P50, P95, P99 latency
- Cold start time (first embedding after model load)
- Throughput (embeddings per second)

**Hardware**: M2 MacBook Air 16GB

**Success criteria**: P95 < 100ms for 256-token inputs

---

### Phase 3: Similarity Threshold Tuning (3 days)

**Test cases**:
- 50 tasks with known correct routing (manually labeled)
- Test thresholds: 0.6, 0.7, 0.75, 0.8, 0.85

**Metrics**:
- False positive rate (incorrectly routed to Level 2)
- False negative rate (incorrectly routed to rules)
- Overall routing accuracy

**Success criteria**: >90% routing accuracy at optimal threshold

---

### Phase 4: Multilingual Quality Testing (3 days)

**Test cases**:
- Hungarian text pairs: 10 similar, 10 dissimilar
- Vietnamese text pairs: 10 similar, 10 dissimilar
- Mixed EN + HU: 10 pairs
- Code + Hungarian comments: 10 samples

**Metrics**:
- Cosine similarity scores
- True positive rate (similar pairs)
- True negative rate (dissimilar pairs)

**Success criteria**: >0.75 similarity for true matches, <0.65 for non-matches

---

### Phase 5: Code Embedding Quality (2 days)

**Test cases**:
- TypeScript code similarity: 10 similar functions, 10 different
- Go code similarity: 10 similar functions, 10 different
- Cross-language: TS vs Go (should be low similarity)

**Metrics**:
- Code similarity accuracy
- Language-specific performance

**Success criteria**: >0.7 similarity for similar functions, <0.5 for different functions

---

**Total timeline**: 11 days
**Resources**: M2 Air 16GB, labeled test dataset

---

## Installation

```bash
# Via Ollama (recommended)
ollama pull embeddinggemma:300m

# Verify installation
ollama list | grep embeddinggemma
# Expected: embeddinggemma:300m    622MB

# Test embedding
ollama embeddings -m embeddinggemma:300m -p "This is a test sentence"

# Expected: {"embeddings": [[0.123, -0.456, ...]]}  (768 dimensions)
```

**Requires**: Ollama v0.11.10 or later
**Storage**: 622MB download (BF16 full precision)
**Memory**: Estimated 800-1000MB loaded (needs validation)

---

## Configuration

**tinyArms config** (`config/default.yaml`):

```yaml
models:
  level1: embeddinggemma:300m  # NOT nomic-embed-text (different model)

routing:
  similarity_threshold: 0.75  # Needs tuning (Phase 3 validation)
  confidence_levels:
    high: 0.85    # Route directly
    medium: 0.75  # Route with caution
    low: 0.60     # Escalate to Level 2

embedding:
  dimensions: 768  # Can truncate to 512, 256, 128 (MRL)
  batch_size: 10
  timeout_ms: 100  # Needs M2 Air validation
  cache_ttl: 3600  # 1 hour cache
```

**Performance constants** (`config/constants.yaml`):

```yaml
performance:
  latency_targets_ms:
    embeddinggemma:
      value: 100
      source: "ESTIMATED - Extrapolated from EdgeTPU <15ms (official)"
      status: "UNVERIFIED - Needs M2 Air benchmark"
      actual_range: null  # TBD after Phase 2
      buffer_multiplier: 2.0
      citation: "https://developers.googleblog.com/en/introducing-embeddinggemma/"
```

---

## Usage Example

```typescript
import ollama from 'ollama';

// Single embedding
const result = await ollama.embeddings({
  model: 'embeddinggemma:300m',
  prompt: 'Find hardcoded colors in this file'
});

// Result: { embeddings: [[0.123, -0.456, ...]] } (768 dimensions)
const embedding = result.embeddings[0];

// Batch embeddings
const tasks = ['task 1', 'task 2', 'task 3'];
const embeddings = await Promise.all(
  tasks.map(task =>
    ollama.embeddings({ model: 'embeddinggemma:300m', prompt: task })
  )
);

// Similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}

const similarity = cosineSimilarity(embedding1, embedding2);
if (similarity > 0.75) {
  console.log('Tasks are similar - route to same handler');
}
```

**IMPORTANT**: EmbeddingGemma does NOT support `float16`. Use `float32` or `bfloat16` only.
**Source**: [HF Model Card](https://huggingface.co/google/embeddinggemma-300m)

---

## References

**Primary Sources**:
- **Model Card**: https://ai.google.dev/gemma/docs/embeddinggemma/model_card
- **Google Developers Blog**: https://developers.googleblog.com/en/introducing-embeddinggemma/
- **Hugging Face Model Page**: https://huggingface.co/google/embeddinggemma-300m
- **Hugging Face Blog**: https://huggingface.co/blog/embeddinggemma
- **Ollama Registry**: https://ollama.com/library/embeddinggemma:300m

**Benchmarks**:
- **MTEB Leaderboard**: https://huggingface.co/spaces/mteb/leaderboard
- **MIRIAD Medical Dataset**: Fine-tuning results in HF Blog

**Known Issues**:
- **Performance issue**: [Ollama GitHub #12239](https://github.com/ollama/ollama/issues/12239) (slow on RTX 4090, not M2-specific)
- **VRAM management**: [Ollama GitHub #12247](https://github.com/ollama/ollama/issues/12247) (unloads other models)

**License**: Gemma Terms of Use (research + commercial use allowed)
**Distribution**: Ollama (`embeddinggemma:300m`), Hugging Face, LM Studio

---

## Key Corrections from Previous Version

**INCORRECT CLAIMS CORRECTED**:
1. ❌ MTEB score 68.4 → ✅ 61.15 (Multilingual v2) / 69.67 (English v2)
2. ❌ "nomic-embed-text is EmbeddingGemma alias" → ✅ DIFFERENT models (137M vs 308M)
3. ❌ "<15ms on M2 Air" → ✅ <15ms on EdgeTPU ONLY, M2 Air UNVERIFIED
4. ❌ "Ollama GitHub issue #3421" → ✅ NO such issue found (fabricated citation)
5. ❌ "Verified on M2 Air by community" → ✅ NO M2 Air benchmarks found

**ADDED VERIFIED DATA**:
- ✅ MTEB scores with task/tasktype breakdowns (Model Card Table 4)
- ✅ Matryoshka dimensions performance (768d/512d/256d/128d)
- ✅ Training data details (320B tokens, sources)
- ✅ MIRIAD medical fine-tuning benchmark
- ✅ Quantization options (QAT: mixed, Q8_0, Q4_0)
- ✅ Proper distinction between EmbeddingGemma and nomic-embed-text

---

**Last Updated**: 2025-10-28
**Next Review**: After Phase 1-5 validation (2 weeks)
**Research Lead**: AI-assisted analysis with VERIFIED citations only
