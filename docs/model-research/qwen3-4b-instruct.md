# Qwen3-4B-Instruct: Proven Strengths & Weaknesses

**Research Date**: 2025-10-28
**Source**: Qwen3 Technical Report (arXiv:2505.09388), Qwen official blog, HuggingFace model cards
**Status**: Analysis complete - OPTIONAL Level 2 Secondary

---

## Executive Summary

**Qwen3-4B-Instruct is a general-purpose model with strong reasoning and instruction-following** - trained on 36T tokens across 119 languages with 32K context. Beats Qwen2.5-7B-Base on 50%+ of benchmarks despite smaller size. **NOT code-specialized** (general training vs Qwen2.5-Coder-3B's 5.5T code tokens). Missing: HumanEval/MBPP exact scores, tool calling benchmarks. **Use case**: general tasks, reasoning, multilingual support. **NOT replacing Qwen2.5-Coder-3B** for code linting (lacks code specialization).

---

## Model Variants

| Model | Params | Training | Context | Size (Q4_K_M) | Specialization |
|-------|--------|----------|---------|---------------|----------------|
| Qwen3-0.6B-Instruct | 0.6B | 36T tokens | 32K | ~500MB | General |
| Qwen3-1.7B-Instruct | 1.7B | 36T tokens | 32K | ~1.2GB | General |
| **Qwen3-4B-Instruct** | **4B** | **36T tokens** | **32K** | **2.5GB** | **General (researched)** |
| Qwen3-8B-Instruct | 8B | 36T tokens | 32K | ~5GB | General |
| Qwen3-14B-Instruct | 14B | 36T tokens | 32K | ~9GB | General (too large) |

**Architecture**: Dense Transformer (36 layers, 32 query heads, 8 KV heads, GQA)
**Context Length**: 32,768 tokens (native), extendable to 131K with YaRN
**License**: Apache 2.0
**Release Date**: April 29, 2025

**Training Stages**:
- Stage 1: 30T+ tokens (4K context) - broad language modeling
- Stage 2: STEM, coding, logical reasoning enhancement
- Stage 3: Long-context training (32K context extension)

**Source**: https://qwenlm.github.io/blog/qwen3/

---

## Proven Strength #1: Instruction Following (IFEval)

### Scores

| Model | IFEval Score | Source | Confidence |
|-------|--------------|--------|------------|
| **Qwen3-4B-Instruct** | **87.0** | Research paper (arXiv:2510.10977) | HIGH |
| Qwen2.5-7B-Instruct | ~80-85 (estimated) | Qwen blog (no exact IFEval) | MEDIUM |
| Qwen2.5-Coder-3B | ❌ Unknown | N/A | N/A |
| Granite-4.0-H-1B | 78.5 | Granite research | HIGH |

**Source**: https://arxiv.org/html/2510.10977 (Model Interpolation for Efficient Reasoning)

### What This Means

**IFEval 87.0 = Best instruction-following in sub-5B class**

**Why it matters for tinyArms**:
- Constitutional enforcement needs multi-step instruction following
- "Check file for X, Y, Z violations" = complex instruction decomposition
- 87.0 vs Granite's 78.5 = 11% improvement in instruction adherence
- Useful for general tasks like file organization, structured analysis

**NOT code-specialized**:
- ❌ No training on 5.5T code tokens (Qwen2.5-Coder-3B has this)
- ❌ HumanEval score unknown (Qwen2.5-Coder: 84.1% proven)
- ⚠️ Good at understanding instructions, NOT necessarily best at writing/analyzing code

**Confidence**: HIGH - IFEval is industry-standard instruction-following benchmark

---

## Proven Strength #2: General Reasoning (MMLU, BBH)

### Scores

| Model | MMLU | MMLU-Redux | BBH | Source |
|-------|------|------------|-----|--------|
| **Qwen3-4B-Base** | ❌ | **83.7** | ❌ | Qwen blog |
| Qwen3-4B-Instruct | ❌ | ❌ | ❌ | Not published |
| Qwen2.5-7B-Base | ~85 (estimated) | ❌ | 81.07 | Qwen2.5 report |
| Qwen2.5-Coder-3B | ❌ | ❌ | ❌ | Code-specialized |

**Additional Qwen3-4B-Base scores**:
- C-Eval: 77.5 (Chinese knowledge)
- MATH-500: 97.0 (mathematics)
- MLogiQA: 65.9 (multilingual logic)

**Source**: https://qwenlm.github.io/blog/qwen3/, search results summary

### What This Means

**MMLU-Redux 83.7 = Strong general knowledge (Base model)**

**Why it matters for tinyArms**:
- General knowledge useful for non-code tasks (file naming, organization)
- Multilingual logic (119 languages) supports Hungarian/Vietnamese
- MATH-500 97.0 = strong quantitative reasoning

**Limitations**:
- ❌ Instruct variant scores not published (Base only)
- ⚠️ General knowledge ≠ code expertise
- ⚠️ MMLU measures breadth, not depth in code patterns

**Confidence**: MEDIUM - Base model scores published, Instruct variant extrapolated

---

## Proven Strength #3: Multilingual Support (119 Languages)

### Specifications

| Model | Languages | Training Tokens | Context | Multilingual Benchmarks |
|-------|-----------|-----------------|---------|-------------------------|
| **Qwen3-4B** | **119** | **36T** | **32K** | MLogiQA: 65.9 |
| Qwen2.5-Coder-3B | 92 (code) | 5.5T (code) | 32K | MultiPL-E: 72.1% |
| embeddinggemma-300m | 100+ | ❌ | 2K | Multilingual embeddings |

**Source**: https://qwenlm.github.io/blog/qwen3/

### What This Means

**119 languages = Best multilingual coverage in tinyArms stack**

**Why it matters for tinyArms**:
- NQH monorepo needs Hungarian + Vietnamese support
- Code comments in multiple languages
- i18n string detection across languages
- File naming with non-English characters

**vs Qwen2.5-Coder-3B**:
- Qwen3-4B: 119 natural languages (human text)
- Qwen2.5-Coder: 92 programming languages (code syntax)
- Different specializations, not direct competitors

**Validation needed**: Test Hungarian/Vietnamese code comments + i18n strings

**Confidence**: HIGH - 119 languages explicitly stated in official documentation

---

## Proven Strength #4: Performance Per GB

### Efficiency Analysis

| Model | Params | Size (Q4_K_M) | IFEval | MMLU-Redux | Quality/GB |
|-------|--------|---------------|--------|------------|------------|
| **Qwen3-4B-Instruct** | **4B** | **2.5GB** | **87.0** | **83.7** | **34.8/GB** |
| Qwen2.5-Coder-3B | 3B | 1.9GB | ❌ | ❌ | 44.3/GB (HumanEval) |
| Qwen2.5-7B | 7B | ~4.7GB | ~80-85 | ~85 | ~18/GB |
| Granite-4.0-H-1B | 1B | ~1.2GB | 78.5 | ❌ | 65.4/GB (IFEval) |

**Performance assumptions**:
- Quality/GB = IFEval score ÷ size (for general models)
- Quality/GB = HumanEval score ÷ size (for code models)

**Source**: Calculated from published benchmarks and GGUF file sizes

### What This Means

**34.8/GB = Good efficiency, NOT best in class**

**Why it matters for tinyArms**:
- Memory budget: 8-16GB RAM, target <5GB for core stack
- Storage budget: 20GB available, core stack <3GB
- 2.5GB acceptable for **optional** Level 2 Secondary

**Trade-offs**:
- ✅ Better instruction-following than smaller models
- ✅ Multilingual support (119 languages)
- ❌ 600MB larger than Qwen2.5-Coder-3B (1.9GB)
- ❌ NOT code-specialized (lower code quality/GB)

**Confidence**: MEDIUM - Estimated from Q4_K_M GGUF size (2.50GB measured)

**Source**: https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF

---

## Critical Gaps & Unknowns

### 1. Code Benchmarks (CRITICAL for tinyArms)

**Missing**:
- ❌ HumanEval score (code generation)
- ❌ MBPP score (Python code understanding)
- ❌ LiveCodeBench score (real-world code tasks)
- ❌ Direct comparison vs Qwen2.5-Coder-3B

**Impact**: CRITICAL - Cannot assess code linting capability

**Known**:
- ✅ General training (36T tokens) includes code, but NOT 5.5T code-specialized
- ✅ Qwen3-4B "outperforms earlier 72B models on programming" (qualitative claim)
- ✅ Qwen3-4B-Base performs as well as Qwen2.5-7B-Base (general benchmarks)

**Assumption**: Likely 60-70% HumanEval (general models typically score 20-30% lower than code-specialized)

**Validation needed**: Test on 20 code files with known violations

**Confidence**: LOW - No code benchmarks published

---

### 2. Tool Calling / Function Calling (HIGH PRIORITY)

**Missing**:
- ❌ BFCLv3 score (tool calling benchmark)
- ❌ MCP integration capability
- ❌ JSON schema validation accuracy
- ❌ Multi-tool orchestration

**Impact**: HIGH - tinyArms needs tool calling for MCP integration

**Comparison**:
- Granite-4.0-H-1B: 50.2 BFCLv3 (proven tool calling)
- Qwen3-4B-Instruct: ❌ Unknown

**Workaround**: Use Granite for tool calling, Qwen2.5-Coder for code, Qwen3-4B for general tasks (3-model hybrid stack)

**Confidence**: N/A - No tool calling data available

---

### 3. Speed/Latency on Mac (HIGH PRIORITY)

**Missing**:
- ❌ Actual tok/s on M2 Air (estimated 70-90 tok/s)
- ❌ Memory usage (estimated 3.5-4GB loaded)
- ❌ Cold start time
- ❌ Power consumption (24/7 daemon)

**Impact**: HIGH - tinyArms targets M2 MacBook Air specifically

**Estimated performance** (based on 4B models):
- Speed: 70-90 tok/s (vs Qwen2.5-Coder-3B: 80-110 tok/s)
- Memory: 3.5-4GB loaded (vs Qwen2.5-Coder-3B: 3.2GB)
- Latency: 3-4s per task (vs Qwen2.5-Coder-3B: 2-3s)

**Validation needed**: Benchmark on M2 Air 16GB

**Confidence**: LOW - Estimated from similar 4B models

---

### 4. MultiPL-E Score (MEDIUM PRIORITY)

**Conflicting data**:
- ⚠️ One source claims 76.8% (Qwen3-4B general)
- ⚠️ Another references larger models: Qwen3-235B: 87.9, Qwen3-80B: 87.8
- ❌ No official Qwen3-4B-Instruct MultiPL-E score found

**Impact**: MEDIUM - MultiPL-E measures multilingual code understanding

**Known**:
- Qwen2.5-Coder-3B: 72.1% MultiPL-E (92 languages, code-specialized)
- If Qwen3-4B: 76.8% is accurate → 6.5% better than code-specialized model (unlikely for general model)

**Assumption**: MultiPL-E score likely 65-70% (below code-specialized models)

**Validation needed**: Run MultiPL-E benchmark locally

**Confidence**: LOW - Conflicting sources, no official confirmation

---

## Comparison: Qwen3-4B-Instruct vs Current tinyArms Stack

### vs Qwen2.5-Coder-3B (Level 2 Primary)

| Metric | Qwen3-4B-Instruct | Qwen2.5-Coder-3B | Winner |
|--------|-------------------|------------------|--------|
| **HumanEval** | ❌ Unknown (~60-70% est.) | **84.1%** | **Coder** |
| **IFEval** | **87.0** | ❌ Unknown | **Qwen3-4B** |
| **Size** | 2.5GB | **1.9GB** | **Coder** |
| **Speed (M2 Air)** | 70-90 tok/s (est.) | **80-110 tok/s** | **Coder** |
| **Training** | 36T general | **5.5T code** | **Coder (for code)** |
| **Context** | **32K** | 32K | Tie |
| **Multilingual** | **119 languages** | 92 (code langs) | **Qwen3-4B** |
| **Tool Calling** | ❌ Unknown | ❌ Unknown | Tie |
| **Use Case** | General tasks | **Code linting** | **Coder (for tinyArms)** |

**Decision**: Keep Qwen2.5-Coder-3B as Level 2 Primary (code-specialized > general)

**When to use Qwen3-4B** (OPTIONAL Level 2 Secondary):
- ✅ Non-code tasks (file naming, organization, general analysis)
- ✅ Multilingual content (Hungarian/Vietnamese comments)
- ✅ Instruction-following (complex multi-step tasks)
- ✅ Reasoning (logic puzzles, problem-solving)
- ❌ NOT for code linting (use Qwen2.5-Coder-3B)

---

### vs Granite-4.0-H-1B (Potential Level 1.5)

| Metric | Qwen3-4B-Instruct | Granite-H-1B | Winner |
|--------|-------------------|--------------|--------|
| **IFEval** | **87.0** | 78.5 | **Qwen3-4B** |
| **Tool Calling** | ❌ Unknown | **50.2 BFCLv3** | **Granite** |
| **Size** | 2.5GB | **1.2GB** | **Granite** |
| **HumanEval** | ❌ Unknown | ❌ Unknown | Tie |
| **Architecture** | Dense | Hybrid-SSM | Different |
| **Training** | 36T general | ❌ Unknown | Unknown |

**Trade-off**:
- Qwen3-4B = Better instruction-following (87.0 vs 78.5)
- Granite = Better tool calling (50.2 BFCLv3) + smaller (1.2GB vs 2.5GB)

**Decision**: Both models complement each other (Qwen3-4B for general, Granite for tool calling)

---

## Recommendation for tinyArms

### Current Status: OPTIONAL Level 2 Secondary ⚠️

**Stack Position**: OPTIONAL (not in core stack)

**Use Cases**:
- Non-code general tasks (file naming, organization)
- Multilingual content (Hungarian/Vietnamese support)
- Complex instruction-following (multi-step reasoning)
- Alternative to Qwen2.5-Coder-3B for non-code tasks

**Performance Target**: Unknown (needs validation)

**NOT replacing Qwen2.5-Coder-3B** (lacks code specialization)

---

### Option A: Add as OPTIONAL Level 2 Secondary (RECOMMENDED)

**Stack Configuration**:
- Level 1: embeddinggemma-300m (semantic routing)
- Level 2 Primary: Qwen2.5-Coder-3B (code linting) - **KEEP**
- Level 2 Secondary: Qwen3-4B-Instruct (general tasks) - **ADD OPTIONAL**
- Level 3: Qwen2.5-Coder-7B (deep analysis)

**Rationale**:
- ✅ Best instruction-following (87.0 IFEval)
- ✅ Multilingual support (119 languages)
- ✅ Complementary to code-specialized model
- ✅ 32K context (long documents)
- ❌ 2.5GB storage (600MB more than Coder-3B)
- ❌ Slower than Coder-3B (70-90 vs 80-110 tok/s est.)
- ⚠️ OPTIONAL (not critical for core tinyArms workflow)

**When to use**:
- Route general tasks → Qwen3-4B (87.0 IFEval)
- Route code tasks → Qwen2.5-Coder-3B (84.1% HumanEval)
- embeddinggemma-300m decides routing (Level 1 semantic routing)

**Validation required**: Test instruction-following on tinyArms tasks (file naming, general analysis)

---

### Option B: Skip for Phase 1 (CONSERVATIVE)

**Rationale**:
- ❌ No code benchmarks (HumanEval unknown)
- ❌ No tool calling benchmarks (BFCLv3 unknown)
- ❌ No Mac performance data (tok/s, memory, latency unknown)
- ✅ Qwen2.5-Coder-3B sufficient for code linting
- ✅ Granite-H-1B better for tool calling (proven 50.2 BFCLv3)
- ⚠️ Storage budget tight (20GB total, 2.5GB = 12.5%)

**Decision**: Wait for benchmarks, focus on proven models

**Reconsider when**:
- HumanEval/MBPP scores published
- Tool calling benchmarks available
- User explicitly needs multilingual general tasks

---

### Option C: Replace Qwen2.5-Coder-3B (NOT RECOMMENDED ❌)

**Rationale**:
- ❌ Qwen2.5-Coder-3B: 84.1% HumanEval (proven code quality)
- ❌ Qwen3-4B: Unknown HumanEval (likely 60-70%, 20-30% lower)
- ❌ High regression risk (constitutional code linting may fail)
- ❌ 600MB larger (2.5GB vs 1.9GB)
- ❌ Slower (70-90 vs 80-110 tok/s est.)
- ✅ Better instruction-following (87.0 vs unknown)

**Decision**: NEVER replace proven code-specialized model with general model

**Bottom Line**: Code specialization (5.5T tokens) > general capabilities for code linting

---

## Validation Test Plan

### Phase 1: Installation Verification (1 day)

```bash
# Install via Ollama
ollama pull qwen3:4b-instruct

# Verify model
ollama list | grep qwen3

# Test inference
echo "Explain what this code does: function add(a, b) { return a + b; }" | ollama run qwen3:4b-instruct
```

**Success Criteria**: Model installs, responds coherently

---

### Phase 2: Instruction-Following Validation (3 days)

**Test Dataset**: 10 multi-step instructions
- 5 tasks: File naming (read metadata, generate descriptive name)
- 5 tasks: General analysis (read docs, summarize key points)

**Metrics**:
- Instruction adherence (follows all steps?)
- Output quality (accurate, coherent?)
- Response time per task (target: 3-5s)

**Comparison**: Baseline vs GPT-4o-mini (known good instruction-follower)

**Success Criteria**: ≥85% instruction adherence, ≤5s per task

---

### Phase 3: Multilingual Support Validation (2 days)

**Test Cases**:
- Code with Hungarian comments (10 files)
- Code with Vietnamese comments (10 files)
- i18n string detection (Hungarian/Vietnamese)

**Metrics**:
- Accuracy (correct understanding of non-English text?)
- No degradation vs English-only code

**Success Criteria**: ≥90% accuracy, no language-based errors

---

### Phase 4: Performance Benchmarking (2 days)

**Metrics**:
- Inference speed (tok/s) on M2 Air 16GB
- Memory usage (idle, loaded, inferencing)
- Cold start time (first inference after idle)
- Power consumption (battery % over 1 hour)

**Success Criteria**: 70-90 tok/s, ≤4GB loaded, <10s cold start

---

### Phase 5: Code Understanding Test (3 days)

**Test Dataset**: 20 files with code violations (use Qwen2.5-Coder-3B baseline)
- 5 files: Hardcoded colors, magic numbers
- 5 files: Import alias violations
- 5 files: DRY violations
- 5 files: Design token violations

**Metrics**:
- False negative rate (missed violations)
- False positive rate (false alarms)
- Accuracy vs Qwen2.5-Coder-3B (baseline: 85%)

**Success Criteria**: ≥70% accuracy (acceptable for general model, NOT replacing code-specialized)

---

### Timeline: 11 days total

**CRITICAL**: Do NOT add to core stack without Phase 5 validation (code understanding)

---

## References

**Model Card**: https://huggingface.co/Qwen/Qwen3-4B-Instruct
**Technical Report**: https://arxiv.org/abs/2505.09388 (Qwen3 Technical Report)
**Official Blog**: https://qwenlm.github.io/blog/qwen3/
**GGUF Download**: https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF
**IFEval Source**: https://arxiv.org/html/2510.10977 (Model Interpolation for Efficient Reasoning)

**License**: Apache 2.0
**Distribution**: Ollama (`qwen3:4b-instruct`), Hugging Face, llama.cpp

**Benchmark Scores**:
- ✅ IFEval: 87.0 (HIGH confidence - research paper)
- ✅ MMLU-Redux: 83.7 (MEDIUM confidence - Base model, Instruct extrapolated)
- ✅ Context: 32K (HIGH confidence - official specs)
- ✅ Training: 36T tokens, 119 languages (HIGH confidence - official blog)
- ❌ HumanEval: Unknown (LOW confidence - estimated 60-70%)
- ❌ MBPP: Unknown
- ❌ MultiPL-E: Conflicting (76.8% claimed, 65-70% estimated)
- ❌ BFCLv3: Unknown (tool calling)
- ❌ LiveCodeBench: Unknown

**Benchmark Images**: N/A (text-based scores from official reports)

---

**Last Updated**: 2025-10-28
**Next Review**: After HumanEval/MBPP scores published OR user requests multilingual general task support
