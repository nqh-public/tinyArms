# CLAUDE.md

**Inherits From**: `/Users/huy/CODES/nqh/apps/tinyArms/CLAUDE.md`

Model research documentation standards for tinyArms.

---

## Purpose

Document research analysis for AI model selection:
- Benchmark data extraction
- Proven strengths/weaknesses
- Performance comparisons
- Validation requirements
- Integration recommendations

---

## File Naming

**Format**: `{model-name}.md`

**Examples**:
- `granite-4.0-nano.md` (IBM Granite 4.0 Nano family)
- `qwen2.5-coder-3b.md` (Qwen 2.5 Coder 3B)
- `embeddinggemma-300m.md` (Google Embedding Gemma)

**Rules**:
- Lowercase with hyphens
- Use official model name from vendor
- Include size if model has variants (3b, 7b, 300m)
- One file per model family (cover all variants within)

---

## Document Structure

```markdown
# {Model Name}: Proven Strengths & Weaknesses

**Research Date**: YYYY-MM-DD
**Source**: {Official blog/paper/benchmark leaderboard}
**Status**: {Analysis complete / Validation pending / Production ready}

---

## Executive Summary
[3-5 sentences: What model excels at, critical gaps, recommendation]

---

## Model Variants
[Table of all sizes/variants with params, architecture, estimated size]

---

## Proven Strength #1: {Capability}
### Scores
[Benchmark table with competitors]

### What This Means
[Why it matters for tinyArms use case]

**Confidence**: HIGH/MEDIUM/LOW - {Why}

---

## Proven Strength #2-4
[Same format]

---

## Critical Gaps & Unknowns
[What's missing, what needs validation, impact assessment]

---

## Comparison: {Model} vs Current tinyArms Stack
[Direct comparison with current Level 1/2/3 models]

---

## Recommendation for tinyArms
[Options A/B/C with rationale, validation requirements]

---

## Validation Test Plan
[Specific steps, metrics, timeline]

---

## References
[Source URLs, benchmark images, license info]

**Last Updated**: YYYY-MM-DD
**Next Review**: {Trigger or date}
```

---

## Required Sections

**Mandatory**:
- Executive Summary
- Model Variants (sizes/params table)
- At least 2 Proven Strengths (with benchmarks)
- Critical Gaps & Unknowns
- Comparison vs Current Stack
- Recommendation for tinyArms
- References (sources, license)

**Optional**:
- Validation Test Plan (if recommending adoption)
- Architecture Advantages (if novel architecture)
- Domain-Specific Performance (code/math/reasoning breakdowns)

---

## Benchmark Data Standards

**Extract from source**:
- ✅ Exact scores (no rounding unless source rounds)
- ✅ Competitor scores (for context)
- ✅ Benchmark name + version (IFEval, BFCLv3, HumanEval pass@1)
- ✅ Test conditions if known (hardware, quantization)

**Confidence Labels**:
- **HIGH**: Official benchmark, reproducible, standard test
- **MEDIUM**: Uncommon benchmark, estimated from partial data
- **LOW**: Vendor claim without independent verification, extrapolated

**Missing Data**:
- Call out explicitly with ❌
- Explain impact (CRITICAL / HIGH / MEDIUM / LOW)
- Add to validation requirements

---

## Critical Analysis Framework

**For each capability, answer**:
1. **What's PROVEN?** (published benchmarks, not claims)
2. **What's MISSING?** (gaps in data)
3. **Why it matters for tinyArms?** (specific use case)
4. **Validation needed?** (test plan if considering adoption)

**Compare against current stack**:
- Qwen2.5-Coder-3B (Level 2 Primary): HumanEval 84.1%, MBPP 73.6%
- embeddinggemma-300m (Level 1): 200MB, <100ms, multilingual
- Optional models: Qwen3-4B, Gemma 3 4B, Qwen-7B

---

## Recommendation Format

**Present 2-3 options**:

**Option A: {Approach}** (RECOMMENDED / NOT RECOMMENDED / REQUIRES VALIDATION)
- **What changes**: {Specific stack modifications}
- **What you gain**: {Bullet list with ✅}
- **What you lose/risk**: {Bullet list with ❌ or ⚠️}
- **Trade-off**: {One sentence summary}
- **Validation required**: {Specific tests or skip if proven}

**Bottom Line**: {Conservative/Aggressive/Research-first path with rationale}

---

## Update README.md After Adding Research

**Add entry to README.md**:
```markdown
### {model-name}.md
**Date**: YYYY-MM-DD
**Status**: {Analysis complete / Validation pending / Production ready}

**Summary**: {1-2 sentences about strengths}

**Critical Gap**: {Main unknown or validation needed}

**Recommendation**: {Keep current stack / Add as Level X / Replace Y / Validate first}
```

---

## When to Create New Research File

**Triggers**:
- New model release relevant to tinyArms (sub-5GB, local inference)
- User requests analysis ("what about model X?")
- Current stack underperforming (considering alternatives)
- New benchmark data published for existing models

**Before creating**:
1. Check if model already documented (search README.md)
2. Verify model meets tinyArms constraints:
   - ✅ Runs locally (Ollama/llama.cpp/MLX)
   - ✅ <5GB download size (target <2GB)
   - ✅ Relevant capability (code, tool calling, semantic routing)
   - ✅ Open source license (Apache 2.0, MIT, etc.)

---

## Validation Test Plans

**Include when recommending adoption**:

**Format**:
```markdown
## Validation Test Plan

### Phase 1: Installation (1 day)
[Verify Ollama availability, install, smoke test]

### Phase 2: {Primary Use Case} (3-5 days)
**Test dataset**: {Specific files/examples}
**Metrics**: {What to measure}
**Comparison**: {Baseline model}

### Phase 3: Performance (2 days)
**Metrics**: Speed (tok/s), memory (MB), power (battery %)
**Hardware**: M2 MacBook Air 16GB

### Phase 4: Document Findings (1 day)
Update docs/01-MODELS.md with decision
```

**Timeline**: Sum of phases (typically 1-2 weeks)

---

## Quality Checklist

Before committing research file:

- [ ] Filename follows `{model-name}.md` convention
- [ ] Executive Summary ≤5 sentences
- [ ] At least 2 proven strengths with benchmark scores
- [ ] Critical gaps explicitly called out with ❌
- [ ] Comparison vs current tinyArms stack included
- [ ] Confidence labels (HIGH/MEDIUM/LOW) for all claims
- [ ] References include source URLs + license
- [ ] Recommendation presents 2-3 options with trade-offs
- [ ] README.md updated with new entry

---

## Examples

**Good Research File**: `granite-4.0-nano.md`
- ✅ Extracted specific benchmark scores (78.5 IFEval, 54.8 BFCLv3)
- ✅ Identified critical gap (no HumanEval/MBPP)
- ✅ Compared vs Qwen2.5-Coder-3B directly
- ✅ 3 options (add Level 1.5, replace, hybrid stack)
- ✅ Validation test plan (5 phases, 1-2 weeks)

**What to avoid**:
- ❌ Vendor marketing claims without benchmarks
- ❌ Vague comparisons ("much faster", "better quality")
- ❌ Recommendations without validation requirements
- ❌ Missing confidence labels
- ❌ No comparison to current stack

---

## Notes

- Model research files are **reference documentation** (not operational guidance)
- Keep focused on **tinyArms use cases** (code linting, tool calling, semantic routing)
- Update when new benchmarks published (HumanEval, multilingual, Mac performance)
- Archive outdated analysis (move to `archive/` if model no longer considered)
