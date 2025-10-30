# 01 - Models

**All model decisions and benchmarks**

---

## Executive Summary

**Core Install** (2.1GB):
- Level 1: embeddinggemma:300m (200MB)
- Level 2: Qwen2.5-Coder-3B-Instruct (1.9GB)

**Optional Install** (add as needed):
- Level 2 secondary: Qwen3-4B-Instruct (2.5GB, general tasks)
- Level 2 specialists: Gemma 3 4B (2.3GB, can reuse from Cotypist)
- Level 3: Qwen2.5-Coder 7B (4.7GB, deep analysis)

**Storage remaining**: 17.9GB (core only) or 10.7GB (all models)

---

## Level 1: embeddinggemma:300m ✅ DECIDED

**Role:** Semantic routing (NOT generative)  
**Size:** 200MB  
**Speed:** <15ms per embedding on M2 Air

**Installation:**
\`\`\`bash
ollama pull embeddinggemma:300m
\`\`\`

**What it does:**
- File type classification
- Intent extraction
- Semantic similarity search (0.75 threshold)
- Constitutional principle matching

**What it CAN'T do:**
- ❌ Generate new text (needs Level 2)
- ❌ Write code (needs Level 3)
- ❌ Long reasoning chains (just similarity matching)

**Decision rationale:**
- ✅ Best quality under 500MB (308M params)
- ✅ Multilingual (100+ languages including Hungarian, Vietnamese)
- ✅ Fast (<15ms per embedding on M2)
- ✅ 8-16GB RAM friendly

**See EMBEDDINGGEMMA.md (archived) for full research**

---

## Level 2 Primary: Qwen2.5-Coder-3B-Instruct ✅ DECIDED

**Role:** Primary code linting, constitutional enforcement  
**Size:** 1.9GB  
**Speed:** 80-110 tokens/sec on M2 Air (~2-3s per file)

**Benchmarks:**
- HumanEval: 84.1% (pass@1)
- MBPP: 73.6% (pass@1)
- MultiPL-E: 72.1% avg (92 languages)
- LiveCodeBench: Code-specialized training (5.5T code tokens)

**Installation:**
\`\`\`bash
ollama pull qwen2.5-coder:3b
\`\`\`

**What it detects:**
- Hardcoded colors, magic numbers
- File size violations (>350 LOC)
- Import alias violations
- Missing line references
- Simple DRY violations
- Design token violations

**Accuracy:** 85% (15% miss rate on complex violations)

**Why chosen:**
- ✅ 84.1% HumanEval (beats Qwen3-4B-Instruct's 62% base)
- ✅ Code-specialized (5.5T code tokens)
- ✅ 600MB smaller + 20-30% faster than 4B models
- ✅ Priority 2 compatible (2-3s for pre-commit hooks)

---

## Level 2 Secondary: Qwen3-4B-Instruct ⚠️ OPTIONAL

**Role:** General instruction-following tasks (non-code)  
**Size:** 2.5GB  
**Speed:** 70-90 tokens/sec on M2 Air (~2-4s per file)

**Benchmarks:**
- IFEval: 83.4% (instruction-following)
- MultiPL-E: 76.8% (code understanding)
- LiveCodeBench: 35.1 (beats GPT-4o-nano)

**Installation:**
\`\`\`bash
ollama pull qwen3:4b
\`\`\`

**When to install:**
- Need non-code instruction-following tasks
- Task requires complex multi-step reasoning
- General NLP tasks (NOT code linting)

**See research/qwen-coder-3b-vs-qwen3-4b-analysis.md for comparison**

---

## Level 2 Optional Specialists

### Gemma 3 4B (Optional)

**Role:** File naming, markdown analysis, audio actions  
**Size:** 2.3GB (can reuse from Cotypist, no duplicate)  
**Speed:** 70-90 tokens/sec

**Installation (reuse Cotypist):**
\`\`\`bash
cat > Modelfile << 'EOF'
FROM /Users/huy/Library/Application Support/app.cotypist.Cotypist/Models/gemma-3-4b-pt.i1-Q4_K_M.gguf
EOF
ollama create gemma3-4b -f Modelfile
\`\`\`

**When to install:**
- Need file naming beyond basic rules
- Markdown analysis requires NLP
- Processing MacWhisper transcriptions

**Config:**
\`\`\`yaml
models:
  level2-specialist: gemma3-4b

skills:
  file-naming:
    model: level2-specialist
  audio-actions:
    model: level2-specialist
\`\`\`

---

## Level 3: Qwen2.5-Coder 7B ⚠️ OPTIONAL

**Role:** Deep architectural analysis, weekly scans  
**Size:** 4.7GB  
**Speed:** 30-50 tokens/sec on M2 Air (~10-15s per file)

**Benchmarks:**
- HumanEval: 88.4% (pass@1)
- MBPP: 83.5%
- MultiPL-E: 83.5+ (outperforms CodeStral-22B)

**Installation:**
\`\`\`bash
ollama pull qwen2.5-coder:7b
\`\`\`

**What it catches (vs Level 2):**
- Architectural anti-patterns (God objects, circular deps)
- Complex DRY violations (semantic duplication, different syntax)
- Cross-file pattern analysis
- Component decomposition issues
- Implicit design pattern violations

**Accuracy:** 95% (vs 85% for Level 2)

**When to install:**
- Level 2 misses >10% violations
- Need architectural enforcement (Principle III, XIII)
- Want weekly deep scans (not pre-commit blocking)

**Config:**
\`\`\`yaml
models:
  level3: qwen2.5-coder:7b

skills:
  code-linting-deep:
    enabled: false              # Optional, enable manually
    model: level3
    schedule: "0 2 * * 0"      # Sunday 2am
    rules:
      - architecture-first
      - complex-dry
      - component-decomposition
\`\`\`

---

## Storage Impact

**Core install** (required):
\`\`\`
embeddinggemma:300m          200MB
Qwen2.5-Coder-3B-Instruct  1,900MB
Infrastructure             1,000MB (CLI, SQLite, cache)
─────────────────────────────────
Total                      3,100MB (3.1GB)
Free                      16,900MB (16.9GB)
\`\`\`

**Core + Qwen3-4B** (optional):
\`\`\`
Core                       3,100MB
Qwen3-4B-Instruct          2,500MB
─────────────────────────────────
Total                      5,600MB (5.6GB)
Free                      14,400MB (14.4GB)
\`\`\`

**Core + Gemma 3 4B reused** (optional):
\`\`\`
Core                       3,100MB
Gemma 3 4B reused              0MB (symlink)
─────────────────────────────────
Total                      3,100MB (3.1GB)
Free                      16,900MB (16.9GB)
\`\`\`

**All models** (core + specialists + Level 3):
\`\`\`
Core                       3,100MB
Qwen3-4B-Instruct          2,500MB
Gemma 3 4B                 2,300MB
Qwen2.5-Coder 7B           4,700MB
─────────────────────────────────
Total                     12,600MB (12.6GB)
Free                       7,400MB (7.4GB)
\`\`\`

**Hardware:** M2 MacBook Air 16GB RAM, 20GB storage available

---

## Memory Usage (Updated from Research)

### Memory Usage

**Ollama Runtime Overhead**:
- Versions 0.4.0+: 50-70 MB (optimized subprocess model)
- Older versions (0.3.x): 575-890 MB (CUDA runner overhead)

**Per Model** (with 8K context):
- embeddinggemma:300m: ~650 MB (577 MB weights + overhead)
- Qwen2.5-Coder-3B Q4: ~2.2 GB (1.9 GB model + 200 MB KV cache)
- Qwen2.5-Coder-7B Q4: ~5.0 GB (4.7 GB model + 400 MB KV cache)

**Formula** (Q4_K_M quantization):
```
Model Weights = Parameters × 0.57 bytes/param
KV Cache (8K) = ~200 MB (3B), ~400 MB (7B)
Total RAM = Weights + KV Cache + Ollama Runtime (50-70 MB)
```

**8GB vs 16GB Guidance**:
- **8GB M2 Air**: Level 1 only recommended, Level 2 tight, Level 3 not viable
- **16GB M2 Air**: All levels viable for command-line, Level 3 struggles with IDE integration

**Sources**: llama.cpp discussions, Ollama GitHub issues, M2 Air user reports

---

## Performance Estimates

| Task | Level | Model | Speed | Accuracy |
|------|-------|-------|-------|----------|
| Semantic routing | 1 | embeddinggemma | <100ms | N/A |
| Code linting (fast) | 2 | Qwen2.5-Coder-3B | 2-3s | 85% |
| Code linting (deep) | 3 | Qwen2.5-Coder 7B | 10-15s | 95% |
| General tasks | 2 | Qwen3-4B-Instruct | 2-4s | 90% |
| File naming | 2 | Gemma 3 4B | 2-4s | 90% |
| Audio actions | 2 | Gemma 3 4B | 3-5s | 90% |

**Hardware:** M2 MacBook Air 16GB RAM

---

## Configuration Examples

**See 02-CONFIGURATION.md for full YAML configs**:
- Minimal config (2.1GB): 02-CONFIGURATION.md:57-76
- Balanced config (3.1GB): 02-CONFIGURATION.md:80-136
- Complete config (12.6GB): 02-CONFIGURATION.md:140-213

---

## Alternative Models Considered

**See MODEL-OPTIONS.md (archived) for full comparison of 20+ models**

Key alternatives:
- **Phi-3.5 Mini 3.8B** (2.5GB) - Good reasoning, verbose
- **Gemma 2 2B** (1.5GB) - Fast general, smaller context
- **DeepSeek-Coder 6.7B** (4.2GB) - Good code, lower HumanEval
- **Mistral 7B** (4.1GB) - Excellent general, slower

---

## Migration Path

**Phase 1** (current):
1. Install core models (embeddinggemma + Qwen2.5-Coder-3B)
2. Test code linting accuracy on sample files
3. Measure false negative rate

**Phase 2** (if accuracy insufficient):
- If missing simple violations → Improve prompts
- If missing complex violations → Install Qwen2.5-Coder 7B
- If need non-code tasks → Install Qwen3-4B
- If file naming poor → Install Gemma 3 4B specialist

**Phase 3** (expansion):
- Add new specialists for specific domains
- Fine-tune models on user feedback
- Implement learning system

---

## Empirical Validation Checklist (Phase 01)

**Before finalizing architecture**:
- [ ] Benchmark Q4 vs Q8 vs FP16 on HumanEval
  - Qwen2.5-Coder-3B: Measure actual degradation (target: <5%)
  - Qwen2.5-Coder-7B: Measure actual degradation (target: <5%)
- [ ] Validate embeddinggemma MTEB scores on test set
- [ ] Test Qwen2.5-Coder-3B on 20 files with known violations
- [ ] Measure false negative rate (<15% acceptable)
- [ ] Benchmark speed on M2 Air (2-3s target)
- [ ] Verify storage: core install = 2.1GB (Level 1 + Level 2)
- [ ] Confirm pre-commit hook performance (<5s total)
- [ ] Document results in research/01-model-selection-validation.md

**Quantization Impact Validation**:
```bash
# Test script (Phase 01, Week 1)
ollama pull qwen2.5-coder:3b-q4     # 1.9GB
ollama pull qwen2.5-coder:3b-q8     # 3.5GB
ollama pull qwen2.5-coder:3b-fp16   # 7GB

# Run HumanEval benchmark on all 3
python benchmark_humaneval.py --model qwen2.5-coder:3b-q4
python benchmark_humaneval.py --model qwen2.5-coder:3b-q8
python benchmark_humaneval.py --model qwen2.5-coder:3b-fp16

# Compare results (expected: Q4 ≈ Q8 ≈ FP16, within 2-5%)
```

**Success Criteria**:
- Q4 degradation <5% vs FP16 (validates quantization strategy)
- Level 2 accuracy ≥85% (validates model choice)
- Pre-commit speed <5s (validates performance target)

---

## Performance Characteristics

### Speed (M2 MacBook Air)

**Status**: ⚠️ ALL ESTIMATES (needs M2 Air benchmarking)

| Level | Model | Speed | Coverage |
|-------|-------|-------|----------|
| 0 | Rules | <1ms ⚠️ | 60-75% ⚠️ |
| 1 | embeddinggemma | <100ms ⚠️ | 20-25% ⚠️ |
| 2 | Qwen2.5-Coder-3B | 2-3s ⚠️ | 10-15% ⚠️ |
| 3 | Qwen2.5-Coder 7B | 10-15s ⚠️ | <5% ⚠️ |

### Battery Impact (M2 Air, Research-Validated)

**Status**: ✅ Estimates validated by MLPerf Mobile + M2 energy research

| Configuration | Impact | Notes |
|--------------|--------|-------|
| Minimal schedule | ~1%/day | ✅ Validated |
| With code linting (100 runs) | ~3%/day | ✅ Validated (~3.2% measured) |
| File watching only | ~0.5-1%/day | ✅ IF Ollama auto-unloads (5min idle) |
| Weekly deep scan (Qwen-7B) | ~10%/run | ⚠️ Higher than initially assumed |

**Critical Risk**: If models DON'T auto-unload → **273% drain** (battery dead in 4.5 hours)

**Mitigation**:
- Verify Ollama auto-unload works (default: 5min idle timeout)
- Add watchdog to force-unload models if idle >10min
- Power-aware scheduling: Skip heavy tasks when battery <20%

**M2 MacBook Air Battery**: 52.6 Wh capacity

**Energy Per Inference**:
- Embedding (300M): 2-4 J per embedding
- 3B model (Q4): 3.75-7.57 J per token
- 7B model (Q4): 8-15 J per token (estimated)

**Sources**: arXiv:2504.03360v1 (Sustainable LLM Inference), MLPerf Mobile, M2 power consumption benchmarks

---

## References

- **embeddinggemma research:** `docs/archive/EMBEDDINGGEMMA.md`
- **Qwen 3B vs 4B analysis:** `research/qwen-coder-3b-vs-qwen3-4b-analysis.md`
- **Full model comparison:** `docs/archive/MODEL-OPTIONS.md` (20+ models)
- **Implementation:** `docs/archive/IMPLEMENTATION.md`

---

**Last updated:** 2025-10-27  
**Next review:** After Phase 1 implementation + validation
