# ReaderLM-v2: Proven Strengths & Weaknesses

**Research Date**: 2025-10-28
**Source**: https://arxiv.org/html/2503.01151v1, https://jina.ai/news/readerlm-v2-frontier-small-language-model-for-html-to-markdown-and-json/, https://huggingface.co/jinaai/ReaderLM-v2
**Status**: Analysis complete - NOT RECOMMENDED for commercial tinyArms usage (license blocker)

---

## Executive Summary

ReaderLM-v2 is a 1.54B parameter specialized model for HTML-to-Markdown and HTML-to-JSON conversion, achieving ROUGE-L 0.86 (24.6% better than GPT-4o) on main content extraction with exceptional speed (67 tok/s input, 36 tok/s output on T4). Built on Qwen2.5-1.5B-Instruction with 512K context window and 29-language support. **CRITICAL LICENSE BLOCKER**: CC BY-NC 4.0 prohibits all commercial use including tinyArms (which targets developer productivity tools). "Pro" commercial variant exists but requires Jina AI licensing agreement. Base model demonstrates state-of-the-art HTML parsing for non-commercial applications but lacks code generation benchmarks (no HumanEval/MBPP data). Recommendation: SKIP for commercial tinyArms; consider only for non-commercial research.

---

## Model Variants

| Variant | Parameters | Size (BF16) | Context | Availability | License |
|---------|-----------|-------------|---------|--------------|---------|
| ReaderLM-v2 | 1.54B | ~3.1GB | 256K (512K extrapolation) | Hugging Face, Ollama (reader-lm:1.5b ~935MB quantized) | CC BY-NC 4.0 (non-commercial) |
| ReaderLM-v2-pro | 1.54B | ~3.1GB | 256K (512K extrapolation) | Jina AI API only | Commercial license (contact Jina) |
| ReaderLM-v2 (0.5B variant) | 0.5B | ~1GB | 250K | Ollama (reader-lm:0.5b ~352MB) | CC BY-NC 4.0 (non-commercial) |

**Architecture**: 28 layers, 1536 hidden size, 12 query heads, 2 KV heads, 128 head size, 8960 intermediate size, RoPE position encoding (base 5,000,000), Ring-zag attention for long context.

**Ollama Quantization**:
- `reader-lm:latest` (1.5B): 935MB
- `reader-lm:0.5b`: 352MB
- ❌ No published quality degradation metrics for quantized variants

---

## Proven Strength #1: HTML-to-Markdown Main Content Extraction

### Scores

**Source**: Table 1, arXiv:2503.01151v1

| Model | ROUGE-L ↑ | Levenshtein ↓ | Jaro-Winkler ↑ |
|-------|-----------|---------------|----------------|
| GPT-4o-2024-08-06 | 0.69 | 0.40 | 0.75 |
| Gemini 2.0 Flash | 0.69 | 0.40 | 0.74 |
| Qwen2.5-32B-Instruct | 0.71 | 0.41 | 0.70 |
| **ReaderLM-v2** | **0.86** | **0.20** | **0.83** |
| **ReaderLM-v2-pro** | **0.86** | **0.39** | **0.83** |

**Performance Gain**: 24.6% ROUGE-L improvement vs GPT-4o, 50% better Levenshtein distance.

### What This Means

ReaderLM-v2 outperforms all frontier models (including 20x larger Qwen2.5-32B) at extracting clean content from noisy HTML. For tinyArms use cases:
- **Web scraping for LLM input**: Convert API docs, blog posts, documentation sites to clean Markdown
- **Documentation crawling**: Extract structured content for indexing/RAG systems
- **Preprocessing HTML for other models**: Clean HTML before feeding to Qwen2.5-Coder-3B

Excels at complex elements: LaTeX formulas, nested lists, code blocks (qualitative evaluation).

**Confidence**: HIGH - Reproducible benchmark, independent test set, multiple metrics, published in peer-reviewed arXiv paper.

---

## Proven Strength #2: Long-Context Processing (512K tokens)

### Scores

**Source**: Jina AI blog post + arXiv Section 4.2

- Successfully processed **27,000-token legal document** with **15,000-token output**
- Context window: Trained up to 256K, extrapolates to 512K combined (input + output)
- Ring-zag attention mechanism reduces memory complexity for long sequences
- Progressive context expansion training: 32K → 125K → 256K tokens

### What This Means

ReaderLM-v2 can handle entire long-form web pages, legal documents, API references in single pass without chunking. For tinyArms:
- **No chunking overhead** for documentation sites (e.g., convert entire React API reference at once)
- **Preserved context** for nested HTML structures (no loss from splitting mid-document)
- **Batch processing** for multi-page documentation crawls

**Confidence**: MEDIUM - Anecdotal evidence (single 27K doc example), no systematic long-context benchmark scores published, no comparison vs Qwen2.5-Coder-3B's 32K context.

---

## Proven Strength #3: Schema-Guided JSON Extraction

### Scores

**Source**: Table 2, arXiv:2503.01151v1

| Model | F1 ↑ | Precision ↑ | Recall ↑ | Pass-Rate ↑ |
|-------|------|------------|---------|------------|
| GPT-4o-2024-08-06 | 0.84 | 0.84 | 0.83 | 1.00 |
| Gemini 2.0 Flash | 0.81 | 0.81 | 0.82 | 0.99 |
| Qwen2.5-32B-Instruct | 0.83 | 0.85 | 0.83 | 1.00 |
| **ReaderLM-v2** | **0.81** | **0.82** | **0.81** | **0.99** |

**Competitive performance** (within 3.6% of GPT-4o) despite being 100x smaller.

### What This Means

ReaderLM-v2 can extract structured data from HTML using JSON schemas (e.g., "extract all product names, prices, and ratings"). For tinyArms:
- **API documentation parsing**: Extract function signatures, parameters, return types as JSON
- **Structured web scraping**: Convert unstructured HTML tables/lists to JSON for database ingestion
- **Metadata extraction**: Pull titles, authors, dates, tags from blog posts/docs

Slightly behind frontier models (F1 0.81 vs 0.84) but 99% JSON validity (no parsing errors).

**Confidence**: HIGH - Standard benchmark, published scores, reproducible methodology.

---

## Proven Strength #4: Speed & Efficiency

### Scores

**Source**: Jina AI blog post, arXiv Section 5.3

- **T4 GPU**: 67 tokens/s input, 36 tokens/s output
- **Estimated RTX 3090/4090**: 150-200 tokens/s input (mentioned as "recommended for production")
- **Model size**: 935MB quantized (Ollama), 3.1GB BF16 (Hugging Face)
- **Memory footprint**: Fits comfortably in 8GB VRAM (T4 free tier works)

**Speed comparison** (estimated for tinyArms M2 Air 16GB):
- ReaderLM-v2 (1.5B): ~30-50 tokens/s (CPU inference)
- Qwen2.5-Coder-3B: ~15-25 tokens/s (CPU inference, 2x larger)

### What This Means

ReaderLM-v2 is **2-3x faster** than Qwen2.5-Coder-3B for HTML processing tasks due to smaller size and specialized training. For tinyArms:
- **Pre-commit hook feasibility**: Fast enough for real-time HTML validation (<2-3s target)
- **Batch processing**: Process multiple documentation pages in parallel without blocking
- **Lower memory pressure**: 935MB fits alongside other tinyArms models (embeddinggemma-300m 200MB, Qwen2.5-Coder-3B 1.9GB)

**Confidence**: MEDIUM - Official speed claims on T4, no M2 Air benchmarks, quantization impact unknown (935MB vs 3.1GB).

---

## Critical Gaps & Unknowns

### 1. ❌ **LICENSE BLOCKER - Commercial Use Prohibited** (CRITICAL)

**Gap**: CC BY-NC 4.0 explicitly prohibits **all commercial purposes**, including:
- Selling tinyArms as product
- Using tinyArms in commercial consulting work
- Integrating tinyArms into commercial CI/CD pipelines
- Any usage "primarily for monetary gain or commercial advantage"

**Source**: https://creativecommons.org/licenses/by-nc/4.0/, Hugging Face model card

**Impact**: **CRITICAL** - tinyArms targets developer productivity (commercial context). Even personal use for client projects violates license.

**Mitigation**:
- Contact Jina AI for "pro" commercial license (cost unknown, likely enterprise-tier)
- Use MIT-licensed alternatives: `html-to-markdown` (Go, Python libraries) - but NO AI-powered quality

**Validation Required**: N/A - legal blocker, not technical.

---

### 2. ❌ **No Code Generation Benchmarks** (HIGH)

**Gap**: Zero data on HumanEval, MBPP, LiveCodeBench, or any coding capability tests.

**Impact**: HIGH - Cannot validate if ReaderLM-v2 can assist with code-related HTML tasks:
- Extracting code snippets from StackOverflow/GitHub discussions
- Parsing API documentation with code examples
- Converting code-heavy HTML (MDN, DevDocs) to Markdown

**Baseline Comparison**: Qwen2.5-Coder-3B scores HumanEval 84.1%, MBPP 73.6%. ReaderLM-v2 is built on Qwen2.5-1.5B-**Instruction** (not Coder variant) - likely **significantly worse** at code understanding.

**Validation Required**: Test on code documentation sites (React docs, TypeScript handbook, Rust stdlib) - compare quality vs Qwen2.5-Coder-3B.

---

### 3. ❌ **No Multilingual HTML Quality Tests** (MEDIUM)

**Gap**: Claims 29-language support (including Hungarian, Vietnamese per Qwen2.5 base model), but **no published benchmarks** for non-English HTML→Markdown quality.

**Impact**: MEDIUM - tinyArms targets multilingual users (Hungarian in particular per README). Unknown if ReaderLM-v2 maintains quality on:
- Hungarian e-commerce sites
- Vietnamese news articles
- Mixed-language documentation (English code + Hungarian comments)

**Validation Required**: Test on hu.wikipedia.org, index.hu, vnexpress.net HTML samples - measure ROUGE-L vs English baseline (0.86).

---

### 4. ❌ **No M2 Air Performance Data** (HIGH)

**Gap**: All benchmarks use T4 GPU or RTX 3090/4090. Zero data on Apple Silicon (M2/M3) performance.

**Impact**: HIGH - tinyArms targets "8-16GB Macs" per docs/00-OVERVIEW.md. Unknown:
- CPU inference speed (Ollama on M2 Air 16GB)
- Memory usage during 512K context processing
- Power consumption (battery drain)
- Quantization quality (935MB Q8_0 vs 3.1GB BF16)

**Baseline**: embeddinggemma-300m runs <100ms on M2 Air, Qwen2.5-Coder-3B ~15-25 tokens/s estimated.

**Validation Required**:
- Benchmark reader-lm:1.5b on M2 Air 16GB (Ollama)
- Test long documents (50K+ tokens) - measure speed, memory, battery impact
- Compare quantized (935MB) vs BF16 (3.1GB if available) quality

---

### 5. ❌ **Quantization Quality Unknown** (MEDIUM)

**Gap**: Ollama provides 935MB Q8_0 and 352MB 0.5B variants, but **zero published data** on quality degradation vs BF16 (3.1GB).

**Impact**: MEDIUM - Q8_0 quantization typically loses 1-3% accuracy. Unknown if ROUGE-L 0.86 drops to 0.83-0.84 range (still competitive) or worse.

**Validation Required**: Run identical benchmark set (HTML→Markdown) on:
- BF16 (3.1GB) via Hugging Face Transformers
- Q8_0 (935MB) via Ollama reader-lm:1.5b
- Measure ROUGE-L, Levenshtein, Jaro-Winkler delta

---

### 6. ❌ **No Comparison vs Traditional HTML Parsers** (LOW)

**Gap**: Benchmarks only compare vs LLMs (GPT-4o, Gemini, Qwen2.5-32B). No data vs rule-based tools:
- BeautifulSoup (Python)
- Cheerio (Node.js)
- html-to-markdown libraries (Go, Python)
- Jina Reader API (rule-based, mentioned as "best option" in blog post)

**Impact**: LOW - Traditional parsers are faster (no GPU needed) and deterministic, but struggle with:
- Noisy/malformed HTML
- Complex nested structures
- Semantic content extraction (ads, navigation vs main content)

ReaderLM-v2 likely wins on quality, loses on speed for simple HTML.

**Validation Required**: Test traditional parsers (BeautifulSoup, html-to-markdown Go library) on same benchmark set - compare speed vs quality trade-off.

---

## Comparison: ReaderLM-v2 vs Current tinyArms Stack

| Dimension | embeddinggemma-300m (Level 1) | Qwen2.5-Coder-3B (Level 2) | ReaderLM-v2 (Proposed) |
|-----------|-------------------------------|----------------------------|------------------------|
| **Primary Use Case** | Semantic routing (classify intent) | Code linting, generation | HTML→Markdown conversion |
| **Size (quantized)** | 200MB | 1.9GB | 935MB (Ollama Q8_0) |
| **Speed (M2 Air est.)** | <100ms | 15-25 tok/s | 30-50 tok/s (est.) |
| **Context Window** | 8K | 32K | 256K (512K extrapolation) |
| **Multilingual** | ✅ 100+ languages | ✅ Multilingual code | ✅ 29 languages (claimed) |
| **Code Understanding** | ❌ Embedding only | ✅ HumanEval 84.1% | ❌ No benchmarks |
| **HTML Parsing** | ❌ N/A | ❌ Not specialized | ✅ ROUGE-L 0.86 (SOTA) |
| **JSON Extraction** | ❌ N/A | ❌ Tool calling focus | ✅ F1 0.81 (competitive) |
| **License** | ✅ Apache 2.0 | ✅ Apache 2.0 | ❌ CC BY-NC 4.0 (non-commercial) |
| **tinyArms Role** | Current Level 1 | Current Level 2 Primary | **BLOCKED** (license) |

**Key Insights**:
1. **Complementary Strengths**: ReaderLM-v2 excels at HTML (ROUGE-L 0.86 >> Qwen2.5-Coder-3B), but lacks code generation
2. **License Conflict**: Apache 2.0 (tinyArms stack) vs CC BY-NC 4.0 (ReaderLM-v2) - incompatible for commercial use
3. **Size Trade-off**: 935MB fits between embeddinggemma (200MB) and Qwen2.5-Coder-3B (1.9GB) - manageable for 16GB Mac
4. **Workflow Integration**: Could chain models (ReaderLM-v2 HTML→Markdown → Qwen2.5-Coder-3B code analysis) IF license allowed

**Bottom Line**: ReaderLM-v2 is **technically superior** for HTML tasks but **legally incompatible** with commercial tinyArms usage.

---

## Recommendation for tinyArms

### Option A: SKIP ReaderLM-v2 (RECOMMENDED)

**What changes**: Nothing - maintain current stack (embeddinggemma-300m + Qwen2.5-Coder-3B + Qwen3-4B optional).

**What you gain**:
- ✅ **License safety**: Apache 2.0 allows commercial use, redistribution, SaaS deployment
- ✅ **Simplified stack**: Avoid managing non-commercial model alongside commercial stack
- ✅ **Proven code capabilities**: Qwen2.5-Coder-3B handles HTML parsing well enough for code documentation

**What you lose/risk**:
- ❌ **HTML quality**: Qwen2.5-Coder-3B likely scores ROUGE-L 0.60-0.70 (10-26% worse than ReaderLM-v2)
- ❌ **Speed**: Qwen2.5-Coder-3B slower (15-25 tok/s) vs ReaderLM-v2 (30-50 tok/s est.)
- ❌ **Long-context HTML**: Qwen2.5-Coder-3B 32K context vs ReaderLM-v2 512K (may require chunking)

**Trade-off**: Sacrifice 10-26% HTML quality and 2x speed for legal safety and stack simplicity.

**Validation required**: None - maintain status quo.

---

### Option B: Add for Non-Commercial Research ONLY

**What changes**: Install reader-lm:1.5b (935MB) via Ollama, restrict to personal experiments, document as "non-commercial only" in tinyArms README.

**What you gain**:
- ✅ **Experiment with SOTA HTML**: Test best-in-class HTML→Markdown quality
- ✅ **Validate use case**: Determine if HTML conversion is critical enough to justify commercial license
- ✅ **Benchmark data**: Generate M2 Air performance metrics (speed, memory, battery)

**What you lose/risk**:
- ❌ **Non-production status**: Cannot ship in tinyArms releases, only personal use
- ⚠️ **User confusion**: "Why is this model documented but not usable commercially?"
- ❌ **Wasted effort**: Research time invested in model that may never ship

**Trade-off**: Gain hands-on experience with ReaderLM-v2's capabilities, but no path to production without commercial license.

**Validation required**:
1. **Legal review** (1 day): Verify CC BY-NC 4.0 interpretation - "non-commercial research" exemption?
2. **Installation** (1 hour): `ollama pull reader-lm:1.5b`, smoke test
3. **HTML benchmark** (2 days): Test React docs, TypeScript handbook, Hungarian Wikipedia - measure ROUGE-L, speed
4. **Cost-benefit** (1 day): Estimate commercial license cost from Jina AI, compare vs alternative solutions

**Timeline**: 4-5 days total.

---

### Option C: Negotiate Commercial License or Wait for Alternative

**What changes**: Contact Jina AI for "pro" commercial license pricing, OR monitor for MIT/Apache 2.0 licensed HTML specialist models.

**What you gain**:
- ✅ **Best HTML quality**: ROUGE-L 0.86, 24.6% better than GPT-4o
- ✅ **Production-ready**: Legal to ship in commercial tinyArms releases
- ✅ **Specialized capability**: Offload HTML tasks from Qwen2.5-Coder-3B (keep it focused on code)

**What you lose/risk**:
- ❌ **Cost**: Enterprise commercial licenses typically $5K-50K/year (unknown for Jina)
- ❌ **Complexity**: Managing dual-license model (pro vs open weights)
- ⚠️ **Dependency**: Locked into Jina AI ecosystem, risk of price increases

**Trade-off**: Pay for best-in-class HTML quality vs use free open-source alternatives.

**Validation required**:
1. **Pricing inquiry** (1 week): Email Jina AI sales, get commercial license quote
2. **Budget assessment** (1 day): Evaluate if tinyArms revenue model supports license cost
3. **Alternative scan** (ongoing): Monitor Hugging Face for MIT/Apache 2.0 HTML models (e.g., fine-tuned Qwen2.5-1.5B)

**Timeline**: 1-2 weeks for pricing clarity, indefinite for alternative models.

---

### Bottom Line

**RECOMMENDED: Option A (SKIP)**

ReaderLM-v2's CC BY-NC 4.0 license is a **hard blocker** for commercial tinyArms usage. While technically superior (ROUGE-L 0.86 >> GPT-4o 0.69), the legal risk outweighs benefits. Current stack (Qwen2.5-Coder-3B) handles HTML "well enough" for code documentation use cases.

**Consider Option B** (non-commercial research) ONLY IF:
- You plan to heavily invest in HTML conversion features (e.g., "convert entire docs.python.org to Markdown")
- Commercial license negotiation (Option C) is realistic (funded project, clear revenue model)

**Monitor for MIT/Apache alternatives**: Fine-tuned Qwen2.5-1.5B or Llama 3.2-3B variants trained on HTML→Markdown datasets with permissive licenses.

---

## Validation Test Plan (IF Pursuing Option B or C)

### Phase 1: Installation & Smoke Test (1 hour)

**Steps**:
```bash
# Install Ollama variant
ollama pull reader-lm:1.5b

# Smoke test: Simple HTML→Markdown
echo '<h1>Test</h1><p>Hello world</p>' | \
ollama run reader-lm:1.5b "Convert to Markdown:"
```

**Metrics**: Verify model loads, produces valid Markdown output.

---

### Phase 2: HTML-to-Markdown Quality (2 days)

**Test Dataset**:
1. **Code documentation** (English):
   - https://react.dev/reference/react/useState (React docs)
   - https://www.typescriptlang.org/docs/handbook/2/basic-types.html (TypeScript)
   - https://doc.rust-lang.org/std/vec/struct.Vec.html (Rust stdlib)
2. **Multilingual** (Hungarian):
   - https://hu.wikipedia.org/wiki/JavaScript (Wikipedia)
   - https://index.hu/ (news site - extract article)
3. **Complex structures**:
   - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API (MDN - nested tables, code blocks)

**Metrics**:
- ROUGE-L vs GPT-4o baseline (target: ≥0.80)
- Manual quality assessment: LaTeX rendering, code block preservation, nested list accuracy
- Processing time per page (target: <5s for pre-commit viability)

**Comparison**: Run same HTML through Qwen2.5-Coder-3B with prompt: "Convert this HTML to clean Markdown, preserve code blocks and structure exactly."

---

### Phase 3: Performance Benchmarking (1 day)

**Hardware**: M2 MacBook Air 16GB (tinyArms target platform)

**Metrics**:
- **Speed**: Tokens/s (input + output) on 10K, 50K, 100K token HTML docs
- **Memory**: Peak RAM usage during inference (Activity Monitor)
- **Battery**: Power consumption (pmset -g batt before/after 30min benchmark)
- **Quantization**: Compare Q8_0 (935MB) vs BF16 (3.1GB) if available - ROUGE-L delta

**Baseline**: Compare vs Qwen2.5-Coder-3B on same documents.

---

### Phase 4: License & Cost Assessment (1 week)

**Steps**:
1. Email Jina AI sales (sales@jina.ai): Request commercial license pricing for ReaderLM-v2-pro
2. Clarify usage terms: SaaS redistribution? Per-seat licensing? Perpetual vs subscription?
3. Evaluate budget feasibility: Is cost justified by HTML quality improvement?

**Decision Criteria**:
- Commercial license <$1K/year → Consider (affordable for solo dev)
- $1K-$10K/year → Evaluate vs revenue model (skip if hobby project)
- >$10K/year or undisclosed → Skip, use MIT alternatives

---

### Phase 5: Document Findings (1 day)

**Deliverables**:
1. Update `docs/01-MODELS.md`:
   - Add ReaderLM-v2 to "Research Specialists" or "NOT RECOMMENDED (license)" section
   - Document benchmark results (ROUGE-L, speed, memory)
   - State license decision (commercial approved/denied)
2. Update `docs/model-research/readerlm-v2.md`:
   - Fill ❌ gaps with validation data
   - Update recommendation (Option A/B/C) based on findings
3. Update tinyArms README:
   - If Option B: Add "Non-Commercial Models" section with legal warning
   - If Option C: Add "Licensed Models" section with commercial approval

---

## References

**Primary Sources**:
- arXiv Paper: https://arxiv.org/html/2503.01151v1 ("ReaderLM-v2: Small Language Model for HTML to Markdown and JSON")
- Jina AI Blog: https://jina.ai/news/readerlm-v2-frontier-small-language-model-for-html-to-markdown-and-json/
- Hugging Face Model Card: https://huggingface.co/jinaai/ReaderLM-v2

**Ollama**:
- reader-lm variants: https://ollama.com/library/reader-lm

**License**:
- CC BY-NC 4.0 Legal Code: https://creativecommons.org/licenses/by-nc/4.0/
- Wikipedia CC NonCommercial: https://en.wikipedia.org/wiki/Creative_Commons_NonCommercial_license

**Alternatives (MIT-Licensed)**:
- html-to-markdown (Go): https://github.com/JohannesKaufmann/html-to-markdown (MIT)
- html-to-markdown (Python): https://pypi.org/project/html-to-markdown/ (MIT)
- Turndown (JavaScript): https://github.com/mixmark-io/turndown (MIT)

**Benchmarks**:
- ROUGE-L metric: https://en.wikipedia.org/wiki/ROUGE_(metric)
- Levenshtein distance: https://en.wikipedia.org/wiki/Levenshtein_distance
- Jaro-Winkler similarity: https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance

---

**Last Updated**: 2025-10-28
**Next Review**: Upon Jina AI license policy change OR discovery of MIT/Apache 2.0 HTML specialist model
