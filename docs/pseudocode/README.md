# TinyArms Pseudocode Documentation

Complete architectural breakdown of tinyArms system in human-readable pseudocode.

---

## 📚 Files & Navigation

| File | Purpose | Audience |
|------|---------|----------|
| **01-entry-flow.md** | CLI commands → Config loading → Executor initialization | System integrators, DevOps |
| **02-routing-flow.md** | The core tiered router (L0→L1→L2) with memory checks, caching, fallbacks | AI/ML engineers, routing designers |
| **03-intelligence-layers.md** | Each AI level internals: rule extraction, confidence scoring, model loading | Data scientists, LLM researchers |
| **04-caching-flow.md** | LRU cache with pattern normalization, statistics, eviction | Backend engineers, performance ops |
| **05-database-flow.md** | SQLite schema, queries, cleanup, data export | Database engineers, data analysts |

---

## 🎯 Quick Lookup

**"How does file renaming work?"**
→ [01-entry-flow.md](01-entry-flow.md) (CLI) + [02-routing-flow.md](02-routing-flow.md) (routing) + [03-intelligence-layers.md](03-intelligence-layers.md) (Level 0 rules)

**"What happens when I run `tinyarms run file-naming ~/Downloads`?"**
→ [01-entry-flow.md#skill-executor-initialization](01-entry-flow.md#skill-executor-initialization) (entry point) → [02-routing-flow.md#main-routing-algorithm](02-routing-flow.md#main-routing-algorithm) (routing loop)

**"How is confidence calculated?"**
→ [03-intelligence-layers.md#level0-deterministic-rules](03-intelligence-layers.md#level0-deterministic-rules) (L0 simple) + [03-intelligence-layers.md#level1-confidence-scoring-algorithm](03-intelligence-layers.md#level1-confidence-scoring-algorithm) (L1 detailed)

**"Why does the second screenshot rename faster than the first?"**
→ [04-caching-flow.md#cache-flow-in-router](04-caching-flow.md#cache-flow-in-router) (cache hit) + [04-caching-flow.md#routercachenormalizefilename](04-caching-flow.md#routercachenormalizefilename) (pattern matching)

**"What's in the database?"**
→ [05-database-flow.md#database-schema](05-database-flow.md#database-schema) (all 4 tables with examples)

---

## 🏗️ Architecture Summary (Deleted - Duplicates 01-ARCHITECTURE.md)

**98-line flowchart removed** (lines 40-137)

**Note**: This duplicates `01-ARCHITECTURE.md:10-52` (System Overview). See core architecture doc instead.

---

## 📖 How to Read This Documentation

### For Implementation
1. Start with [01-entry-flow.md](01-entry-flow.md) to understand the entry points
2. Study [02-routing-flow.md](02-routing-flow.md) for the core routing logic
3. Implement [03-intelligence-layers.md](03-intelligence-layers.md) for each AI level
4. Add [04-caching-flow.md](04-caching-flow.md) for performance
5. Finish with [05-database-flow.md](05-database-flow.md) for persistence

### For Understanding
- Grep for your use case (e.g., "file-naming") and read that section
- Check the FLOWCHART sections for visual understanding
- See EXAMPLE boxes for concrete input/output scenarios
- Study algorithm descriptions for confidence scoring

### For Debugging
- [02-routing-flow.md#main-routing-algorithm](02-routing-flow.md#main-routing-algorithm) – Why did routing pick Level X?
- [03-intelligence-layers.md#level1-confidence-scoring-algorithm](03-intelligence-layers.md#level1-confidence-scoring-algorithm) – Why low confidence?
- [04-caching-flow.md#cache-flow-in-router](04-caching-flow.md#cache-flow-in-router) – Why no cache hit?
- [05-database-flow.md#database-schema](05-database-flow.md#database-schema) – What data is being recorded?

---

## 🔍 Key Algorithms

### RAKE (Rapid Automatic Keyword Extraction)
**Location**: [03-intelligence-layers.md#level0-extractkeywordstextmaxkeywords5](03-intelligence-layers.md#level0-extractkeywordstextmaxkeywords5)

Simple keyword extraction without ML:
1. Filter stop words (the, a, and, etc.)
2. Count word frequency
3. Sort by frequency
4. Return top N

Example: "Screenshot 2024 project mockup" → ["project", "mockup", "screenshot"]

### Confidence Scoring
**Locations**:
- [03-intelligence-layers.md#level1-confidence-scoring-algorithm](03-intelligence-layers.md#level1-confidence-scoring-algorithm) (L1)
- [03-intelligence-layers.md#level2-confidence-scoring-algorithm](03-intelligence-layers.md#level2-confidence-scoring-algorithm) (L2)

Base score (0.75-0.85) with penalties/bonuses:
- Uncertainty markers (-0.25)
- Missing required fields (-0.15 each)
- Well-formed structure (+0.05)
- Clamp: 0.3-1.0

### Cache Key Normalization
**Location**: [04-caching-flow.md#routercachenormalizefilenamef](/04-caching-flow.md#routercachenormalizefilenamef)

Pattern matching for similar files:
- Dates (2024-10-27) → "date"
- Times (14:30:00) → "time"
- Numbers (1234) → "number"
- Special chars → hyphens

Example: "Screenshot 2024-10-27.png" and "Screenshot 2024-10-28.png" share same cache key

### Memory Availability Check
**Location**: [02-routing-flow.md#memory-availability-check](02-routing-flow.md#memory-availability-check)

Prevents OOM by checking free RAM before loading large models:
- Level 1 (Gemma 4B): Need 4GB free
- Level 2 (Qwen 7B): Need 7GB free
- If insufficient: Skip to next level with warning

---

## 📊 Data Flow Examples

### File Naming Request
```
1. User: tinyarms run file-naming ~/Downloads
2. CLI: Load config, init Executor
3. Executor: Find files matching pattern
4. Executor: For each file, call Router
5. Router: Check cache (pattern "screenshot-date.png")
   → MISS (first time)
6. Router: Try Level 0 (detect type, extract keywords)
   → Match! confidence: 0.9
7. Router: Cache result (24h TTL)
8. Router: Return "mockup-hero.png"
9. Executor: Rename file (unless --dry-run)
10. Executor: Save to task_history
11. CLI: Print result

Second file "Screenshot 2024-10-28.png":
5. Router: Check cache (same pattern "screenshot-date.png")
   → HIT! confidence: 0.9
6. Router: Return "mockup-hero.png" (0ms)
```

### Code Linting Request
```
1. User: tinyarms run code-linting src/
2. CLI: Load config, init Executor
3. Executor: Find code files (*.ts, *.tsx, *.js)
4. Executor: For each file, read content
5. Executor: Call Router with {filePath, code, constitution}
6. Router: Check cache (MD5 of content)
   → MISS (first run or file changed)
7. Router: Try Level 0 (no handler)
   → null (escalate)
8. Router: Try Level 1 (file naming skill)
   → null (not code-linting)
9. Router: Check memory (need 7GB)
   → OK
10. Router: Try Level 2 (Qwen 7B)
    → Load model (first time: 10-15s)
    → Run inference (10-15s)
    → Parse JSON
    → confidence: 0.87
11. Router: Cache result (24h TTL)
12. Router: Return {issues: [...], summary: "..."}
13. Executor: Save to task_history with level="Level 2"
14. CLI: Print issues + confidence

File changed → run again:
6. Router: Check cache (different content hash)
   → MISS (content changed)
7-12. Repeat routing...
```

---

## 🎓 Learning Path

**Beginner**: Read 01 and 02 to understand user flows and routing

**Intermediate**: Study 03 to understand how each AI level works

**Advanced**: Implement from 04 and 05 for performance and persistence

**Expert**: Contribute improvements to confidence scoring or cache normalization algorithms

---

## 📝 Document Status

- ✅ Complete
- Generated: 2025-10-27
- From: TypeScript implementation (reference architecture phase)
- Format: Pseudocode (language-agnostic)
- Examples: Tested with realistic scenarios

---

## 🤔 Questions?

See the specific section in the appropriate file:
- **CLI**: 01-entry-flow.md
- **Routing**: 02-routing-flow.md
- **AI Models**: 03-intelligence-layers.md
- **Performance**: 04-caching-flow.md
- **Data**: 05-database-flow.md
