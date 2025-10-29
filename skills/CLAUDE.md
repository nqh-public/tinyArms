# CLAUDE.md

**Inherits From**: `/Users/huy/CODES/nqh/apps/tinyArms/CLAUDE.md`

Development standards for tinyArms skills in `apps/tinyArms/skills/`.

---

## What Are tinyArms Skills?

**NOT Claude Code skills** - These are tinyArms execution units.

**Created using**: `.claude/skills/skill-creator` (Claude Code skill)

**Executed by**:
1. tinyArms orchestrator agent (automatic triggers)
2. User via tinyArms app interface (not built yet)
3. Other AI agents via tinyArms CLI (not built yet)

---

## What We Know (Decided)

**Current structure** (only what exists):
```
skills/{skill-name}/
└── idea.md          # Decision guide (required first)
```

**Everything else** (implementation files, config format, directory structure) **requires research first**.

---

## idea.md Standards

**Purpose**: Decision guide for tool/model selection, NOT implementation

**Include**:
- Decision flowchart (Mermaid) - Which tools/models for what scenarios
- Tool comparison (from `docs/model-research/`)
- Pipeline options with trade-offs
- Key constraints from research (with line references)
- Open questions requiring validation

**Exclude**:
- Code examples (move to implementation when structure decided)
- Performance estimates (unvalidated guesses)
- Example schemas (fabricated data)
- CLI syntax (not implemented)
- Integration configs (structure undecided)

**Target length**: <250 lines

**Example**: `web-scraper/idea.md` (commit f538631) - 217 lines, decision-focused

---

## Model Research Integration

**Before creating idea.md**:

1. Check existing research:
   ```bash
   ls apps/tinyArms/docs/model-research/*.md
   cat apps/tinyArms/docs/model-research/index.md
   ```

2. If model not researched:
   - Delegate to research agents
   - Follow `docs/model-research/CLAUDE.md` standards
   - Update index.md with new model

3. Reference research in idea.md:
   ```markdown
   ## Key Constraints from Research

   ### NuExtract-1.5-tiny
   - **Context limit**: 8-20k tokens (from nuextract.md:37)
   - **License**: MIT (from nuextract.md:19)
   ```

**Never fabricate benchmarks** - cite or mark "(needs validation)"

---

## What Needs Research

**Before implementing any skill**:

- [ ] File structure (what files beyond idea.md?)
- [ ] Configuration format (YAML? JSON? Custom?)
- [ ] Execution mechanism (how does orchestrator invoke skills?)
- [ ] Routing keywords (how are they defined and used?)
- [ ] Testing approach (where do tests live? format?)
- [ ] Versioning strategy (CHANGELOG.md? semver?)
- [ ] Model loading (how does orchestrator load Ollama models?)
- [ ] CLI interface design (command syntax, parameters)

---

## Example: web-scraper Skill

**What exists**:
- `idea.md` (217 lines) - Decision guide for HTML→Markdown→JSON pipeline

**What doesn't exist yet**:
- Implementation files (structure undecided)
- Config files (format undecided)
- Tests (structure undecided)
- Execution mechanism (not designed)

---

## References

- **Parent CLAUDE.md**: `apps/tinyArms/CLAUDE.md`
- **Model research**: `docs/model-research/`
- **skill-creator**: `.claude/skills/skill-creator/` (creates these skills)
- **Example skill**: `web-scraper/` (only idea.md exists)

---

**Last Updated**: 2025-10-28
**Status**: idea.md standards only - implementation structure requires research
