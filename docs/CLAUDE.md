# docs/CLAUDE.md

**Documentation Standards for tinyArms/docs/**

**Inherits From**: `/Users/huy/CODES/nqh/apps/tinyArms/CLAUDE.md`

---

## Documentation Principles

### 1. Evidence-Based Claims

**Rule**: NEVER make claims without citing research, benchmarks, or production evidence.

**Good**:
```markdown
✅ embeddinggemma-300m: Best multilingual model <500M params (MTEB ~70)
Reference: research/01-model-selection-validation.md:135-153
```

**Bad**:
```markdown
❌ embeddinggemma-300m is a great embedding model
```

### 2. Mark Research Status

**All researched content MUST be marked**:
```markdown
**Status**: Researched (2025-10-29)
**Phase**: 02 (Confidence Scoring Implementation)
```

**All assumptions/未validated content MUST be marked**:
```markdown
**Status**: Assumed (needs validation)
**Validation needed**: Benchmark on M2 Air to confirm 2-3s latency
```

### 3. Phase Numbering Convention

**Research files**:
- `01-*`: Phase 01 (Current State Validation)
- `02-*`: Phase 02 (Confidence Scoring, Week 3)
- `03-*`: Phase 03 (Semantic Caching, Week 4)
- `04-*`: Phase 04 (Optional Reranker, Week 5)
- `05-*`: Phase 05 (Advanced Calibration, Week 6-8)

**Core docs**: Use phase numbers as semantic versioning (01-ARCHITECTURE.md, 02-INSTALLATION.md, etc.)

### 4. Cross-References Required

**All claims must link to evidence**:
```markdown
✅ **Industry validation**: AutoMix (NeurIPS 2024) achieves 50%+ cost reduction
**Reference**: research/02-orchestration-patterns.md:412-428

❌ Industry research shows this works well
```

### 5. Expected Impact Quantification

**Research-backed features MUST include expected impact**:
```markdown
**Expected Impact**: 20-30% reduction in Level 3 escalations
**Source**: research/02-orchestration-patterns.md (AutoMix results)
```

**NOT allowed**:
```markdown
❌ This will significantly improve performance
```

---

## File Organization

### Core Documentation (docs/)

**Numbering scheme**:
- **00-***: Overview and getting started
- **01-***: Architecture and models
- **02-***: Installation and configuration
- **03-***: Skills and integrations
- **04-***: Design and ideations
- **05-***: Advanced topics

**Purpose**: End-user documentation (how to use tinyArms)

### Research Documentation (docs/research/)

**Numbering scheme**: Phase-based (01 = current validation, 02-05 = implementation phases)

**Purpose**: Evidence base for architectural decisions

**Content**: Industry patterns, benchmarks, production case studies, implementation guides

---

## Documentation Types

### 1. Architecture Docs (01-ARCHITECTURE.md, 01-MODELS.md)

**Must include**:
- System overview diagram
- Tier descriptions with performance characteristics
- Industry validation section
- References to research files

**Must NOT include**:
- Implementation code (use pseudocode/ for that)
- Assumed performance numbers (cite benchmarks)
- Vague claims ("fast", "accurate" without metrics)

### 2. Research Docs (research/\*.md)

**Must include**:
- Research date
- Sources (papers, GitHub repos, benchmarks)
- Expected impact with evidence
- Production examples
- Implementation timeline

**Must NOT include**:
- Speculation without marking as "needs validation"
- Code examples without context (when/why to use)

### 3. Implementation Guides (research/02-confidence-scoring-patterns.md, etc.)

**Must include**:
- Problem statement (what it solves)
- Algorithm explanation with code
- Trade-offs (latency, memory, accuracy)
- Industry validation (who uses this)
- Implementation roadmap (which week)

**Must NOT include**:
- "Should work" without evidence
- Complex code without explanation

### 4. Pseudocode (pseudocode/\*.md)

**Must include**:
- Clear algorithm flow
- Decision thresholds with justification
- Comments explaining non-obvious logic

**Must NOT include**:
- Production-ready code (this is design, not implementation)
- Magic numbers without explanation

---

## Writing Style

### Concise, Scannable Format

**Use**:
- Bullet points over paragraphs
- Tables for comparisons
- Code blocks for examples
- Headers for structure

**Avoid**:
- Long prose paragraphs
- Unclear section nesting
- Missing headers

### Active Voice

**Good**: "Generate 3 responses at Level 2"
**Bad**: "3 responses should be generated"

### Specific Metrics

**Good**: "Latency: +500ms (3 generations)"
**Bad**: "Adds some latency"

---

## Update Protocol

### When Research Findings Change Docs

**1. Update main doc** (01-ARCHITECTURE.md) with new section
**2. Mark as researched** with date and phase
**3. Link to research file** for full details
**4. Update System Overview** diagram if architecture changes

**Example commit**:
```
docs(tinyArms): add semantic caching (Phase 03, researched)

- Added Level -1 semantic cache section
- Expected impact: 15-25% query elimination
- Industry validation: FrugalGPT pattern

01-ARCHITECTURE.md:209-238
research/03-semantic-caching-design.md:1-644
```

### When Assumptions Are Replaced

**1. Delete/replace** assumption with researched finding
**2. Add reference** to research source
**3. Document** what was assumed vs what research found

**Example**:
```diff
- Router Cache (60x speedup for similar tasks)
+ Level -1: Semantic Cache (Phase 03, Researched)
+ Expected Impact: 15-25% query elimination
+ Industry validation: FrugalGPT uses cache as Tier 0
```

---

## Quality Checklist

Before committing any doc:
- [ ] All claims cite sources (research file + line number)
- [ ] Research status marked (Researched YYYY-MM-DD / Assumed / Needs Validation)
- [ ] Expected impact quantified (% improvement, latency cost)
- [ ] Phase numbering correct (01-05 for research, 00-05 for core docs)
- [ ] Cross-references work (all links valid)
- [ ] No assumptions unmarked (if uncertain, mark "needs validation")

---

## Examples

### Good Documentation ✅

```markdown
## Confidence Scoring (Phase 02, Researched)

**Status**: Researched - ready for implementation (Week 3)
**Expected Impact**: 20-30% reduction in Level 3 escalations

**Problem**: Level 2 doesn't know when its answer is good enough

**Solution**: Answer Consistency Scoring
- Generate N=3 responses with temperature=0.7
- Threshold: >0.85 consistency → accept Level 2

**Industry validation**: AutoMix (NeurIPS 2024) achieves 50%+ cost reduction

**Reference**: research/02-confidence-scoring-patterns.md
```

### Bad Documentation ❌

```markdown
## Confidence Scoring

We should add confidence scoring to make better routing decisions.
This will improve accuracy and reduce costs significantly.
```

---

## File Lifecycle

### Creation
1. Research complete → Create research/XX-topic.md
2. Extract key findings → Add section to core doc (01-ARCHITECTURE.md)
3. Mark with phase, date, expected impact

### Update
1. New research → Update research file
2. Propagate to core docs → Update references
3. Document what changed in commit message

### Deprecation
1. Pattern obsolete → Move to archive/
2. Update references → Point to new approach
3. Document migration path

---

## Anti-Patterns

### ❌ Vague Performance Claims
```markdown
❌ "This is fast"
✅ "50-60ms (embedding + vector search)"
```

### ❌ Missing Context
```markdown
❌ "Use answer consistency scoring"
✅ "Use answer consistency scoring at Level 2 to prevent over-escalation to Level 3 (expected: 20-30% reduction)"
```

### ❌ Unmarked Assumptions
```markdown
❌ "Cache hit rate should be around 20%"
✅ "Expected cache hit rate: 15-25% (FrugalGPT achieved this range)"
```

### ❌ Implementation Details in Architecture
```markdown
❌ (Full TypeScript implementation in 01-ARCHITECTURE.md)
✅ (Pseudocode in pseudocode/02-routing-flow.md, architecture doc has overview only)
```

---

## Commit Message Format

```
docs(tinyArms): <short description>

<detailed changes>
- Added/Updated/Deleted X section
- Expected impact: Y
- Industry validation: Z

<file>:<line-numbers>
research/<research-file>.md
```

**Example**:
```
docs(tinyArms): replace assumptions with researched patterns

- Updated 01-ARCHITECTURE.md with semantic caching (Phase 03)
- Added confidence scoring section (Phase 02)
- Created 4 synthesized implementation guides
- Moved research files to docs/research/ with phase numbering
- Deleted 01-ARCHITECTURE-V2.md (consolidated into 01-ARCHITECTURE.md)

Expected impact:
- Semantic caching: 15-25% query elimination
- Confidence scoring: 20-30% fewer L3 escalations

Industry validation: FrugalGPT, AutoMix, RouteLLM patterns

01-ARCHITECTURE.md:1-583
01-MODELS.md:363-430
research/01-industry-validation.md:1-644
research/02-confidence-scoring-patterns.md:1-487
research/02-threshold-calibration-guide.md:1-533
research/03-semantic-caching-design.md:1-644
```

---

## Maintenance

**Monthly**:
- Review all "needs validation" markers
- Update research files with new findings
- Check cross-references (broken links)

**Quarterly**:
- Archive obsolete patterns
- Update benchmark numbers
- Sync with production learnings

**After major research**:
- Update affected core docs
- Create new research files if needed
- Propagate findings across docs

---

**Last updated**: 2025-10-29
**Next review**: After Phase 01 implementation
