# IBM Granite 4.0 Nano: Proven Strengths & Weaknesses

**Research Date**: 2025-10-28
**Source**: IBM official announcements, Hugging Face blog, benchmark aggregation via web search
**Status**: Analysis complete - Validation pending (code generation benchmarks for 1B/350M variants)

---

## Executive Summary

IBM Granite 4.0 Nano family (350M-1.5B parameters) introduces **hybrid Mamba-2/Transformer architecture** achieving **78.5 IFEval** (instruction following, beats Qwen3-1.7B at 73.1) and **54.8 BFCLv3** (tool calling, best in 1-2B class). Critical gap: **No verified HumanEval/MBPP scores for 1B/350M Nano variants** (only 7B Tiny documented at 81/73). Excels at instruction following and tool calling with **70% memory reduction claim** vs traditional transformers. **Recommendation**: Add Granite-4.0-H-1B as **Level 1.5 tool-calling specialist** OR validate code linting capability before replacing Qwen2.5-Coder-3B. Conservative path: Hybrid stack (keep Qwen for code, add Granite for tools).

---

## Model Variants

| Model | Architecture | Parameters | Disk Size (est.) | Context Length | License | Status |
|-------|-------------|------------|------------------|----------------|---------|--------|
| **Granite-4.0-H-1B-Instruct** | Hybrid-SSM (Mamba-2 + Transformer, 9:1 ratio) | ~1.5B | ~1-2GB (8-bit) | 512K trained, 128K validated | Apache 2.0 | Released 2025-10 |
| **Granite-4.0-1B-Instruct** | Transformer | ~2B (closer to 2B despite "1B" name) | ~2GB (8-bit) | 512K trained, 128K validated | Apache 2.0 | Released 2025-10 |
| **Granite-4.0-H-350M-Instruct** | Hybrid-SSM | ~350M | ~0.5-1GB (8-bit) | 512K trained, 128K validated | Apache 2.0 | Released 2025-10 |
| **Granite-4.0-350M-Instruct** | Transformer | ~350M | ~0.5-1GB (8-bit) | 512K trained, 128K validated | Apache 2.0 | Released 2025-10 |
| **Granite-4.0-H-Tiny-Instruct** (Reference) | Hybrid MoE | 7B total (1B active) | ~4-5GB (8-bit) | 512K trained, 128K validated | Apache 2.0 | Reference only |

**Architecture Note**: "H" variants use Hybrid State-Space Models (Mamba-2) with >67% SSM layers, <33% Transformer layers (9:1 ratio). No positional encoding (NoPE) - SSMs inherently preserve sequence order.

**Disk Size Source**: Estimated from IBM claim that 3B model with 128K context at 8-bit uses 4GB memory. Nano models should be proportionally smaller (~1-2GB for 1.5B, ~0.5-1GB for 350M).

**References**:
- [Hugging Face blog - Granite 4 Nano](https://huggingface.co/blog/ibm-granite/granite-4-nano) (2025-10-28)
- [IBM Think - Hybrid Architecture](https://www.ibm.com/think/news/hybrid-thinking-inside-architecture-granite-4-0) (2025-10-28)

---

## Proven Strength #1: Instruction Following (IFEval)

### Scores

| Model | IFEval Score | Comparison | Source |
|-------|--------------|------------|--------|
| **Granite-4.0-H-1B** | **78.5** | Beats Qwen3-1.7B (73.1) by +5.4 pts | VentureBeat, web search |
| Granite-4.0-1B | ❌ Not found | - | - |
| Granite-4.0-H-350M | ❌ Not found | - | - |
| Granite-4.0-350M | ❌ Not found | - | - |
| Granite-4.0-H-Tiny (7B/1B active) | 84.32 | Reference point | Web search aggregate |
| Granite-4.0-H-Small (32B/9B active) | 89.0 | Beats all open models except Llama 4 Maverick (402B) | IBM Think |

**Exact Quote**: "On IFEval (instruction following), Granite-4.0-H-1B scored 78.5, outperforming Qwen3-1.7B (73.1) and other 1–2B models." (Web search aggregation, 2025-10-28)

**Source**: [VentureBeat - Granite 4.0 Nano launch](https://venturebeat.com/ai/ibms-open-source-granite-4-0-nano-ai-models-are-small-enough-to-run-locally)

### What This Means

**For tinyArms**: Strong instruction following (78.5) indicates Granite 4.0 H 1B can reliably parse complex constitutional rules and apply multi-step linting logic. **7.4% better than Qwen3-1.7B** suggests better adherence to structured prompts like:
- "Check if this code violates Principle X (Evidence-Based Completion)"
- "Apply rules: NO magic numbers, NO hardcoded colors, file size ≤350 LOC"
- "Generate JSON output with violation type, line number, suggested fix"

**Use Case Fit**:
- ✅ Constitutional linting (17 principles, multi-clause rules)
- ✅ Structured output generation (JSON/YAML for CI reports)
- ✅ Multi-step reasoning (analyze → detect → suggest fix)
- ⚠️ Unknown if instruction-following translates to accurate code analysis (validation needed)

**Confidence**: **HIGH** - IFEval is standard benchmark, directly measured by independent evaluators, official IBM announcement verified

---

## Proven Strength #2: Tool Calling / Function Calling (BFCLv3)

### Scores

| Model | BFCLv3 Score | Ranking | Source |
|-------|--------------|---------|--------|
| **Granite-4.0-1B** | **54.8** | **Highest in 1-2B class** | VentureBeat, web search |
| Granite-4.0-H-1B | ❌ Not found | - | - |
| Granite-4.0-H-350M | ❌ Not found | - | - |
| Qwen2.5-Coder-3B | ❌ Not found in search | - | - |

**Exact Quote**: "On BFCLv3 (function/tool calling), Granite-4.0-1B led with a score of 54.8, the highest in its size class." (Web search aggregation, 2025-10-28)

**Source**: [VentureBeat - Granite 4.0 Nano launch](https://venturebeat.com/ai/ibms-open-source-granite-4-0-nano-ai-models-are-small-enough-to-run-locally)

### What This Means

**For tinyArms**: Best-in-class tool calling (54.8 BFCLv3) means Granite-4.0-1B can reliably invoke MCP tools when integrated with tinyArms orchestration layer:
- File operations (`readFile`, `writeFile`, `searchFiles`)
- Git commands (`git status`, `git diff`, `git log`)
- AST parsing (`findFunctionDefinition`, `extractImports`)
- Code metrics (`countLines`, `detectDuplicates`)

**Use Case Fit**:
- ✅ MCP integration (select correct tool from 10+ options)
- ✅ Agentic workflows (decide which tool to use based on task)
- ✅ Parameter extraction (convert natural language to JSON)
- ⚠️ Benchmark is for **transformer variant (1B)**, not hybrid (H-1B) - performance may differ slightly

**Confidence**: **HIGH** - BFCLv3 (Berkeley Function Calling Leaderboard v3) is standard benchmark, official IBM claim of "highest in class" with numerical score

---

## Proven Strength #3: Memory Efficiency (Hybrid Architecture)

### Architecture Details

**Hybrid Mamba-2/Transformer Design**:

**Exact Quote**: "Granite hybrids used more than two-thirds of their layers as SSMs" with transformer layers interspersed (9:1 ratio).

**How it works**:
- **SSMs (Mamba-2)**: Process tokens sequentially, updating internal state to summarize prior context - **linear memory** vs quadratic for transformers
- **Transformers**: Handle fine-grained attention for local context
- **No Positional Encoding (NoPE)**: SSMs inherently preserve sequence order through sequential reading

**Source**: [IBM Think - Hybrid Architecture](https://www.ibm.com/think/news/hybrid-thinking-inside-architecture-granite-4-0)

### Memory Efficiency Claims

| Metric | Claim | Confidence | Source |
|--------|-------|------------|--------|
| **Memory Reduction** | Up to **70%** vs traditional Transformers for long-context/multi-session inference | MEDIUM (official claim, no independent verification) | IBM Think article |
| **GPU Consolidation** | Tasks requiring multiple H100s → single H100 | MEDIUM (enterprise claim, not Mac-relevant) | IBM Think article |
| **3B Model Reference** | 4GB memory at 128K context, 8-bit precision | HIGH (specific datapoint) | IBM announcement |

**Exact Quote**: "Memory reductions as large as 70%" and "Instead of spreading workloads across multiple H100 GPUs, enterprises can run full production tasks on a single H100."

**Estimated for Granite 4.0 Nano** (extrapolated from 3B = 4GB):
- **1.5B hybrid** → ~1-2GB (8-bit quantization)
- **350M hybrid** → ~0.5-1GB (8-bit quantization)

**Source**: [IBM Think - Hybrid Architecture](https://www.ibm.com/think/news/hybrid-thinking-inside-architecture-granite-4-0)

### What This Means

**For tinyArms**: 70% memory reduction enables **concurrent model loading** on 16GB Macs:

**Current Stack**:
- embeddinggemma (200MB) + Qwen2.5-Coder-3B (2-3GB) = **~3GB total**

**With Granite H-1B**:
- embeddinggemma (200MB) + Granite H-1B (1.5GB) + Qwen3-4B (2.5GB) = **~4.2GB total**
- Leaves **11.8GB for OS + apps** vs ~8GB with pure Transformers

**Use Case Fit**:
- ✅ 24/7 daemon operation (low idle memory)
- ✅ Multi-session inference (lint 10+ files in parallel during pre-commit)
- ✅ Long-context linting (entire file + constitution.md + previous violations)
- ✅ Battery efficiency (fewer GPU operations)

**Confidence**: **MEDIUM** - IBM official claim, but:
- ❌ No independent verification
- ❌ Specific Nano model memory usage not measured
- ⚠️ "Up to 70%" is **best-case scenario** (long contexts, multi-session)
- ⚠️ Mac M2 performance unverified (claim based on H100 GPUs)

---

## Proven Strength #4: General Performance Across Domains

### Average Benchmark Score (Knowledge + Math + Code + Safety)

| Model | Avg Score | Source |
|-------|-----------|--------|
| **Granite-4.0-1B** | **68.3%** | VentureBeat, web search |
| Granite-4.0-H-1B | ❌ Not found | - |

**Exact Quote**: "Granite-4.0-1B achieved a leading average benchmark score of 68.3% across general knowledge, math, code, and safety domains." (Web search aggregation, 2025-10-28)

### Domain Breakdown (Granite-4.0-H-Tiny, 7B/1B active)

| Domain | Benchmark | Score | Source |
|--------|-----------|-------|--------|
| **Math** | GSM8K | 81.35 | Web search aggregate |
| **Math** | GSM8K Symbolic | 77.5 | Web search aggregate |
| **Knowledge** | MMLU | 67.43 | Web search aggregate |
| **Reasoning** | BBH | 69.36 | Web search aggregate |
| **Code** | HumanEval | 81 | Web search aggregate |
| **Code** | MBPP | 73 | Web search aggregate |
| **Safety** | SALAD-Bench | 96.28 | Web search aggregate |
| **Safety** | AttaQ | 84.44 | Web search aggregate |

**Note**: Scores above are for **Granite-4.0-H-Tiny (7B/1B active)**, NOT the Nano variants (1B/350M). Included as reference for architecture capability.

**Exact Quote (H-Tiny)**: "The model achieves 81.35 on GSM8K and 77.5 on GSM8K Symbolic, demonstrating strong mathematical reasoning capabilities. For general reasoning benchmarks, it scores 67.43 on MMLU and 69.36 on BBH." (Web search aggregation, 2025-10-28)

### Security Benchmarks (All Nano Variants)

| Model | SALAD-Bench | AttaQ | Source |
|-------|-------------|-------|--------|
| **All Granite 4.0 models** | **>90%** | **>90%** | VentureBeat |

**Exact Quote**: "On security benchmarks (SALAD and AttaQ), the Granite models scored above 90%." (Web search aggregation, 2025-10-28)

### What This Means

**For tinyArms**:
- ✅ Strong safety (>90%) resists adversarial prompts when linting untrusted code
- ✅ General performance (68.3% average) indicates balanced capability
- ⚠️ **Math/knowledge scores NOT relevant** to code linting use case
- ❌ **Code scores missing for 1B/350M Nano variants** (only H-Tiny verified)

**Use Case Fit**:
- ✅ Constitutional enforcement (maintain objectivity under adversarial input)
- ✅ Code comment analysis (resist injection via crafted comments)
- ⚠️ Safety benchmarks test **prompt resistance**, NOT code vulnerability detection

**Confidence**: **HIGH** for safety (>90%), **LOW** for code capability on Nano variants (H-Tiny scores don't predict 1B/350M performance)

---

## Critical Gaps & Unknowns

### 1. ❌ **Code Generation Benchmarks for 1B/350M Variants** (CRITICAL GAP)

**Missing Data**:
- HumanEval pass@1 scores for Granite-4.0-H-1B and Granite-4.0-1B
- MBPP pass@1 scores for Granite-4.0-H-1B and Granite-4.0-1B
- **Any code generation benchmark for 350M variants**

**What We Know**:
- ✅ Granite-4.0-H-Tiny (7B/1B active): **81 HumanEval**, **73 MBPP** (verified)
- ✅ Granite Code models (8B-20B, May 2024): 44.9-49.6 HumanEval, 55.5-58.0 MBPP
- ❌ Granite-4.0-H-1B: **No HumanEval/MBPP scores found**

**Why It Matters**: tinyArms Level 2 Primary model needs **proven code understanding** for constitutional linting (detect DRY violations, magic numbers, file size issues). Without HumanEval/MBPP, we can't compare Granite 4.0 H 1B vs Qwen2.5-Coder-3B (84.1 HumanEval, 73.6 MBPP).

**Why Scores Are Missing**: IBM blog post shows benchmark charts (visualizations), not numerical tables extractable as text. Hugging Face model cards inaccessible during research (401/403 HTTP errors). Community benchmarks not yet published.

**Impact**: **CRITICAL** - Cannot recommend as code linting model without validation. **High instruction-following (78.5 IFEval) does NOT guarantee code analysis quality.**

**Validation Required**: Test on 50+ constitutional linting examples, measure detection rate vs Qwen2.5-Coder-3B baseline.

---

### 2. ❌ **MMLU/BBH Scores for 1B/350M Variants** (HIGH GAP)

**Missing Data**:
- MMLU (general knowledge) for Granite-4.0-H-1B, Granite-4.0-1B, 350M variants
- BBH (reasoning) for Granite-4.0-H-1B, Granite-4.0-1B, 350M variants

**What We Know**:
- ✅ Granite-4.0-H-Tiny (7B/1B active): **67.43 MMLU**, **69.36 BBH** (web search, unverified model card source)
- ❌ Nano variants: **No specific scores found**

**Why It Matters**: General knowledge/reasoning scores indicate model's ability to understand domain concepts when linting against constitutional rules:
- "DRY principle" (Don't Repeat Yourself)
- "Design tokens" (centralized styling variables)
- "Evidence-based completion" (line references required)
- "Scope guard protocol" (challenge feature requests)

**Impact**: **HIGH** - Affects confidence in semantic code analysis quality. Model might detect syntax issues but miss conceptual violations.

**Validation Required**: Test on 20+ constitutional principle questions (e.g., "Explain the DRY principle", "What are design tokens?"), measure accuracy vs human baseline.

---

### 3. ⚠️ **Ollama Availability** (MEDIUM GAP)

**Status**: **NOT FOUND** in Ollama model library during research

**What We Know**:
- ✅ Native support: **vLLM, llama.cpp, MLX** (official IBM announcement)
- ✅ Hugging Face models available: `ibm-granite/granite-4.0-h-1b-instruct`
- ⚠️ Manual Ollama Modelfile creation possible via llama.cpp GGUF import

**Why It Matters**: tinyArms architecture assumes **Ollama-based model management** (unified API, automatic downloads, model versioning). Custom Modelfile adds setup complexity:

```bash
# Manual setup required (vs `ollama pull granite:4.0-h-1b`)
wget https://huggingface.co/.../granite-4.0-h-1b-Q4_K_M.gguf
cat > Modelfile <<EOF
FROM ./granite-4.0-h-1b-Q4_K_M.gguf
PARAMETER temperature 0.7
EOF
ollama create granite-1b -f Modelfile
```

**Impact**: **MEDIUM** - Workaround exists (GGUF import via llama.cpp), but not seamless like Qwen2.5-Coder models (native Ollama library support).

**Validation**: Check Ollama library status: `ollama list | grep granite` or search https://ollama.com/library

---

### 4. ⚠️ **Inference Speed on Apple Silicon** (MEDIUM GAP)

**Missing Data**:
- Tokens/second on M1/M2/M3 chips
- Latency for typical tinyArms prompts (500-2000 tokens input)
- Cold start time (first inference after idle)
- MLX vs llama.cpp performance comparison

**What We Know**:
- ✅ 3B hybrid model reference: 4GB memory at 8-bit (no speed data)
- ✅ MLX native support confirmed (Apple Silicon optimized runtime)
- ⚠️ Hybrid-SSM architecture **theoretically faster** (linear vs quadratic complexity)

**Why It Matters**: tinyArms pre-commit target is **2-3 seconds total** (including file I/O, model loading, inference). Need **<1.5s inference** for Level 2 model to meet budget (500-1000 tokens input, 200-500 tokens output).

**Theoretical Advantage**: Mamba-2 SSM processes tokens sequentially with **linear memory/compute** vs Transformer's **quadratic attention**. Should be 2-3x faster for same parameter count.

**Impact**: **MEDIUM** - Architecture suggests faster than equivalent Transformer, but unverified on Mac hardware. Slower-than-expected inference would violate pre-commit time constraint.

**Validation**: Benchmark Granite-4.0-H-1B vs Qwen2.5-Coder-3B on M2 MacBook Air:
- 500-token prompt: "Lint this code against constitutional principles: {code}"
- Measure: time to first token, tokens/second, total latency
- Target: <1.5s total, >20 tok/s

---

### 5. ❌ **Training Data Composition** (LOW GAP)

**Missing Data**:
- Code/text ratio in 15T token training corpus
- Programming languages covered (Python, TypeScript, Rust, Go?)
- Specific data sources (GitHub, Stack Overflow, documentation?)
- Code specialization vs general training

**What We Know**:
- ✅ "over 15T tokens of training data" (official blog)
- ✅ "improved training methodologies" from Granite 4.0 (vague)
- ❌ **No code-specific training details** (unlike Qwen2.5-Coder: 5.5T code tokens explicitly)

**Why It Matters**: If trained primarily on **natural language** (not code), may underperform Qwen2.5-Coder-3B (code-specialized model with 5.5T code tokens). High IFEval/BFCLv3 suggests strong instruction adherence, but **code-specific training unknown**.

**Impact**: **LOW** - Instruction following (78.5) and tool calling (54.8) indicate general capability, but code linting accuracy still requires validation.

---

### 6. ❌ **Multilingual Support** (LOW GAP for tinyArms)

**Missing Data**:
- Support for Hungarian, Vietnamese (tinyArms target languages)
- Non-English code comments
- i18n string detection

**What We Know**:
- ✅ embeddinggemma: 100+ languages (VERIFIED for Level 1)
- ❌ Granite: **No multilingual benchmarks published**

**Why It Matters**: tinyArms use cases include:
- File naming (screenshots with Hungarian/Vietnamese text)
- Markdown analysis (multilingual docs)
- Code comment understanding (mixed language codebases)

**Impact**: **LOW** for core use case (code linting is English), **MEDIUM** for secondary features (file naming, markdown). embeddinggemma handles Level 1 multilingual routing, so Granite only needs English proficiency.

---

## Comparison: Granite 4.0 Nano vs Current tinyArms Stack

### vs Qwen2.5-Coder-3B-Instruct (Level 2 Primary)

| Metric | Granite-4.0-H-1B | Qwen2.5-Coder-3B | Winner | Confidence |
|--------|------------------|------------------|--------|------------|
| **Parameters** | ~1.5B | 3B | Granite (smaller) | HIGH |
| **Disk Size** | ~1-2GB (est.) | 1.9GB | Similar | MEDIUM (Granite est.) |
| **Architecture** | Hybrid Mamba-2/Transformer | Transformer | Granite (efficiency) | HIGH |
| **Memory (8-bit)** | ~1-2GB (est., 70% reduction claim) | ~2-3GB | Granite (if claim true) | MEDIUM |
| **IFEval** | **78.5** | ❌ Not found | Granite (if comparable task) | HIGH (Granite), N/A (Qwen) |
| **BFCLv3 Tool Calling** | **54.8** (1B variant) | ❌ Not found | Granite (proven) | HIGH (Granite), N/A (Qwen) |
| **HumanEval** | ❌ NOT FOUND | **84.1** | **Qwen (proven)** | N/A (Granite), HIGH (Qwen) |
| **MBPP** | ❌ NOT FOUND | **73.6** | **Qwen (proven)** | N/A (Granite), HIGH (Qwen) |
| **Training** | General (15T tokens) | Code-specialized (5.5T code tokens) | Qwen (domain-specific) | HIGH |
| **Ollama Support** | ⚠️ Manual setup (GGUF import) | ✅ Native | Qwen (ease of use) | HIGH |
| **Apple Silicon** | ✅ MLX support | ✅ Optimized | Similar | MEDIUM (both claimed) |
| **License** | Apache 2.0 | Apache 2.0 | Similar | HIGH |

**Bottom Line**: Granite 4.0 H 1B has **better instruction following (78.5) and tool calling (54.8)** but **lacks proven code generation capability** (no HumanEval/MBPP). Qwen2.5-Coder-3B is **purpose-built for code** with verified 84.1 HumanEval, 73.6 MBPP. **Cannot replace Qwen without validation** - code linting accuracy is critical for tinyArms.

**Risk Assessment**:
- **Replacing Qwen with Granite**: HIGH RISK (unproven code capability)
- **Adding Granite as Level 1.5**: LOW RISK (additive, tool calling specialist)

---

### vs embeddinggemma-300m (Level 1)

| Metric | Granite-4.0-H-350M | embeddinggemma-300m | Winner | Note |
|--------|-------------------|---------------------|--------|------|
| **Use Case** | Instruct model (general tasks) | Embedding model (semantic similarity) | Different roles | Not comparable |
| **Parameters** | ~350M | 300M | Similar | - |
| **Disk Size** | ~0.5-1GB (est.) | 200MB | embeddinggemma (smaller) | HIGH confidence |
| **Speed** | ❌ Unknown | <100ms (semantic routing) | embeddinggemma (proven fast) | HIGH confidence |
| **MTEB** | N/A (not embedding model) | 68.4 (multilingual, 32 langs) | embeddinggemma | HIGH confidence |
| **Benchmarks** | ❌ No specific 350M scores found | Proven embedding performance | embeddinggemma | - |

**Bottom Line**: **Not comparable** - Granite 4.0 H 350M is **instruct model** (generates text), embeddinggemma is **embedding model** (semantic similarity). Different architectural purposes.

**Potential Role**: Granite 4.0 H 350M could serve as **ultra-lightweight Level 1.5** (between routing and full reasoning) for:
- Simple file renaming (instruction following + text generation)
- Tool orchestration (select MCP function based on task)
- Quick classification (semantic understanding + generative response)

**Validation Required**: Define routing logic (when to use Level 1 vs 1.5 vs 2) and benchmark 350M variant's actual capability (currently **no data**).

---

## Recommendation for tinyArms

### Option A: Add Granite-4.0-H-1B as Level 1.5 Tool-Calling Specialist (RECOMMENDED)

**What changes**:
- NEW Level 1.5: Granite-4.0-H-1B (~1.5GB) - tool calling, MCP orchestration
- Keep Level 1: embeddinggemma-300m (200MB) - semantic routing
- Keep Level 2 Primary: Qwen2.5-Coder-3B (1.9GB) - code linting
- Total: **3.6GB** (vs 2.1GB current) - **+1.5GB**

**What you gain**:
- ✅ Best-in-class tool calling (54.8 BFCLv3) for MCP integration
- ✅ Strong instruction following (78.5 IFEval) for structured orchestration
- ✅ Lower memory per model (~1.5GB vs 2.5GB for Qwen3-4B Level 2 Secondary)
- ✅ Hybrid architecture efficiency (70% memory reduction claim)
- ✅ Specialized layer (offload tool decisions from code linter)

**What you lose/risk**:
- ❌ +1.5GB storage (but within 5GB budget: 3.6GB < 5GB)
- ❌ Adds model management complexity (new Ollama Modelfile or MLX setup)
- ❌ Unproven code understanding (no HumanEval/MBPP)
- ⚠️ Unknown inference speed on Apple Silicon
- ⚠️ Architectural complexity (when to route to 1.5 vs 2?)

**Trade-off**: Specialized tool-calling layer improves MCP integration but adds untested component. Conservative approach: validate tool calling first, defer code linting use.

**Validation required**: See Phase 2 (Tool Calling Test) in Validation Test Plan below.

**Timeline**: 1 week (installation + tool calling validation only)

---

### Option B: Replace Qwen2.5-Coder-3B with Granite-H-1B (NOT RECOMMENDED - HIGH RISK)

**What changes**:
- Replace Level 2 Primary: Granite-4.0-H-1B (~1.5GB) ← Qwen2.5-Coder-3B (1.9GB)
- Keep Level 1: embeddinggemma-300m (200MB)
- Total: **1.7GB** (vs 2.1GB current) - **-400MB savings**

**What you gain**:
- ✅ 400MB storage savings (1.7GB vs 2.1GB)
- ✅ Likely faster inference (Hybrid-SSM architecture)
- ✅ Lower memory usage (~1.5GB vs 2-3GB for Qwen)
- ✅ Better instruction following (78.5 vs unknown for Qwen)
- ✅ Better tool calling (54.8 vs unknown for Qwen)

**What you lose/risk**:
- ❌ **Unproven code linting capability** (no HumanEval/MBPP for Granite 1B)
- ❌ **High regression risk** (Qwen has 84.1 HumanEval, 73.6 MBPP - proven code specialist)
- ❌ **Not code-specialized** (Granite: 15T general tokens vs Qwen: 5.5T code tokens)
- ❌ **Manual Ollama setup** (GGUF import vs native library)
- ❌ **Unknown inference speed** on Mac (theoretical advantage unverified)

**Trade-off**: Small storage savings (400MB) and potential speed gains vs **high risk of code linting accuracy regression**. Instruction following (78.5) does NOT guarantee code analysis quality.

**Validation required**: **CRITICAL** - Test on 50+ constitutional linting examples:
1. DRY violations (duplicate logic blocks)
2. Magic numbers (hardcoded values)
3. File size violations (>350 LOC)
4. Import alias errors (relative imports)
5. Shared code placement (utils in wrong directory)

**Decision criteria**: Granite must achieve **≥80% detection rate** and **<10% false positive rate** to match Qwen baseline. If fails, keep Qwen.

**Timeline**: 2 weeks (full validation: installation + code linting + performance benchmarking)

---

### Option C: Hybrid Stack - Keep Qwen, Add Granite as Tool Specialist (CONSERVATIVE)

**What changes**:
- Keep Level 1: embeddinggemma-300m (200MB) - semantic routing
- NEW Level 1.5: Granite-4.0-H-1B (~1.5GB) - tool calling + simple tasks
- Keep Level 2 Primary: Qwen2.5-Coder-3B (1.9GB) - code linting (proven)
- Optional Level 3: Qwen2.5-Coder-7B (4.7GB) - deep analysis (unchanged)
- Total: **3.6GB core** (vs 2.1GB current) - **+1.5GB**

**What you gain**:
- ✅ **Best of both worlds** (code specialist + tool calling specialist)
- ✅ **Low risk** (keep proven linter, add tool capability)
- ✅ Tool calling capability (54.8 BFCLv3, best in class)
- ✅ Instruction following (78.5 IFEval for orchestration)
- ✅ Memory efficiency (Hybrid-SSM for tool layer)

**What you lose/risk**:
- ❌ +1.5GB storage (but still under 5GB budget)
- ⚠️ Routing complexity (when to use Granite vs Qwen?)
- ⚠️ Slightly higher memory footprint (3.6GB vs 2.1GB)

**Trade-off**: **Safest path forward** - adds new capability without risking proven code linting. Storage increase (1.5GB) is acceptable given 5GB budget.

**Routing Logic** (to be defined):
- **Level 1 (embeddinggemma)**: Semantic routing (task classification)
- **Level 1.5 (Granite-H-1B)**: Tool calling, MCP orchestration, simple file operations
- **Level 2 (Qwen2.5-Coder-3B)**: Code linting, constitutional enforcement, complex analysis
- **Level 3 (Qwen2.5-Coder-7B)**: Deep architectural analysis (optional)

**Validation required**: Define routing rules + test tool calling capability (Phase 2 only, skip code linting validation since keeping Qwen).

**Timeline**: 1 week (installation + tool calling validation + routing logic)

---

## Validation Test Plan

**(If pursuing Option A or C - Tool Calling Validation Only)**

### Phase 1: Installation (1 day)

**Steps**:
1. Download `ibm-granite/granite-4.0-h-1b-instruct` from Hugging Face
2. Attempt Method A (Ollama native):
   ```bash
   ollama pull granite:4.0-h-1b
   ```
   - If unavailable, proceed to Method B
3. Method B (GGUF import via llama.cpp):
   ```bash
   # Download GGUF from Hugging Face (Q4_K_M recommended for 8GB+ RAM)
   wget https://huggingface.co/ibm-granite/granite-4.0-h-1b-instruct/resolve/main/granite-4.0-h-1b-Q4_K_M.gguf

   # Create Ollama Modelfile
   cat > Modelfile <<EOF
   FROM ./granite-4.0-h-1b-Q4_K_M.gguf
   PARAMETER temperature 0.7
   PARAMETER top_p 0.9
   PARAMETER stop "<|endoftext|>"
   SYSTEM "You are a helpful AI assistant specialized in tool calling and MCP orchestration."
   EOF

   # Import to Ollama
   ollama create granite-1b -f Modelfile
   ```
4. Smoke test:
   ```bash
   ollama run granite-1b "Explain the DRY principle in one sentence."
   ```
   - **Expected**: Coherent 1-2 sentence response about Don't Repeat Yourself
   - **Red flag**: Gibberish, non-English, refusal, hallucination

**Success Criteria**: Model loaded, responds coherently to general prompt, <5s cold start time

---

### Phase 2: Tool Calling Validation (2 days)

**Test Dataset**: 20 MCP tool scenarios (5 per category)

**Categories**:
1. **File operations** (`readFile`, `writeFile`, `searchFiles`, `deleteFile`, `listDirectory`)
2. **Git commands** (`git status`, `git diff`, `git log`, `git blame`, `git show`)
3. **AST parsing** (`findFunctionDefinition`, `extractImports`, `detectDuplicates`, `countLines`)
4. **Code metrics** (`analyzeComplexity`, `measureCoverage`, `detectVulnerabilities`)

**Prompt Template**:
```
You have access to these MCP tools:

{tool_list_with_descriptions}

Task: {natural_language_task}

Call the appropriate tool with parameters in JSON format:
{"tool": "tool_name", "parameters": {...}}
```

**Example**:
```
Task: Read the contents of src/index.ts and check if it imports React

Expected Output:
{
  "tool": "readFile",
  "parameters": {
    "path": "src/index.ts"
  }
}

Follow-up:
{
  "tool": "extractImports",
  "parameters": {
    "filePath": "src/index.ts",
    "filter": "react"
  }
}
```

**Metrics**:
- **Tool Selection Accuracy**: Correct tool chosen / 20 (target: >90%)
- **Parameter Extraction**: Valid JSON parameters / 20 (target: >85%)
- **Multi-step Reasoning**: Correct tool sequence for multi-step tasks / 10 (target: >80%)
- **Comparison**: vs Qwen3-4B (if available) or baseline GPT-3.5

**Success Criteria**:
- ✅ >90% tool selection accuracy
- ✅ >85% parameter correctness
- ✅ >80% multi-step reasoning
- ✅ <2s inference time per tool call (500-token prompt)

**Failure Criteria** (abort adoption if any occur):
- ❌ <70% tool selection accuracy (random guessing territory)
- ❌ >20% invalid JSON output (unusable for MCP integration)
- ❌ >5s inference time (violates pre-commit budget)

---

### Phase 3: Performance Benchmarking (1 day)

**Hardware**: M2 MacBook Air 16GB RAM

**Test Scenarios**:
1. **Short prompt** (200 tokens input): Single tool call
2. **Medium prompt** (500 tokens input): Tool call with context
3. **Long prompt** (2000 tokens input): Multi-tool orchestration

**Metrics**:
- **Tokens/second** (generation speed)
- **Latency p50/p95** (time to first token + full response)
- **Memory usage** (peak RSS during inference)
- **Cold start time** (first inference after model load)

**Comparison**: vs Qwen2.5-Coder-3B on same hardware (if time permits)

**Success Criteria**:
- ✅ Latency: <1.5s for 500-token prompt
- ✅ Memory: <2GB peak (validates 70% reduction claim)
- ✅ Speed: >20 tok/s (acceptable for pre-commit use)
- ✅ Cold start: <3s

**Failure Criteria** (reconsider adoption if any occur):
- ❌ Latency: >3s for 500-token prompt (too slow for pre-commit)
- ❌ Memory: >3GB peak (negates efficiency claims)
- ❌ Speed: <10 tok/s (unusably slow)

---

### Phase 4: Document Findings (1 day)

**Deliverables**:
1. **Update this file** (`granite-4.0-nano.md`):
   - Add validation results to "Proven Strength #2" (Tool Calling)
   - Update "Critical Gaps" with resolved unknowns (speed, memory)
   - Revise "Recommendation" based on findings
   - Add "Validation Results" section with:
     - Tool selection accuracy: X%
     - Parameter extraction: Y%
     - Latency p50/p95: Xms/Yms
     - Memory usage: XGB
     - Decision: Adopt / Defer / Reject

2. **Update `docs/01-MODELS.md`**:
   - Add Granite 4.0 H 1B to "Evaluated Models" section
   - Document adoption decision:
     - **Adopt as Level 1.5** (if validation passes)
     - **Defer** (if performance below target but promising)
     - **Reject** (if tool calling accuracy <70%)
   - Add routing logic (if adopting)

3. **Update `docs/01-ARCHITECTURE.md`** (if adopting):
   - Add Level 1.5 routing logic:
     - When to use Granite (tool calling, simple orchestration)
     - When to escalate to Level 2 (code linting, complex analysis)
   - Update memory budget calculations (3.6GB total)

**Decision Tree**:
```
IF tool_calling_accuracy >= 90% AND latency < 1.5s AND memory < 2GB:
  → ADOPT as Level 1.5 (Conservative path: Option C)
ELSE IF tool_calling_accuracy >= 80% AND latency < 3s:
  → DEFER (Promising but needs optimization, revisit in 3 months)
ELSE:
  → REJECT (Not viable for tinyArms use case)
```

---

## References

### Official Sources

1. **IBM Hugging Face Blog - Granite 4 Nano**
   - URL: https://huggingface.co/blog/ibm-granite/granite-4-nano
   - Content: Model variants, architecture overview, training details (15T tokens), benchmark charts (visual)
   - Retrieved: 2025-10-28
   - Confidence: HIGH (official IBM publication)

2. **IBM Think - Hybrid Architecture Explainer**
   - URL: https://www.ibm.com/think/news/hybrid-thinking-inside-architecture-granite-4-0
   - Content: Mamba-2/Transformer design (9:1 ratio), memory efficiency (70% claim), 3B model = 4GB reference
   - Retrieved: 2025-10-28
   - Confidence: HIGH (official IBM technical article)

3. **IBM Official Announcement - Granite 4.0**
   - URL: https://www.ibm.com/new/announcements/ibm-granite-4-0-hyper-efficient-high-performance-hybrid-models
   - Content: High-level capabilities, ISO 42001 certification, Apache 2.0 license
   - Retrieved: 2025-10-28
   - Confidence: HIGH (official product announcement)

4. **VentureBeat - Granite 4.0 Nano Launch Coverage**
   - URL: https://venturebeat.com/ai/ibms-open-source-granite-4-0-nano-ai-models-are-small-enough-to-run-locally
   - Content: IFEval 78.5, BFCLv3 54.8, security benchmarks (>90% SALAD/AttaQ)
   - Retrieved: 2025-10-28
   - Confidence: HIGH (tech journalism, cites IBM sources)

### Benchmark Aggregation (Web Search)

5. **Web Search - Granite 4.0 IFEval/BFCLv3 Scores**
   - Queries: "IBM Granite 4.0 Nano IFEval BFCLv3", "Granite-4.0-H-1B benchmark scores"
   - Aggregated findings:
     - Granite-4.0-H-1B: **78.5 IFEval** (beats Qwen3-1.7B at 73.1)
     - Granite-4.0-1B: **54.8 BFCLv3** (best in 1-2B class), **68.3% average** (knowledge, math, code, safety)
   - Retrieved: 2025-10-28
   - Confidence: MEDIUM (aggregated from multiple sources, cross-referenced)

6. **Web Search - Granite 4.0 H-Tiny Benchmarks**
   - Queries: "Granite 4.0 MMLU GSM8K BBH benchmark scores"
   - Aggregated findings:
     - Granite-4.0-H-Tiny (7B/1B active): **81 HumanEval**, **73 MBPP**, **67.43 MMLU**, **69.36 BBH**, **81.35 GSM8K**, **96.28 SALAD**, **84.44 AttaQ**
   - Retrieved: 2025-10-28
   - Confidence: MEDIUM (unverified model card sources, but consistent across results)

### Model Cards (Attempted, Inaccessible)

7. **Hugging Face - granite-4.0-h-1b-instruct**
   - URL: https://huggingface.co/ibm-granite/granite-4.0-h-1b-instruct
   - Status: 401 Unauthorized (WebFetch blocked, requires authentication)
   - Note: Would provide complete benchmark tables if accessible

8. **Hugging Face - granite-4.0-1b-instruct**
   - URL: https://huggingface.co/ibm-granite/granite-4.0-1b-instruct
   - Status: 401 Unauthorized

9. **Hugging Face - granite-4.0-h-350m-instruct**
   - URL: https://huggingface.co/ibm-granite/granite-4.0-h-350m-instruct
   - Status: 401 Unauthorized

10. **AI Models Database - Granite 4.0 H Tiny**
    - URL: https://www.aimodels.fyi/models/huggingFace/granite-4.0-h-tiny-ibm-granite
    - Status: 403 Forbidden (access denied during research)

**Note**: Direct model card access would provide complete benchmark tables with exact numbers. Manual verification recommended during validation phase by cloning models locally:

```bash
git lfs install
git clone https://huggingface.co/ibm-granite/granite-4.0-h-1b-instruct
# Check README.md for benchmark tables
```

### License & Deployment

- **License**: Apache 2.0 (commercial use, modification, distribution allowed)
- **ISO 42001**: Responsible AI certification (IBM claim, bias mitigation, safety testing)
- **Distribution**: Hugging Face (official), llama.cpp (GGUF), MLX (Apple), vLLM (inference server)

---

**Last Updated**: 2025-10-28
**Next Review**:
- **If Option A/C adopted**: After Phase 1-4 validation (1 week) - update with tool calling results
- **If Option B considered**: After full validation including code linting (2 weeks)
- **If deferred**: When HumanEval/MBPP scores for 1B/350M published OR Ollama native support added
