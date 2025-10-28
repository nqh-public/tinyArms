# Implementation Details

**Part of**: [Prompt Evolution System](../05-prompt-evolution-system.md)
**Status**: Research phase (0% implemented)
**Date**: 2025-10-27

---

## Storage Schema

```sql
-- SQLite tables

CREATE TABLE prompt_evolution_sessions (
  id TEXT PRIMARY KEY,
  skill TEXT NOT NULL,
  original_prompt_hash TEXT NOT NULL,
  triggered_at TIMESTAMP NOT NULL,
  trigger_reason TEXT,  -- "accuracy_drop", "manual", "scheduled"
  status TEXT DEFAULT 'active',  -- active, completed, cancelled
  completed_at TIMESTAMP
);

CREATE TABLE prompt_variants (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES prompt_evolution_sessions(id),
  variant_letter TEXT,  -- A, B, C
  prompt_template TEXT NOT NULL,
  reasoning TEXT,  -- Why SmolLM2 generated this variant
  votes INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0.0
);

CREATE TABLE ab_test_results (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES prompt_evolution_sessions(id),
  variant_id TEXT REFERENCES prompt_variants(id),
  task_id TEXT NOT NULL,
  user_choice BOOLEAN,  -- TRUE if user picked this variant
  task_success BOOLEAN,  -- TRUE if task completed successfully
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prompt_history (
  id TEXT PRIMARY KEY,
  skill TEXT NOT NULL,
  version INTEGER NOT NULL,
  prompt_template_path TEXT NOT NULL,
  active_from TIMESTAMP NOT NULL,
  active_to TIMESTAMP,
  accuracy_start REAL,
  accuracy_end REAL,
  evolution_source TEXT,  -- "SmolLM2", "manual", "initial"
  notes TEXT
);
```

---

## Testing Plan

### Phase 1: Manual Testing

1. Create 3 manual variants for file-naming
2. Run A/B test with 30 real files
3. Measure:
   - User choice distribution
   - Accuracy improvement
   - User satisfaction (survey)

**Success criteria**: Winner accuracy >85% (up from 78%)

---

### Phase 2: SmolLM2 Testing

1. Use SmolLM2 to generate variants (same failure examples)
2. Compare SmolLM2 variants vs manual variants
3. Measure:
   - Variant quality (do they make sense?)
   - User choice distribution
   - Accuracy improvement

**Success criteria**: SmolLM2 variants perform ≥ manual variants

---

### Phase 3: Production Testing

1. Deploy to 1 skill (file-naming)
2. Monitor for 1 month
3. Measure:
   - Number of evolution cycles triggered
   - Average accuracy improvement
   - User annoyance (A/B dialog frequency)

**Success criteria**: 2-3 evolution cycles, accuracy stable >85%, <10% users complain

---

## Risks & Mitigations

### Risk 1: Evolution Fatigue

**Problem**: Users annoyed by frequent A/B choice dialogs

**Mitigation**:
- Cooldown: Max 1 evolution per skill per week
- Sampling: Only 50% of tasks show A/B choice
- Skip button: Always allow using current prompt

---

### Risk 2: SmolLM2 Generates Bad Variants

**Problem**: Variants are nonsensical or redundant

**Mitigation**:
- Manual review: Flag for human review if accuracy <70%
- Rollback: Auto-rollback to previous prompt if new prompt performs worse
- Diversity check: Reject variants too similar to original

---

### Risk 3: Overfitting to User

**Problem**: Prompts optimize for one user's preferences, not general use

**Mitigation**:
- Multi-user data: Aggregate votes from multiple users
- Canonical examples: Include gold-standard examples in evaluation
- Periodic reset: Option to reset to default prompt if user wants

---

## Cost Analysis

**Per evolution cycle**:
- SmolLM2 inference: ~5-8s (one-time)
- A/B testing: 30 user choices (spread over 7 days)
- Storage: ~5KB per evolution session

**ROI**:
- Accuracy improvement: 5-15%
- User time saved: 2-3 hours/week (fewer manual prompt tweaks)
- Model swap avoidance: If prompt evolution fixes accuracy, no need to upgrade to larger model

**Break-even**: 1 evolution cycle = worth it if saves >1 hour of manual prompt engineering

---

## Example Evolution: Image File Naming

### Initial Prompt (v1)

```markdown
# skills/file-naming.md (v1)

You are renaming a file based on its visual content.

Analyze the image and generate a descriptive filename using kebab-case.

Be concise but specific.
```

**Accuracy**: 92% (Weeks 1-6)

**Note**: For comprehensive task-specific prompt patterns with proven examples, see [04-task-specific-patterns.md](04-task-specific-patterns.md). This research covers effective/ineffective patterns for all 4 tinyArms skills with 51 cited sources.

---

### Accuracy Drop (Week 7)

**Failures**:
- Screenshot-2024.png → "untitled-screen.png" (too generic)
- IMG_4521.jpg → "photo-landscape.jpg" (missed: "golden-gate-bridge")
- dashboard-final-v2.png → "ui-dashboard.png" (lost version number)

**Root cause analysis**:
- No structure guidance (too vague)
- No examples (model guesses format)
- No priority guidance (misses key details)

---

### SmolLM2 Generates Variants (Week 8)

**Variant A** (Structured Format):

```markdown
Analyze the image and rename using this structure:
[main-subject]-[context]-[type].extension

Examples:
- golden-gate-bridge-sunset-photo.jpg
- dashboard-mobile-wireframe-v3.png
- hero-section-desktop-mockup.png

Format: kebab-case, 3-5 words
```

**Variant B** (Color Context):

```markdown
Describe the image as a filename. Include:
1. Main subject/objects
2. Distinctive colors (if notable)
3. Purpose/context

Format: subject-color-context.extension
Max 5 words, kebab-case

Examples:
- blue-button-component-hover.png
- red-alert-modal-mobile.png
```

**Variant C** (Prioritized Metadata):

```markdown
Rename based on visual analysis.

Priority order:
1. Main subject/purpose (required)
2. Platform (mobile/desktop/tablet)
3. Version number (if visible in filename or image)
4. State (hover, active, error, etc.)

Format: subject-platform-version-state.extension
Use kebab-case, omit unavailable fields

Examples:
- login-form-mobile-v2.png
- error-modal-desktop-active.png
- product-card-tablet.png
```

---

### A/B Testing Results (Week 8-9)

```
File: Screenshot-2024-10-28.png (landing page hero section on iPhone)

Variant A output: "hero-section-mobile-landing.png"
Variant B output: "blue-hero-mobile-header.png"
Variant C output: "hero-mobile-landing-v1.png"

User choice: Variant A (clear, no redundant "v1")

---

File: dashboard_FINAL_v3.png

Variant A output: "dashboard-admin-interface-v3.png"
Variant B output: "gray-dashboard-layout.png"
Variant C output: "dashboard-desktop-v3.png"

User choice: Variant C (captured version number!)

---

After 30 votes:
Variant A: 10 votes (33%)
Variant B: 5 votes (17%)
Variant C: 15 votes (50%) ← WINNER

Variant C accuracy: 91% (up from 78%)
```

---

### Promotion (Week 10)

```yaml
# config.yaml - Auto-updated
skills:
  file-naming:
    prompt_template: skills/file-naming-v2.md  # ← New version
    prompt_version: 2
    evolved_at: "2024-11-10T08:00:00Z"
    evolution_history:
      - version: 1
        active_period: "2024-09-15 to 2024-11-10"
        accuracy: 0.78
        reason: "Accuracy drop"
      - version: 2
        active_since: "2024-11-10"
        accuracy: 0.91
        source: "SmolLM2 evolution (variant C)"
```

**New prompt file created**:
```bash
skills/file-naming-v2.md  # Variant C promoted
```

**Monitoring continues**: If v2 accuracy drops, trigger evolution again

---

## Implementation Phases

### Phase 1: Manual Prompt Evolution (No SmolLM2)

```bash
# User manually creates variants
tinyarms prompt create file-naming \
  --variant-a skills/file-naming-structured.md \
  --variant-b skills/file-naming-colors.md \
  --variant-c skills/file-naming-priority.md

# tinyArms A/B tests (30 votes)
# Winner auto-promoted
```

**Deliverable**: A/B testing framework, winner promotion logic

---

### Phase 2: SmolLM2 Auto-Generation

```bash
# Accuracy drops, SmolLM2 auto-generates variants
# (No user action needed)
```

**Deliverable**: Integrate SmolLM2-360M-Instruct, variant generation logic

---

### Phase 3: Multi-Skill Learning

```yaml
# Learnings from file-naming evolution applied to audio-actions
prompt_evolution:
  cross_skill_learning: true
  # If file-naming improved with "prioritized metadata" structure,
  # apply similar structure to audio-actions prompts
```

**Deliverable**: Meta-learning across skills

---

## CLI Commands (Power User Mode)

```bash
# View current prompt performance
tinyarms prompt stats file-naming

# Output:
# Skill: file-naming
# Current accuracy: 78% (down from 92%)
# Prompt version: 1 (active since 2024-09-15)
# Recent failures: 15/70 tasks (21%)
# Status: Evolution triggered, A/B testing in progress

# Force prompt evolution (skip waiting for drop)
tinyarms prompt evolve file-naming --variants 5

# Output:
# Generating 5 prompt variants with SmolLM2...
# Variants saved. Next 50 tasks will A/B test.

# View A/B test results
tinyarms prompt results file-naming

# Output:
# Evolution Session: abc123
# Variant A: 12 votes, 87% accuracy
# Variant B: 8 votes, 82% accuracy
# Variant C: 15 votes, 91% accuracy ← WINNING
# 5 tasks remaining in test period

# Manually promote a variant
tinyarms prompt promote file-naming variant_c
```

---

## References

- **SmolLM2 model card**: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
- **SmolLM2 announcement**: https://huggingface.co/blog/smollm2
- **Ollama SmolLM2 models**: https://ollama.com/library/smollm2
- **A/B testing best practices**: Kohavi & Longbotham (2017), "Online Controlled Experiments"
- **Prompt optimization**: OpenAI prompt engineering guide
- **Meta-learning**: Nichol et al. (2018), "Reptile: A Scalable Meta-Learning Algorithm"

---

## Status

**Phase**: Research (0% implemented)

**Next steps**:
1. Validate SmolLM2-360M-Instruct can generate coherent prompt variants
2. Build A/B testing UI (terminal prompt or macOS notification)
3. Implement SQLite schema for tracking
4. Test with file-naming skill (high variation, easy to judge)

**Timeline**:
- Phase 1 (Manual): Week 1-2 (build A/B framework)
- Phase 2 (SmolLM2): Week 3-4 (integrate model)
- Phase 3 (Production): Week 5+ (deploy to 1-2 skills)

---

**Back to**: [Main Overview](../05-prompt-evolution-system.md)
