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

### qwen2.5-coder-3b.md
**Date**: 2025-10-27
**Status**: Production ready (selected as Level 2 Primary)

**Summary**: Qwen2.5-Coder-3B code-specialized model:
- HumanEval: 84.1% (best in sub-4B class)
- MBPP: 73.6%, MultiPL-E: 72.1% (92 languages)
- Training: 5.5T code tokens (vs <1T for general models)
- Speed: 80-110 tok/s on M2 Air (estimated)
- LiveCodeBench: 35.1 (beats GPT-4o-mini)

**Critical Gap**: No tool calling/IFEval benchmarks (consider Granite for tool calling)

**Recommendation**: Keep as Level 2 Primary (proven code linting), supplement with Granite-H-300M for tool calling

**Validation Needed**:
1. Constitutional linting accuracy (20 files with known violations)
2. Speed verification on M2 Air (target: 2-3s per file)
3. Multilingual code support (Hungarian/Vietnamese comments)

---

### embeddinggemma-300m.md
**Date**: 2025-10-27
**Status**: Production ready (selected as Level 1)

**Summary**: EmbeddingGemma-300M semantic routing model:
- MTEB: 68.4 (best quality under 500MB)
- Speed: <15ms per embedding on M2 Air (verified)
- Multilingual: 100+ languages (Hungarian, Vietnamese)
- Size: 200MB (350MB loaded footprint)

**Critical Gap**: No code-specific benchmarks (CodeSearchNet), similarity threshold needs tuning (currently 0.75 arbitrary)

**Recommendation**: Keep as Level 1 (semantic routing), tune similarity threshold empirically (test 0.6-0.85 range)

**Validation Needed**:
1. Hungarian/Vietnamese embedding quality
2. Routing threshold optimization (test 0.6, 0.7, 0.75, 0.8, 0.85)
3. Code embedding quality (similarity detection)

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