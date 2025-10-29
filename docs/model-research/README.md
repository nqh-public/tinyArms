# Model Research Directory

Research and analysis for model selection in tinyArms.

---

## Documents

### granite-4.0-nano.md
**Date**: 2025-10-28
**Status**: Analysis complete, validation pending

**Summary**: IBM Granite 4.0 Nano (1B/350M) proven leaders in:
- Tool Calling: 43-55 BFCLv3 (2-3x better than Gemma, Llama)
- Instruction Following: 77-78 IFEval (best in sub-2B class)
- General Performance: 67-68 avg (beats Qwen3-1.7B despite smaller size)
- Safety: 96-97 SALAD-Bench (near-perfect)

**Critical Gap**: No HumanEval/MBPP code benchmarks (can't compare vs Qwen2.5-Coder-3B)

**Recommendation**: Add Granite-4.0-H-300M as Level 1.5 (tool calling + simple tasks), keep Qwen-3B for code linting

**Validation Needed**:
1. Code linting accuracy on 20 files
2. Speed benchmarks on M2 Air
3. Memory usage measurements
4. Multilingual support (Hungarian, Vietnamese)

---

### qwen2.5-coder-3b.md (DEPRECATED - See qwen2.5-coder-3b-instruct.md)
**Date**: 2025-10-27
**Status**: Replaced by comprehensive research (2025-10-28)

**Note**: This file has been superseded by `qwen2.5-coder-3b-instruct.md` which contains:
- Complete benchmark extraction (HumanEval, MBPP, MultiPL-E, BigCodeBench, LiveCodeBench)
- Architecture specifications (3.09B params, 36 layers, GQA details)
- Training data breakdown (5.5T tokens: 70% code, 20% text, 10% math)
- Critical gaps analysis (tool calling, instruction following, multilingual support, Mac performance)
- Comprehensive validation test plan (5 phases, 1-2 weeks)

See new file for complete analysis.

---

### qwen2.5-coder-3b-instruct.md
**Date**: 2025-10-28
**Status**: Production ready (selected as Level 2 Primary) - COMPREHENSIVE RESEARCH

**Summary**: Qwen2.5-Coder-3B-Instruct code-specialized model (VERIFIED from official sources):
- **HumanEval**: 84.1% pass@1, 80.5% pass@1+ (arXiv:2409.12186)
- **MBPP**: 73.6% pass@1, 62.4% pass@1+ (arXiv:2409.12186)
- **BigCodeBench**: 35.8 Full, 14.2 Hard (technical report ref)
- **LiveCodeBench**: 10.8 pass@1 (real-world code, 2024.07-2024.11)
- **MultiPL-E**: 92 languages, 5/8 mainstream >60% (Python, JS, TS, Java, C++, C#, PHP, Bash)
- **Training**: 5.5T tokens (70% code, 20% text, 10% math) from GitHub, Stack Overflow
- **Architecture**: 3.09B params (2.77B non-embed), 36 layers, GQA (16 query, 2 KV heads), 32K context
- **Size**: 1.9GB (Ollama), ~3.2GB loaded memory (est.)
- **Speed**: 80-110 tok/s on M2 Air (estimated from similar models)
- **License**: Apache 2.0 (commercial use allowed)

**Critical Gaps** (ALL explicitly documented with validation plans):
1. ❌ Tool calling (no BFCLv3 score) - use Granite-H-300M/1B for MCP
2. ❌ Instruction following (no IFEval score) - code specialization may compensate
3. ❌ Multilingual natural language (Hungarian/Vietnamese comments unknown)
4. ❌ Mac M2 Air performance (speed/memory/battery estimates need validation)
5. ❌ Quantization impact (Q4/Q8 accuracy degradation unknown)

**Recommendation**: Keep as Level 2 Primary (no better alternative in sub-4B class). Supplement with Granite-H-300M for tool calling (Option B, validate first).

**Validation Needed** (5 phases, 1-2 weeks):
1. Installation (✅ COMPLETED - Ollama confirmed)
2. Code linting accuracy (20 files with known violations, ≥85% target)
3. Performance benchmarking (M2 Air 16GB: speed, memory, cold start, battery)
4. Multilingual support (Hungarian/Vietnamese comments, ≤10% degradation)
5. Instruction following (17 constitutional principles, ≥80% adherence)

---

### qwen2.5-coder-7b.md
**Date**: 2025-10-28
**Status**: Analysis complete - OPTIONAL Level 3 (accuracy vs speed trade-off)

**Summary**: Qwen2.5-Coder-7B code-specialized model:
- HumanEval: 88.4% (+5.1% over 3B), MBPP: 83.5%, MultiPL-E: 76.5%
- Training: 5.5T code tokens (same as 3B)
- Size: 4.7GB (2.5x larger than 3B)
- Speed: 30-50 tok/s estimated (2-3x slower than 3B)
- LiveCodeBench: 37.6 (beats CodeStral-22B despite 3x smaller)

**Critical Gap**: Too slow for pre-commit (10-15s per file). Only suitable for weekly deep scans.

**Recommendation**: Add as OPTIONAL Level 3 (weekly scans ONLY), keep 3B for pre-commit. Skip if storage/RAM constrained or pre-commit is only use case.

**Validation Needed**:
1. Speed benchmarks on M2 Air (confirm 30-50 tok/s estimate)
2. Complex violation detection (semantic DRY, architectural anti-patterns)
3. Weekly scan time measurement (500 files, acceptable if <30min)
4. Memory usage (estimated 6-8GB loaded)

---

### gemma-3-4b.md
### embeddinggemma-300m.md
**Date**: 2025-10-28 (CORRECTED - previous version had fabricated data)
**Status**: Production ready (selected as Level 1, requires validation)

**Summary**: EmbeddingGemma-300M semantic routing model (ENCODER-ONLY, not generative):
- MTEB: 61.15 Multilingual v2, 69.67 English v2, 68.76 Code v1 (VERIFIED from Google Model Card)
- Speed: <15ms on EdgeTPU (official), ❌ NO M2 Air benchmarks (needs validation)
- Multilingual: 100+ languages (Hungarian, Vietnamese in training data)
- Size: 622MB disk (BF16), <200MB RAM with quantization

**Critical Gaps**:
1. ❌ NO M2 Air speed benchmarks (target: <100ms P95)
2. ❌ NO Hungarian/Vietnamese quality verification
3. ❌ NO code-specific benchmarks per language (TS/Go/Python)
4. ❌ Similarity threshold needs empirical tuning (0.75 arbitrary)

**Key Correction**: nomic-embed-text is a DIFFERENT model (137M params, Nomic AI), NOT an alias for EmbeddingGemma (308M params, Google)

**Recommendation**: Keep as Level 1 (best multilingual MTEB under 500M), validate M2 Air speed + threshold tuning

**Validation Needed** (11 days total):
1. M2 Air speed benchmark (target: <100ms P95) - HIGH PRIORITY
2. Similarity threshold optimization (test 0.6-0.85) - HIGH PRIORITY
3. Hungarian/Vietnamese embedding quality - MEDIUM PRIORITY
4. Code embedding quality per language - MEDIUM PRIORITY
**Date**: 2025-10-28
**Status**: Analysis complete, optional specialist

**Summary**: Gemma 3 4B multimodal generalist model:
- Instruction Following: 90.2% IFEval (best in 4B class)
- Code: 71.3% HumanEval, 63.2% MBPP (strong for generalist)
- Multimodal: 75.8 DocVQA, 68.8 ChartQA (UNIQUE vision capability)
- Math: 89.2% GSM8K, 75.6% MATH (competitive with 7B models)
- Multilingual: 140+ languages (verified)

**Critical Gap**: No SALAD-Bench/AttaQ safety scores, no BFCL function calling benchmarks, 15% lower code quality than Qwen2.5-Coder-3B

**Recommendation**: Add as Level 2 Specialist (screenshot naming, markdown image analysis, multilingual) - can reuse from Cotypist app (zero marginal cost)

**Validation Needed**:
1. Screenshot filename generation quality (10 diverse tests)
2. Speed benchmarks on M2 Air (target: >60 tok/s)
3. Multilingual accuracy (Hungarian, Vietnamese)
4. Memory usage (target: <1.5GB RAM)

---

### qwen3-4b-instruct.md
**Date**: 2025-10-28
**Status**: Analysis complete - OPTIONAL Level 2 Secondary

**Summary**: Qwen3-4B-Instruct general-purpose model with strong reasoning:
- Instruction Following: 87.0 IFEval (best in sub-5B class)
- General Reasoning: 83.7 MMLU-Redux (Base model)
- Multilingual: 119 languages (vs 92 code languages in Qwen2.5-Coder)
- Training: 36T tokens general (NOT code-specialized)
- Size: 2.5GB Q4_K_M (600MB larger than Qwen2.5-Coder-3B)

**Critical Gap**: NO HumanEval/MBPP/LiveCodeBench scores (NOT code-specialized). Use for general tasks, NOT code linting.

**Recommendation**: Add as OPTIONAL Level 2 Secondary (non-code tasks only). Route general tasks → Qwen3-4B, route code tasks → Qwen2.5-Coder-3B. Document when to use vs Qwen2.5-Coder-3B (different specializations).

**Use Cases**:
- ✅ File naming, organization (general analysis)
- ✅ Multilingual content (Hungarian/Vietnamese)
- ✅ Complex instruction-following (multi-step reasoning)
- ❌ NOT for code linting (use Qwen2.5-Coder-3B)

**Validation Needed**:
1. Instruction-following on tinyArms tasks (file naming, 10 tests)
2. Multilingual accuracy (Hungarian/Vietnamese, 20 files)
3. Speed benchmarks on M2 Air (target: 70-90 tok/s)
4. Code understanding test (20 files, expect 70% accuracy, NOT replacing code-specialized)

---

### readerlm-v2.md
**Date**: 2025-10-28
**Status**: Analysis complete - NOT RECOMMENDED (license blocker)

**Summary**: ReaderLM-v2 (1.54B params, 935MB-3.1GB) specialized for HTML→Markdown/JSON conversion:
- HTML→Markdown: ROUGE-L 0.86 (24.6% better than GPT-4o)
- JSON extraction: F1 0.81 (competitive with GPT-4o)
- Long context: 512K tokens (no chunking needed)
- Speed: 67 tok/s input, 36 tok/s output on T4 GPU
- Multilingual: 29 languages including Hungarian/Vietnamese

**Critical Gap**: ⚠️ **LICENSE BLOCKER** - CC BY-NC 4.0 prohibits ALL commercial use (including tinyArms developer productivity tools). Commercial "pro" variant requires Jina AI licensing agreement.

**Recommendation**: SKIP for commercial tinyArms. Consider MIT/Apache 2.0 alternatives (html-to-markdown, Turndown) or negotiate commercial license if HTML quality critical enough to justify $5K-50K/year investment.

**Validation Needed**: N/A (license blocker eliminates production viability)

---

### nuextract.md
**Date**: 2025-10-28
**Status**: Analysis complete - Validation pending

**Summary**: NuMind NuExtract family (494M-8B params, MIT license) specialized for structured JSON extraction:
- **v1.5-tiny (494M)**: Beats GPT-4o zero-shot with 40 fine-tuning examples, ~500MB, Ollama native
- **v1.5 (3.8B)**: Outperforms GPT-4o on English extraction, 8-20k context, 6 languages
- **v2.0-8B**: Outperforms GPT-4.1 by 9+ F-Score, o3 by 3 points, multimodal (text+images)
- 100% valid JSON output (no guided generation needed)
- Copy-paste approach (zero hallucinations)
- Fine-tunable with modest examples (40 samples → GPT-4o level)

**Critical Gaps**:
1. ❌ NO code generation/linting capability (extraction-only, NOT replacement for Qwen2.5-Coder)
2. ❌ NO Hungarian/Vietnamese quality data (only 6 languages documented)
3. ⚠️ Context: 8-20k tokens (vs ReaderLM-v2's 512K - chunking strategy needed for long docs)
4. ❌ NO M2 Air performance data

**Recommendation**: Add NuExtract-1.5-tiny (494M) as Level 1.5 Extraction Specialist. Complements ReaderLM-v2 for downstream parsing (ReaderLM HTML→Markdown, NuExtract Markdown→JSON). Conservative path: Validate against 50+ JSON extraction tasks (API responses, configs, metadata) before adopting.

**Validation Needed** (1 week):
1. Installation + temperature=0 config (Ollama defaults to 0.7 - causes text repetition)
2. Extraction accuracy on 50 JSON schemas (>90% target)
3. M2 Air performance benchmarks (<1s latency, <1GB memory)
4. Multilingual quality (Hungarian/Vietnamese)

---

## Research Process

### 1. Source Identification
- Official blog posts (Hugging Face, vendor sites)
- Community benchmarks (Papers With Code, Hugging Face leaderboards)
- Production usage reports (Reddit, GitHub issues)

### 2. Benchmark Extraction
- Screenshot benchmark charts
- Extract specific numbers
- Compare against current stack
- Identify gaps

### 3. Analysis
- What's PROVEN (published benchmarks)
- What's CLAIMED (vendor marketing)
- What's MISSING (validation needed)
- Risk assessment

### 4. Recommendation
- Conservative path (low risk)
- Aggressive path (high reward)
- Validation requirements

### 5. Test Plan
- Specific metrics
- Test datasets
- Comparison methodology
- Timeline

---

## Next Steps

1. **Validation Testing** (1-2 weeks)
   - Install Granite models via Ollama
   - Test code linting accuracy
   - Benchmark speed on M2 Air
   - Measure memory usage

2. **Update Main Docs** (after validation)
   - Update `docs/01-MODELS.md` with findings
   - Update `config/constants.yaml` if switching models
   - Update `config/default.yaml` with new model configs

3. **Architecture Decision**
   - Keep Qwen-3B vs replace with Granite-H-1B
   - Add Level 1.5 (Granite-H-300M) or keep 4-level architecture
   - Document rationale

---

**Research Lead**: AI-assisted analysis
**Last Updated**: 2025-10-28