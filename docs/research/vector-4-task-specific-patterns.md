# Vector 4: Task-Specific Prompt Engineering Patterns

**Status**: Research Complete
**Date**: 2025-10-27
**Target**: tinyArms skills (code-linting, file-naming, markdown-analysis, audio-actions)

---

## Summary

This research covers PROVEN prompt engineering patterns for tinyArms' 4 core skills, synthesized from official prompt libraries (Anthropic, OpenAI), production AI coding tools (GitHub Copilot, Cursor), and academic research. Key findings: (1) Few-shot examples increase accuracy 10-75% vs zero-shot, (2) Structured JSON schemas guarantee deterministic output, (3) Task decomposition improves complex reasoning by 200% for some models, (4) SmolLM2-360M requires aggressive prompt compression due to 8K token limit. For tinyArms prompt evolution, prioritize mutations that ADD structure (templates, examples), ADJUST verbosity, and MODIFY ordering—while avoiding mutations that change task objectives or exceed 8K tokens.

---

## Code Linting Prompts

### Effective Patterns

**Pattern 1: Rule Enumeration with Sequential Checking**

- **Description**: List all constitutional rules upfront, check each sequentially, report structured violations
- **Example**:
  ```markdown
  # Code Linting Prompt

  Analyze this code against constitutional principles from `.specify/memory/constitution.md`:

  Rules:
  1. No hardcoded colors (use design tokens from Tailwind)
  2. No magic numbers (use named constants)
  3. Files ≤350 LOC
  4. Import aliases: use @/ not ../../
  5. Evidence-based: all changes need line references (file.ts:42)

  For each violation found:
  - Rule: [rule name]
  - Line: [number or range]
  - Severity: ERROR | WARNING | INFO
  - Reason: [1 sentence explanation]
  - Fix: [suggested code change]

  Output JSON:
  {
    "violations": [
      {
        "rule": "hardcoded-colors",
        "line": 42,
        "severity": "ERROR",
        "reason": "Using #FF5733 instead of Tailwind token",
        "fix": "Replace with bg-red-500"
      }
    ],
    "total": 3,
    "passed": 2
  }
  ```
- **When to use**: Multiple constitutional rules, need deterministic output, pre-commit hooks (speed critical)
- **Evidence**: Rule-based evaluation is fast, deterministic, and easy to interpret (source: [Understanding the 4 Main Approaches to LLM Evaluation](https://magazine.sebastianraschka.com/p/llm-evaluation-4-approaches))

**Pattern 2: Few-Shot Examples with Severity Classification**

- **Description**: Provide 2-3 violation examples showing different severity levels, then analyze target code
- **Example**:
  ```markdown
  # Code Linting with Examples

  Here are examples of constitutional violations:

  Example 1 (ERROR):
  ```typescript
  const color = "#FF5733"; // Hardcoded color
  ```
  Fix: `const color = "bg-red-500";` (use Tailwind token)

  Example 2 (WARNING):
  ```typescript
  function calc() { return x * 100; } // Magic number
  ```
  Fix: `const PERCENTAGE = 100; return x * PERCENTAGE;`

  Example 3 (INFO):
  ```typescript
  import Button from "../../components/Button"; // Relative import
  ```
  Fix: `import Button from "@/components/Button";` (use alias)

  Now analyze this code:
  [CODE HERE]

  Output violations in same format.
  ```
- **When to use**: Model struggles with severity classification, new linting rules need examples
- **Evidence**: Few-shot prompting improves code-related tasks dramatically—Claude 3 Haiku: 11% accuracy (zero-shot) → 75% with 3 examples (source: [Few-shot prompting to improve tool-calling](https://blog.langchain.com/few-shot-prompting-to-improve-tool-calling-performance/))

**Pattern 3: Constitutional AI with Rule-First Filtering**

- **Description**: Start with fast rule-based checks (regex patterns), then use LLM for complex violations
- **Example**:
  ```markdown
  # Hybrid Linting: Rules + AI

  ## Phase 1: Fast Checks (regex, no AI)
  - Hardcoded hex colors: /#[0-9A-Fa-f]{6}/
  - Magic numbers: /\d{2,}/
  - File size: count lines

  ## Phase 2: AI Analysis (only if Phase 1 passes)
  Analyze for:
  - Architectural anti-patterns
  - DRY violations (duplicate logic)
  - Component decomposition issues

  Output: JSON with violations from both phases.
  ```
- **When to use**: Speed-critical contexts (pre-commit hooks <5s), need to filter obvious issues before expensive AI
- **Evidence**: Combining rule-based and LLM methods is recommended—start with rules to filter obvious issues, then use LLM for complex tasks (source: [LLM-as-a-Judge](https://www.evidentlyai.com/llm-guide/llm-as-a-judge))

**Pattern 4: Chain-of-Thought for Complex Rules**

- **Description**: For constitutional principles requiring reasoning (e.g., "Universal Reusability"), prompt model to think step-by-step
- **Example**:
  ```markdown
  # CoT Linting for Universal Reusability

  Rule: Everything must answer "Can someone else use this?"

  Analyze this utility function step-by-step:
  1. What does the function do?
  2. Is it app-specific or reusable?
  3. Are parameters generic or hardcoded?
  4. Can it be extracted to packages/?

  Then decide:
  - PASS: Function is generic and reusable
  - FAIL: Function has app-specific hardcoded values
  - WARNING: Function could be more generic

  Provide reasoning for each step.
  ```
- **When to use**: Complex constitutional principles (Principles I-XVII), need explainable decisions
- **Evidence**: Chain-of-thought prompting guides LLMs through intermediate reasoning steps, reducing errors (source: [Chain of Thought Prompting for LLMs](https://cameronrwolfe.substack.com/p/chain-of-thought-prompting-for-llms))

### Ineffective Patterns

**Anti-pattern 1: Vague Instructions**

- **Example**: "Check this code for issues"
- **Why it fails**: No criteria specified, subjective, non-deterministic output format
- **Evidence**: Vague prompts lead to generic, unhelpful responses due to lack of clear direction (source: [Common Mistakes in Prompt Engineering](https://futureskillsacademy.com/blog/common-prompt-engineering-mistakes/))

**Anti-pattern 2: Over-Complication with Too Many Rules**

- **Example**: Providing 50+ constitutional rules in one prompt
- **Why it fails**: LLMs have limited instruction-following capacity, performance degrades with too many requirements
- **Evidence**: Adding as many requirements as possible is an anti-pattern that doesn't scale due to LLMs' limited instruction-following capabilities (source: [14 Prompt Engineering Mistakes](https://odsc.medium.com/beyond-prompt-and-pray-14-prompt-engineering-mistakes-youre-probably-still-making-c2c3a32711bc))

**Anti-pattern 3: No Role Assignment**

- **Example**: Generic prompt without specifying AI's expertise
- **Why it fails**: AI produces generalized responses instead of specialized code review insights
- **Evidence**: Explicitly directing AI to adopt specific roles (e.g., "senior code reviewer") is underutilized but powerful (source: [7 Prompt Engineering Mistakes](https://www.promptjesus.com/blog/7-prompt-engineering-mistakes-beginners-must-avoid))

**Anti-pattern 4: Treating Prompting as One-Shot**

- **Example**: Single prompt without iterative refinement
- **Why it fails**: First attempt rarely produces perfect results, need iterative conversation
- **Evidence**: Treating prompting as one-shot instead of iterative conversation limits quality and specificity (source: [14 Prompt Engineering Mistakes](https://odsc.medium.com/beyond-prompt-and-pray-14-prompt-engineering-mistakes-youre-probably-still-making-c2c3a32711bc))

### Recommended Prompt Template

```markdown
# Code Linting Prompt (tinyArms)

**Role**: You are an expert code reviewer enforcing constitutional principles.

**Task**: Analyze this TypeScript/JavaScript code against NQH monorepo constitution.

**Constitutional Rules** (from `.specify/memory/constitution.md`):
1. **No Hardcoded Colors** (Principle XIII) - Use design tokens from Tailwind
2. **No Magic Numbers** (Principle X) - Use named constants
3. **File Size ≤350 LOC** (Principle X) - Exceeding requires refactor
4. **Import Aliases** (Principle X) - Use @/ not ../../
5. **Evidence-Based Completion** (Principle II) - All changes need line references
6. **DRY Violations** (Principle XV) - Duplicate logic must be extracted

**Severity Levels**:
- **ERROR**: Blocks commit (hardcoded colors, magic numbers, >350 LOC)
- **WARNING**: Should fix (import aliases, minor DRY)
- **INFO**: Suggestion (could be more generic)

**Code to Analyze**:
```typescript
[CODE CONTENT]
```

**Output Format** (strict JSON):
```json
{
  "violations": [
    {
      "rule": "hardcoded-colors",
      "line": 42,
      "severity": "ERROR",
      "reason": "Using #FF5733 instead of design token",
      "fix": "Replace with className='bg-red-500'"
    }
  ],
  "summary": {
    "total_violations": 3,
    "errors": 1,
    "warnings": 1,
    "info": 1
  },
  "decision": "BLOCK" | "WARN" | "PASS"
}
```

**Instructions**:
1. Check each rule sequentially (1-6)
2. For each violation: extract line number, classify severity, suggest fix
3. Output ONLY valid JSON (no markdown, no prose)
4. If no violations: `{"violations": [], "decision": "PASS"}`
```

### Variant Generation Strategies

**For code linting, SmolLM2-360M should mutate**:

1. **Rule Ordering**:
   - Original: Alphabetical
   - Variant A: High-severity first (errors → warnings → info)
   - Variant B: Frequency-based (most common violations first)

2. **Output Format**:
   - Original: JSON
   - Variant A: Markdown table
   - Variant B: Terse text (line:rule:severity)

3. **Example Inclusion**:
   - Original: No examples
   - Variant A: 1 example per rule
   - Variant B: Only examples for ERROR-level rules

4. **Explanation Verbosity**:
   - Original: 1 sentence reason
   - Variant A: Detailed explanation with constitutional reference
   - Variant B: Terse (10 words max)

5. **Role Assignment**:
   - Original: Generic reviewer
   - Variant A: "Senior TypeScript architect enforcing NQH constitution"
   - Variant B: "Pre-commit bot blocking violations"

**Avoid mutations that**:
- Remove severity classification (breaks pre-commit hook logic)
- Omit line numbers (violates Principle II: Evidence-Based Completion)
- Change task objective (linting → refactoring)

---

## File Naming Prompts

### Effective Patterns

**Pattern 1: Structured Format + Examples**

- **Description**: Provide naming template with format rules, show 3-5 examples covering diverse scenarios
- **Example**:
  ```markdown
  # Image File Naming

  **Format**: [main-subject]-[context]-[type].extension

  **Rules**:
  - kebab-case (lowercase, hyphens)
  - 3-6 words max (15-40 chars)
  - Main subject first (hero, dashboard, user-profile)
  - Context second (mobile, desktop, dark-mode)
  - Type last (screenshot, mockup, wireframe, photo)

  **Examples**:
  1. Screenshot of iPhone hero section → `hero-mobile-screenshot.png`
  2. Dashboard wireframe v3 → `dashboard-wireframe-v3.png`
  3. Golden Gate Bridge at sunset → `golden-gate-sunset-photo.jpg`
  4. User profile dark mode → `user-profile-dark-mode.png`
  5. Payment flow step 2 → `payment-flow-step2-screenshot.png`

  **Image to rename**:
  [IMAGE]

  **Output**: JSON with suggested filename and reasoning
  ```json
  {
    "filename": "hero-mobile-screenshot.png",
    "reasoning": "Shows hero section on mobile device, appears to be screenshot",
    "alternatives": ["mobile-hero-view.png", "hero-section-mobile.png"]
  }
  ```
  ```
- **When to use**: Consistent naming needed, user wants specific format, diverse image types (screenshots, photos, diagrams)
- **Evidence**: Few-shot examples illustrating format help guide model to stay on track (source: [Structured Output Best Practices](https://www.tredence.com/blog/prompt-engineering-best-practices-for-structured-ai-outputs))

**Pattern 2: Vision-Language Model with Semantic Extraction**

- **Description**: Use VLM to extract visual features (colors, shapes, objects), then map to semantic filename
- **Example**:
  ```markdown
  # VLM File Naming

  **Step 1: Visual Analysis**
  Describe this image:
  - Main subject: [person, building, UI element, etc.]
  - Context: [indoor, outdoor, device type, lighting]
  - Colors: [dominant colors]
  - Text visible: [any text in image]

  **Step 2: Semantic Mapping**
  Based on visual analysis, generate filename:
  - Subject → first word (dashboard, hero, profile)
  - Context → second word (mobile, desktop, dark)
  - Type → third word (screenshot, photo, mockup)

  **Step 3: Format**
  Apply kebab-case, validate length (15-40 chars)

  **Output**: JSON with filename + visual_features
  ```json
  {
    "filename": "dashboard-desktop-screenshot.png",
    "visual_features": {
      "subject": "analytics dashboard",
      "context": "desktop browser, light mode",
      "colors": ["blue", "white", "gray"],
      "text_visible": ["Revenue", "Analytics", "Dashboard"]
    }
  }
  ```
  ```
- **When to use**: Complex images requiring visual understanding, no text clues in filename
- **Evidence**: Vision-language models extract visual properties (colors, shapes, textures) and convert to embeddings for semantic understanding (source: [Vision Language Models Explained](https://huggingface.co/blog/vlms))

**Pattern 3: Constraint-Based with User Preferences**

- **Description**: Define hard constraints (format, length) and soft preferences (verbosity, style)
- **Example**:
  ```markdown
  # File Naming with Constraints

  **Hard Constraints** (MUST follow):
  - kebab-case only
  - 15-40 characters
  - No special chars except hyphens
  - Extension: .png, .jpg, .jpeg, .gif

  **Soft Preferences** (user preference):
  - Verbosity: CONCISE (3 words) vs VERBOSE (5-6 words)
  - Style: DESCRIPTIVE (what it shows) vs FUNCTIONAL (what it's for)

  **Examples**:
  - Concise: `hero-mobile.png`
  - Verbose: `hero-section-mobile-screenshot.png`
  - Descriptive: `golden-gate-sunset-photo.jpg`
  - Functional: `homepage-hero-banner.png`

  **User Preference**: [CONCISE, DESCRIPTIVE]

  **Image**: [IMAGE]

  **Output**: Single filename matching constraints + preferences
  ```
- **When to use**: User has specific naming style, need to balance constraints with preferences
- **Evidence**: Specifying constraints in prompts helps models generate focused responses (source: [Prompt Design Strategies](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-design-strategies))

**Pattern 4: Entity Extraction from Visual + Text**

- **Description**: Extract entities (product names, UI components, locations) then construct filename from entities
- **Example**:
  ```markdown
  # Entity-Based File Naming

  **Extract Entities**:
  1. Objects: [button, form, card, profile]
  2. UI Components: [navbar, sidebar, modal]
  3. Text Labels: [visible text in image]
  4. Device/Context: [mobile, desktop, tablet]

  **Construct Filename**:
  Priority: UI_Component > Object > Context > Type

  Example:
  - Entities: {object: "login form", component: "modal", context: "mobile"}
  - Filename: `login-modal-mobile-screenshot.png`

  **Image**: [IMAGE]

  **Output**:
  ```json
  {
    "entities": {
      "objects": ["button", "form fields"],
      "ui_component": "login modal",
      "text_labels": ["Sign In", "Email", "Password"],
      "context": "mobile"
    },
    "filename": "login-modal-mobile.png"
  }
  ```
  ```
- **When to use**: UI screenshots, product images with text, need consistent entity recognition
- **Evidence**: Entity extraction captures specific parameters like names, dates, locations from input (source: [Intent and Entity Extraction](https://medium.com/walmartglobaltech/joint-intent-classification-and-entity-recognition-for-conversational-commerce-35bf69195176))

### Ineffective Patterns

**Anti-pattern 1: Free-Form Description**

- **Example**: "Describe this image in a filename"
- **Why it fails**: No format guidance, inconsistent output (spaces, special chars, length)
- **Evidence**: Lack of specific format constraints leads to unpredictable output

**Anti-pattern 2: Over-Reliance on Text Recognition**

- **Example**: "Use visible text in image as filename"
- **Why it fails**: Text might be UI labels ("Submit", "Login") or irrelevant, not semantic content
- **Evidence**: Text alone doesn't capture semantic meaning of visual content

**Anti-pattern 3: No Length Constraints**

- **Example**: No character limit specified
- **Why it fails**: Produces overly long filenames (60+ chars), breaks filesystem conventions
- **Evidence**: Constraints help models generate focused responses (source: [Prompt Design Strategies](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-design-strategies))

### Recommended Prompt Template

```markdown
# File Naming Prompt (tinyArms)

**Role**: You are a file organization expert renaming images semantically.

**Task**: Rename this image using semantic content extracted from visual analysis.

**Format Rules**:
- **kebab-case**: lowercase, hyphens only (hero-mobile-screenshot.png)
- **Length**: 15-40 characters (excluding extension)
- **Structure**: [subject]-[context]-[type].ext
  - Subject: Main visual element (hero, dashboard, profile)
  - Context: Device/mode/version (mobile, dark-mode, v2)
  - Type: Image category (screenshot, mockup, photo, wireframe)

**Examples**:
1. iPhone screenshot of hero section → `hero-mobile-screenshot.png`
2. Dashboard wireframe version 3 → `dashboard-wireframe-v3.png`
3. Photo of Golden Gate Bridge at sunset → `golden-gate-sunset-photo.jpg`

**Visual Analysis Steps**:
1. Identify main subject (UI component, object, scene)
2. Determine context (device type, lighting, version)
3. Classify type (screenshot, photo, mockup, diagram)
4. Extract any visible text labels

**Image to Rename**:
[IMAGE]

**Output Format** (strict JSON):
```json
{
  "filename": "hero-mobile-screenshot.png",
  "reasoning": "Main subject is hero section, context is mobile device, type is screenshot",
  "visual_analysis": {
    "subject": "hero section",
    "context": "mobile viewport",
    "type": "screenshot",
    "visible_text": ["Welcome", "Get Started"]
  },
  "alternatives": [
    "mobile-hero-screenshot.png",
    "hero-section-mobile.png"
  ]
}
```

**Instructions**:
1. Analyze image visually (subject, context, type)
2. Extract visible text (if any)
3. Construct filename following format rules
4. Validate length (15-40 chars)
5. Provide 2 alternative filenames
6. Output ONLY valid JSON
```

### Variant Generation Strategies

**For file naming, SmolLM2-360M should mutate**:

1. **Format Strictness**:
   - Original: Strict [subject]-[context]-[type]
   - Variant A: Flexible ordering based on image type
   - Variant B: Single-word subject allowed (photo.jpg → sunset-photo.jpg)

2. **Verbosity**:
   - Original: 3 words (hero-mobile-screenshot)
   - Variant A: Concise 2 words (hero-mobile)
   - Variant B: Verbose 4-5 words (hero-section-mobile-v2-screenshot)

3. **Visual Analysis Detail**:
   - Original: Brief analysis (subject, context, type)
   - Variant A: Detailed (colors, objects, layout)
   - Variant B: Minimal (main subject only)

4. **Example Coverage**:
   - Original: 3 diverse examples
   - Variant A: 5 examples covering edge cases (no text, abstract images)
   - Variant B: 1 example matching target image type

5. **Alternative Generation**:
   - Original: 2 alternatives
   - Variant A: 5 alternatives with ranking
   - Variant B: No alternatives (single best choice)

**Avoid mutations that**:
- Remove kebab-case constraint (breaks filesystem consistency)
- Omit length limits (produces unusably long filenames)
- Change extension (.png → .txt)

---

## Markdown Analysis Prompts

### Effective Patterns

**Pattern 1: Map-Reduce for Long Documents**

- **Description**: Split markdown into chunks, analyze each chunk (map), then synthesize all analyses (reduce)
- **Example**:
  ```markdown
  # Map-Reduce Markdown Analysis

  **Map Phase** (per chunk):
  Analyze this markdown section:
  - Main topic: [summarize in 1 sentence]
  - Key changes: [list bullet points]
  - Importance: HIGH | MEDIUM | LOW

  **Reduce Phase** (after all chunks):
  Synthesize all sections:
  - Overall summary: [2-3 sentences]
  - Top 3 important changes
  - Conflicting decisions (if any)

  **Output**: JSON with section analyses + synthesis
  ```json
  {
    "sections": [
      {
        "chunk": 1,
        "topic": "Constitutional Principle I: Universal Reusability",
        "changes": ["Added packages/ directory requirement", "Clarified shared code rules"],
        "importance": "HIGH"
      }
    ],
    "synthesis": {
      "summary": "Constitution updated with stricter reusability rules and package organization",
      "top_changes": ["Universal Reusability clarified", "File size limit reduced to 350 LOC", "DRY enforcement added"],
      "conflicts": []
    }
  }
  ```
  ```
- **When to use**: Long documents (>4K tokens), need chunk-wise summarization
- **Evidence**: Map-Reduce splits document into chunks, creates summary per chunk, then synthesizes final summary from all chunks (source: [Summarization with LangChain](https://medium.com/@abonia/summarization-with-langchain-b3d83c030889))

**Pattern 2: Refine/Iterative for Incremental Updates**

- **Description**: Create summary for first section, then iteratively refine with each subsequent section
- **Example**:
  ```markdown
  # Iterative Markdown Analysis

  **Iteration 1** (first section):
  Summarize section 1:
  - Topic: [main topic]
  - Key points: [bullets]

  **Iteration 2** (add section 2):
  Previous summary: [from iteration 1]
  New section: [section 2 content]

  Refined summary:
  - Updated topic: [incorporate new info]
  - New key points: [merge with previous]
  - Changes detected: [what's new in section 2]

  **Continue** until all sections processed.

  **Output**: Final refined summary after all iterations
  ```
- **When to use**: Incremental document updates (daily changes), need context from previous versions
- **Evidence**: Refine method iteratively updates answer by looping over documents, passing current document + latest intermediate answer to get refined answer (source: [Summarization with LangChain](https://medium.com/@abonia/summarization-with-langchain-b3d83c030889))

**Pattern 3: Diff Analysis with Change Detection**

- **Description**: Compare current version vs previous version, extract added/removed/modified sections
- **Example**:
  ```markdown
  # Markdown Diff Analysis

  **Previous Version** (committed):
  ```markdown
  [OLD CONTENT]
  ```

  **Current Version** (uncommitted):
  ```markdown
  [NEW CONTENT]
  ```

  **Diff Analysis**:
  1. Added sections: [list with line numbers]
  2. Removed sections: [list with line numbers]
  3. Modified sections: [list with changes summary]

  **Change Classification**:
  - BREAKING: Changes constitutional principles
  - MAJOR: New requirements or rules
  - MINOR: Clarifications or examples
  - PATCH: Typo fixes

  **Output**:
  ```json
  {
    "changes": [
      {
        "type": "MAJOR",
        "section": "Principle XV: DRY Enforcement",
        "change": "Added new constitutional principle",
        "line_range": "1029-1141",
        "impact": "All future code must follow DRY"
      }
    ],
    "summary": "Added DRY enforcement principle, requires extracting duplicates after 3 occurrences"
  }
  ```
  ```
- **When to use**: Version control integration, need to track what changed between commits
- **Evidence**: LLM-based diff analysis processes diffs into markdown-formatted outputs for easier analysis (source: [Automated Patch Diff Analysis](https://blog.syss.com/posts/automated-patch-diff-analysis-using-llms/))

**Pattern 4: Structured Output for Importance Ranking**

- **Description**: Extract sections, rank by importance, provide reasoning for ranking
- **Example**:
  ```markdown
  # Markdown Importance Ranking

  **Task**: Analyze this markdown and rank sections by importance for NQH project.

  **Criteria**:
  - CRITICAL: Affects all developers, constitutional changes
  - HIGH: New features, major decisions
  - MEDIUM: Clarifications, examples
  - LOW: Typos, formatting

  **Document**: [MARKDOWN CONTENT]

  **Output**:
  ```json
  {
    "ranked_sections": [
      {
        "rank": 1,
        "importance": "CRITICAL",
        "section": "Principle XV: DRY Enforcement",
        "line_range": "1029-1141",
        "reason": "New constitutional principle affecting all code",
        "action_required": "Review all existing code for DRY violations"
      },
      {
        "rank": 2,
        "importance": "HIGH",
        "section": "App Scaffolding Standards",
        "line_range": "660-701",
        "reason": "New apps must use pnpm create-app",
        "action_required": "Update onboarding docs"
      }
    ]
  }
  ```
  ```
- **When to use**: Documentation updates need prioritization, help developers focus on important changes
- **Evidence**: Structured prompts with constraints govern response length, formatting, and topics covered (source: [Conversational vs Structured Prompting](https://promptengineering.org/a-guide-to-conversational-and-structured-prompting/))

### Ineffective Patterns

**Anti-pattern 1: Single-Pass Long Document**

- **Example**: Passing entire 5K+ line markdown to single prompt
- **Why it fails**: Exceeds context window (SmolLM2: 8K tokens), loses detail in middle sections
- **Evidence**: Smaller models (135M, 360M) struggle beyond 8K tokens (source: [SmolLM2 Research](https://arxiv.org/html/2502.02737v1))

**Anti-pattern 2: Narrative Summary Instead of Structured**

- **Example**: "Summarize this markdown in 3 paragraphs"
- **Why it fails**: Produces prose, hard to extract actionable info, not machine-readable
- **Evidence**: Documentation should use tables/bullets/headers, not prose (source: NQH Constitution Principle XVI)

**Anti-pattern 3: No Change Detection Baseline**

- **Example**: Analyze current version without comparing to previous
- **Why it fails**: Can't identify what changed, produces full summary every time
- **Evidence**: Diff analysis requires comparing versions to detect changes (source: [Chopdiff](https://github.com/jlevy/chopdiff))

### Recommended Prompt Template

```markdown
# Markdown Analysis Prompt (tinyArms)

**Role**: You are a technical documentation analyst tracking changes in `.specify/memory/` constitutional documents.

**Task**: Analyze markdown changes and extract important updates for NQH developers.

**Context**:
- Project: NQH monorepo (17 constitutional principles)
- Location: `.specify/memory/constitution.md` (single source of truth)
- Frequency: Check every 2 hours for changes

**Analysis Steps**:

1. **Change Detection**:
   - Compare current vs previous version (git diff)
   - Classify changes: BREAKING | MAJOR | MINOR | PATCH
   - Extract line ranges for each change

2. **Importance Ranking**:
   - CRITICAL: Constitutional principle changes (affects all code)
   - HIGH: New requirements or standards
   - MEDIUM: Clarifications, examples added
   - LOW: Typo fixes, formatting

3. **Impact Assessment**:
   - Who is affected? (all devs, specific apps, future only)
   - Action required? (review code, update docs, notify team)
   - Breaking changes? (requires immediate attention)

**Markdown Document**:
```markdown
[CURRENT VERSION]
```

**Previous Version** (for diff):
```markdown
[PREVIOUS VERSION]
```

**Output Format** (strict JSON):
```json
{
  "analysis_date": "2025-10-27T10:30:00Z",
  "changes": [
    {
      "type": "MAJOR",
      "importance": "CRITICAL",
      "section": "Principle XV: DRY Enforcement",
      "line_range": "1029-1141",
      "change_summary": "Added new constitutional principle requiring DRY after 3 duplicates",
      "impact": {
        "affected": "all developers",
        "action_required": "Review existing code for DRY violations",
        "breaking": false
      },
      "diff": {
        "added": 112,
        "removed": 0,
        "modified": 0
      }
    }
  ],
  "summary": {
    "total_changes": 3,
    "critical": 1,
    "high": 1,
    "medium": 1,
    "requires_notification": true,
    "conflicting_decisions": []
  }
}
```

**Instructions**:
1. If no previous version: Provide full summary (no diff)
2. If versions match: Output `{"changes": [], "summary": "No updates"}`
3. For each change: Extract line range, classify importance, assess impact
4. Detect conflicts: Check if new rules contradict existing principles
5. Output ONLY valid JSON
```

### Variant Generation Strategies

**For markdown analysis, SmolLM2-360M should mutate**:

1. **Chunking Strategy**:
   - Original: Map-reduce (split into chunks)
   - Variant A: Iterative refine (process sequentially)
   - Variant B: Single-pass (if document <4K tokens)

2. **Change Classification**:
   - Original: 4 levels (BREAKING, MAJOR, MINOR, PATCH)
   - Variant A: 3 levels (HIGH, MEDIUM, LOW)
   - Variant B: 2 levels (IMPORTANT, NOT_IMPORTANT)

3. **Output Verbosity**:
   - Original: Full JSON with diff stats
   - Variant A: Concise (only changed sections)
   - Variant B: Terse (1-line summary per change)

4. **Context Inclusion**:
   - Original: Show previous version for diff
   - Variant A: Only current version (summarize)
   - Variant B: Git-style diff format (+ and -)

5. **Importance Criteria**:
   - Original: Based on constitutional impact
   - Variant A: Based on affected developers (all vs some)
   - Variant B: Based on urgency (immediate vs future)

**Avoid mutations that**:
- Remove change detection (loses tracking capability)
- Omit line ranges (violates Evidence-Based Completion)
- Produce narrative prose instead of structured JSON

---

## Audio Action Extraction Prompts

### Effective Patterns

**Pattern 1: Intent Classification + Entity Extraction**

- **Description**: First classify user intent (command, request, note), then extract entities (dates, names, tasks)
- **Example**:
  ```markdown
  # Audio Action Extraction

  **Transcription**: [AUDIO TEXT]

  **Step 1: Intent Classification**
  Classify speaker's intent:
  - COMMAND: Direct instruction ("Schedule meeting with John")
  - REQUEST: Asking for something ("Can you find last week's notes?")
  - NOTE: Recording information ("Met with client, discussed pricing")
  - QUESTION: Asking for information ("What's the deadline?")

  **Step 2: Entity Extraction**
  Extract:
  - People: [names mentioned]
  - Dates/Times: [any temporal references]
  - Tasks: [action items]
  - Context: [project, location, dependencies]

  **Step 3: Action Generation**
  Based on intent + entities, generate CLI commands:
  - Schedule → `tinyarms remind "Meeting with John" --date 2025-10-28`
  - Find → `tinyarms search "notes" --after 2025-10-20`

  **Output**:
  ```json
  {
    "intent": "COMMAND",
    "entities": {
      "people": ["John"],
      "dates": ["2025-10-28"],
      "tasks": ["Schedule meeting"],
      "context": "Discuss Q4 roadmap"
    },
    "actions": [
      {
        "type": "reminder",
        "command": "tinyarms remind 'Meeting with John' --date 2025-10-28",
        "priority": "HIGH",
        "reason": "User explicitly requested scheduling"
      }
    ]
  }
  ```
  ```
- **When to use**: Voice transcriptions with clear action items, need structured task extraction
- **Evidence**: Intent classification and entity extraction are fundamental for conversational AI (source: [Intent and Entity Recognition](https://medium.com/walmartglobaltech/joint-intent-classification-and-entity-recognition-for-conversational-commerce-35bf69195176))

**Pattern 2: Few-Shot with Utterance Examples**

- **Description**: Provide sample utterances with extracted actions, then analyze target transcription
- **Example**:
  ```markdown
  # Audio Action Extraction with Examples

  **Example 1**:
  Utterance: "Remind me to review the pull request tomorrow at 10am"
  Intent: COMMAND
  Entities: {task: "review pull request", date: "tomorrow", time: "10am"}
  Action: `tinyarms remind "Review PR" --date tomorrow --time 10:00`

  **Example 2**:
  Utterance: "I met with Sarah yesterday, she agreed to send designs by Friday"
  Intent: NOTE
  Entities: {person: "Sarah", task: "send designs", deadline: "Friday"}
  Action: `tinyarms task create "Sarah sends designs" --deadline Friday`

  **Example 3**:
  Utterance: "Can you find the notes from last week's meeting?"
  Intent: QUESTION
  Entities: {search_query: "notes", timeframe: "last week"}
  Action: `tinyarms search "meeting notes" --after last-week`

  **Your Turn**:
  Utterance: [TRANSCRIPTION]

  Extract intent, entities, and generate action command.
  ```
- **When to use**: Model struggles with intent classification, new users with varied speech patterns
- **Evidence**: Sample utterances associated with intents improve intent recognition (source: [How Intent Recognizers Work](https://datascience.stackexchange.com/questions/11043/how-do-intent-recognisers-work))

**Pattern 3: Constrained Output with Command Templates**

- **Description**: Define available CLI commands upfront, constrain LLM to only generate valid commands
- **Example**:
  ```markdown
  # Audio Actions with Command Constraints

  **Available Commands** (tinyArms CLI):
  1. `tinyarms remind "[text]" --date [YYYY-MM-DD] --time [HH:MM]`
  2. `tinyarms task create "[text]" --priority [HIGH|MEDIUM|LOW] --deadline [YYYY-MM-DD]`
  3. `tinyarms search "[query]" --after [date] --before [date]`
  4. `tinyarms note add "[text]" --tags [tag1,tag2]`

  **Constraints**:
  - Output ONLY commands from list above
  - Use valid date formats (YYYY-MM-DD or relative like "tomorrow")
  - Priority: HIGH (urgent), MEDIUM (soon), LOW (someday)

  **Transcription**: [AUDIO TEXT]

  **Output**:
  ```json
  {
    "commands": [
      "tinyarms remind 'Meeting with John' --date 2025-10-28 --time 14:00"
    ],
    "entities": {
      "people": ["John"],
      "dates": ["2025-10-28"],
      "times": ["14:00"]
    }
  }
  ```
  ```
- **When to use**: Need deterministic command generation, prevent hallucinated commands
- **Evidence**: Constraints in prompts help models generate focused, valid responses (source: [Prompt Design Strategies](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-design-strategies))

**Pattern 4: Multi-Step Reasoning for Context**

- **Description**: Break transcription analysis into steps: understand context → identify actions → prioritize → generate commands
- **Example**:
  ```markdown
  # Multi-Step Audio Action Analysis

  **Transcription**: [AUDIO TEXT]

  **Step 1: Context Understanding**
  - What is the speaker discussing? (work, personal, ideas)
  - Who is involved? (names, roles)
  - When does this need to happen? (urgency)

  **Step 2: Action Identification**
  - What are the explicit action items? ("schedule", "remind", "review")
  - What are the implicit tasks? (mentioned but not stated as tasks)

  **Step 3: Prioritization**
  - HIGH: Deadlines today/tomorrow, explicit urgency
  - MEDIUM: This week, normal importance
  - LOW: Someday, ideas, notes

  **Step 4: Command Generation**
  For each action, generate CLI command with:
  - Task text (clear, actionable)
  - Date/time (if mentioned)
  - Priority (based on step 3)

  **Output**: JSON with reasoning for each step + final commands
  ```
- **When to use**: Complex transcriptions with multiple topics, need explainable action extraction
- **Evidence**: Chain-of-thought prompting breaks tasks into steps, improving reasoning (source: [Chain of Thought Prompting](https://www.ibm.com/think/topics/chain-of-thoughts))

### Ineffective Patterns

**Anti-pattern 1: Direct Transcription → Command**

- **Example**: "Convert this transcription to CLI commands: [AUDIO]"
- **Why it fails**: No entity extraction, no intent classification, produces invalid commands
- **Evidence**: Entity extraction requires structured approach, not direct conversion

**Anti-pattern 2: Asking for Summary Instead of Actions**

- **Example**: "Summarize this audio transcription"
- **Why it fails**: Produces narrative summary, not actionable tasks or commands
- **Evidence**: tinyArms skill requirement: "SUGGEST ACTIONS (not summary)" (source: `03-SKILLS.md:133`)

**Anti-pattern 3: No Temporal Context**

- **Example**: Extracting tasks without dates/deadlines
- **Why it fails**: Tasks lack urgency, can't schedule reminders without dates
- **Evidence**: Entity extraction must include dates/times for temporal references (source: [Intent and Entity Extraction](https://medium.com/walmartglobaltech/joint-intent-classification-and-entity-recognition-for-conversational-commerce-35bf69195176))

**Anti-pattern 4: Hallucinated Commands**

- **Example**: Generating commands not in CLI spec
- **Why it fails**: Commands fail to execute, breaks user trust
- **Evidence**: Constraints prevent hallucination by limiting valid outputs

### Recommended Prompt Template

```markdown
# Audio Action Extraction Prompt (tinyArms)

**Role**: You are a voice assistant extracting actionable tasks from transcribed audio.

**Task**: Analyze MacWhisper transcription and generate tinyArms CLI commands for action items.

**Available Commands**:
1. `tinyarms remind "[text]" --date [YYYY-MM-DD] --time [HH:MM] --priority [HIGH|MEDIUM|LOW]`
2. `tinyarms task create "[text]" --priority [HIGH|MEDIUM|LOW] --deadline [YYYY-MM-DD]`
3. `tinyarms search "[query]" --after [date] --before [date]`
4. `tinyarms note add "[text]" --tags [tag1,tag2]`

**Constraints**:
- Output ONLY commands from list above (no hallucinated commands)
- Use valid date formats: YYYY-MM-DD or relative (tomorrow, next-week, today)
- Priority: HIGH (urgent, deadlines <48h), MEDIUM (this week), LOW (someday)

**Entity Extraction**:
Extract these entities from transcription:
- **People**: Names, roles (e.g., "John", "the designer")
- **Dates/Times**: Explicit or relative ("tomorrow at 3pm", "next Friday")
- **Tasks**: Action verbs + objects ("review PR", "send email", "update docs")
- **Context**: Projects, dependencies, locations

**Intent Classification**:
- **COMMAND**: Direct instruction → Generate CLI command
- **REQUEST**: Asking for something → Generate search/query command
- **NOTE**: Recording information → Generate note command
- **QUESTION**: Asking for info → No command (informational only)

**MacWhisper Transcription**:
```
[TRANSCRIPTION TEXT]
```

**Analysis Steps**:
1. Classify overall intent (COMMAND, REQUEST, NOTE, QUESTION)
2. Extract entities (people, dates, tasks, context)
3. Identify priority (based on urgency keywords: "urgent", "ASAP", "today")
4. Generate CLI commands (only for COMMAND, REQUEST, NOTE intents)
5. Provide reasoning for each command

**Output Format** (strict JSON):
```json
{
  "intent": "COMMAND",
  "entities": {
    "people": ["John", "Sarah"],
    "dates": ["2025-10-28"],
    "times": ["14:00"],
    "tasks": ["Schedule meeting", "Review designs"],
    "context": "Q4 roadmap discussion"
  },
  "actions": [
    {
      "command": "tinyarms remind 'Meeting with John and Sarah' --date 2025-10-28 --time 14:00 --priority HIGH",
      "reasoning": "User explicitly requested scheduling for specific date/time",
      "entities_used": ["John", "Sarah", "2025-10-28", "14:00"]
    },
    {
      "command": "tinyarms task create 'Review Sarah designs' --priority MEDIUM --deadline 2025-10-30",
      "reasoning": "Implicit task mentioned during meeting context",
      "entities_used": ["Sarah", "designs"]
    }
  ],
  "summary": "Extracted 2 action items: 1 meeting reminder (HIGH priority), 1 follow-up task (MEDIUM priority)"
}
```

**Instructions**:
1. If intent is QUESTION: Output `{"actions": [], "reasoning": "No actionable task"}`
2. If no entities found: Output warning in reasoning field
3. For each command: Validate against available commands list
4. Use context to infer missing dates (e.g., "tomorrow" → calculate actual date)
5. Output ONLY valid JSON
```

### Variant Generation Strategies

**For audio action extraction, SmolLM2-360M should mutate**:

1. **Intent Granularity**:
   - Original: 4 intents (COMMAND, REQUEST, NOTE, QUESTION)
   - Variant A: 6 intents (add IDEA, REMINDER)
   - Variant B: 2 intents (ACTIONABLE, NOT_ACTIONABLE)

2. **Entity Extraction Depth**:
   - Original: Extract people, dates, tasks, context
   - Variant A: Add locations, emotions, urgency keywords
   - Variant B: Minimal (tasks and dates only)

3. **Command Generation Style**:
   - Original: One command per action item
   - Variant A: Batch related tasks into single command
   - Variant B: Generate alternatives (2-3 commands per task)

4. **Priority Classification**:
   - Original: 3 levels (HIGH, MEDIUM, LOW)
   - Variant A: 5 levels (URGENT, HIGH, MEDIUM, LOW, SOMEDAY)
   - Variant B: 2 levels (URGENT, NORMAL)

5. **Example Coverage**:
   - Original: 3 examples (command, note, question)
   - Variant A: 6 examples covering edge cases (unclear intent, missing dates)
   - Variant B: 1 example matching transcription type

**Avoid mutations that**:
- Add commands not in CLI spec (causes execution failures)
- Remove entity extraction (loses context)
- Change JSON output structure (breaks parsing)
- Omit date formats (invalid commands)

---

## Cross-Task Patterns

### Pattern: Few-Shot Examples

**Works best for**:
- File naming (format demonstration)
- Audio actions (utterance examples)
- Code linting (violation examples)

**Less effective for**:
- Markdown analysis (documents too varied, hard to generalize)
- Simple rule-based tasks (regex patterns faster than examples)

**Evidence**: Few-shot prompting improves accuracy 10-75% depending on task complexity. Claude 3 Haiku: 11% (zero-shot) → 75% (3 examples) for tool-calling. Sentiment analysis: 10% improvement with few-shot (sources: [Few-shot prompting](https://blog.langchain.com/few-shot-prompting-to-improve-tool-calling-performance/), [Zero-shot vs Few-shot](https://www.analyticsvidhya.com/blog/2023/09/power-of-llms-zero-shot-and-few-shot-prompting/))

**Optimal Example Count**:
- **1-3 examples**: Ideal for most tasks (source: [Structured Output Best Practices](https://www.tredence.com/blog/prompt-engineering-best-practices-for-structured-ai-outputs))
- **3-5 examples**: For diverse input types (file naming, audio transcriptions)
- **>5 examples**: Overhead risk, possible confusion

**Selection Strategy**: Use most relevant examples for new input, not fixed set (source: [Few-shot prompting effectiveness](https://shelf.io/blog/zero-shot-and-few-shot-prompting/))

---

### Pattern: Chain-of-Thought (CoT)

**Works best for**:
- Complex constitutional rules (Universal Reusability, DRY enforcement)
- Multi-step audio action analysis (context → actions → prioritization)
- Markdown diff analysis (detect → classify → assess impact)

**Less effective for**:
- Simple classification tasks (file naming, intent classification)
- Speed-critical contexts (pre-commit hooks <5s)
- O1-class reasoning models (they prefer direct instructions)

**Evidence**: CoT guides LLMs through intermediate reasoning steps, reducing errors. However, specialized reasoning models (O1) perform better with direct instructions rather than explicit CoT prompts (sources: [Chain of Thought Prompting](https://cameronrwolfe.substack.com/p/chain-of-thought-prompting-for-llms), [14 Prompt Engineering Mistakes](https://odsc.medium.com/beyond-prompt-and-pray-14-prompt-engineering-mistakes-youre-probably-still-making-c2c3a32711bc))

**When to use**:
- Multi-step reasoning required (3+ steps)
- Need explainable decisions (why this severity? why this priority?)
- Complex domain logic (constitutional principles, architectural patterns)

**Format**:
```markdown
Think step-by-step:
1. [First step description]
2. [Second step description]
3. [Final decision]

Provide reasoning for each step.
```

---

### Pattern: Constrained Output (JSON Schema)

**Works best for**:
- All tinyArms skills (deterministic output required)
- Pre-commit hooks (strict pass/fail decisions)
- CLI command generation (must be valid)

**Less effective for**:
- Creative tasks (image descriptions, naming alternatives)
- Exploratory analysis (discovering patterns in code)

**Evidence**: JSON Schema enforces structure, making LLM output predictable and machine-readable. OpenAI's Structured Outputs (2025) guarantee schema adherence, not just valid JSON. Constraining generation with schema rules reduces need for post-processing (sources: [How JSON Schema Works](https://blog.promptlayer.com/how-json-schema-works-for-structured-outputs-and-tool-integration/), [Structured Output Generation](https://medium.com/@emrekaratas-ai/structured-output-generation-in-llms-json-schema-and-grammar-based-decoding-6a5c58b698a6))

**Implementation**:
```markdown
**Output Format** (strict JSON):
```json
{
  "field1": "value",
  "field2": 123,
  "field3": ["item1", "item2"]
}
```

Output ONLY valid JSON (no markdown, no prose).
```

**For SmolLM2-360M**:
- Use explicit JSON schema in prompt (shows exact structure)
- Add "Output ONLY valid JSON" instruction
- Validate output with JSON.parse() before using

---

### Pattern: Task Decomposition

**Works best for**:
- Markdown analysis (split → analyze → synthesize)
- Audio actions (classify → extract → generate → prioritize)
- Complex code linting (fast rules → AI analysis)

**Less effective for**:
- Simple tasks (file naming is single-step)
- Atomic operations (single-file linting)

**Evidence**: Task decomposition breaks complex problems into smaller subtasks, improving reasoning and reducing errors. Decomposed Prompting delegates subtasks to specialized LLM prompts (sources: [Advanced Decomposition Techniques](https://learnprompting.org/docs/advanced/decomposition/introduction), [Decomposed Prompting](https://arxiv.org/abs/2210.02406))

**Strategies**:
1. **Sequential**: Step 1 → Step 2 → Step 3 (audio actions)
2. **Map-Reduce**: Split → Analyze chunks → Synthesize (markdown)
3. **Hybrid**: Fast rules → AI for complex cases (code linting)

**When to use**:
- Task requires 3+ distinct steps
- Each step has different requirements (classification vs generation)
- Need to optimize different steps independently (fast rules + slow AI)

---

### Pattern: Role Assignment

**Works best for**:
- All tasks (establishes expertise lens)
- Domain-specific tasks (code review, file organization)

**Less effective for**:
- Generic tasks with no domain expertise needed

**Evidence**: Explicitly directing AI to adopt specific roles (e.g., "senior code reviewer") is underutilized but powerful. Produces specialized insights vs generalized responses (source: [7 Prompt Engineering Mistakes](https://www.promptjesus.com/blog/7-prompt-engineering-mistakes-beginners-must-avoid))

**Examples**:
- Code linting: "You are a senior code reviewer enforcing constitutional principles"
- File naming: "You are a file organization expert"
- Markdown analysis: "You are a technical documentation analyst"
- Audio actions: "You are a voice assistant extracting tasks"

**Format**:
```markdown
**Role**: You are [specific role with expertise].

**Task**: [What to do]
```

---

## Prompt Evolution Guidance

### For SmolLM2 Generating Variants, Prioritize Mutations That:

1. **Add Structure**:
   - Templates: Provide format examples (`[subject]-[context]-[type].ext`)
   - Constraints: Specify limits (length, format, valid values)
   - Schemas: Show exact JSON structure expected

2. **Adjust Verbosity**:
   - Concise: Reduce explanation length (1 sentence reason)
   - Detailed: Add reasoning steps, examples, alternatives
   - Terse: Ultra-short (line:rule:severity)

3. **Change Ordering**:
   - Rules: High-severity first vs alphabetical vs frequency-based
   - Steps: Different sequences for multi-step tasks
   - Priorities: Urgent tasks first vs chronological

4. **Modify Output Format**:
   - JSON vs Markdown table vs plain text
   - Nested vs flat structure
   - Verbose vs minimal fields

5. **Include/Exclude Examples**:
   - Zero-shot: No examples (baseline)
   - Few-shot: 1-3 examples (standard)
   - Many-shot: 5+ examples (edge cases)

6. **Adjust Role/Context**:
   - Generic: "You are an assistant"
   - Specific: "You are a senior TypeScript architect"
   - Constrained: "You are a pre-commit bot (strict mode)"

### Avoid Mutations That:

1. **Change Task Objective**:
   - ❌ Code linting → Code refactoring
   - ❌ File naming → File organizing
   - ❌ Markdown analysis → Markdown generation

2. **Remove Critical Constraints**:
   - ❌ Remove kebab-case requirement (file naming)
   - ❌ Remove line references (code linting)
   - ❌ Remove JSON schema (all tasks)
   - ❌ Remove severity classification (code linting)

3. **Exceed Token Limits**:
   - ❌ Prompts >8K tokens (SmolLM2-360M limit)
   - ❌ Add 50+ examples (overhead)
   - ❌ Include full document in prompt (use chunking)

4. **Break Output Format**:
   - ❌ Change from JSON to prose (breaks parsing)
   - ❌ Omit required fields (e.g., line numbers)
   - ❌ Add fields not in schema

5. **Reduce Determinism**:
   - ❌ Remove constraints ("be creative")
   - ❌ Add ambiguous instructions ("try to...")
   - ❌ Request subjective output without criteria

### Mutation Strategies by Task Type

**Code Linting**:
- ✅ Mutate: Rule ordering, severity thresholds, output format
- ✅ Keep: Rule list, line references, JSON schema
- ❌ Avoid: Adding new rules not in constitution

**File Naming**:
- ✅ Mutate: Verbosity (concise vs verbose), format strictness
- ✅ Keep: kebab-case, length limits (15-40 chars), extension
- ❌ Avoid: Removing format constraints

**Markdown Analysis**:
- ✅ Mutate: Chunking strategy, importance criteria, change classification
- ✅ Keep: Structured output, line ranges, diff comparison
- ❌ Avoid: Narrative summaries instead of structured JSON

**Audio Actions**:
- ✅ Mutate: Intent granularity, priority levels, entity depth
- ✅ Keep: CLI command list, entity extraction, JSON output
- ❌ Avoid: Hallucinated commands, removing date formats

---

## Implementation Roadmap

### Phase 1: Implement Templates (Week 1-2)

**Goal**: Create initial prompt templates for all 4 skills

**Tasks**:
1. Create `skills/code-linting-fast.prompt.md` (Rule enumeration pattern)
2. Create `skills/file-naming.prompt.md` (Structured format + examples)
3. Create `skills/markdown-analysis.prompt.md` (Map-reduce pattern)
4. Create `skills/audio-actions.prompt.md` (Intent + entity extraction)

**Deliverables**:
- 4 prompt template files in `apps/tinyArms/skills/`
- Each template includes: role, task, constraints, examples, output schema
- Validation: Templates produce valid JSON output

**Success Criteria**:
- Templates work with SmolLM2-360M (token limit <8K)
- Output parses as valid JSON
- Accuracy baseline: code-linting 85%, file-naming 90%, markdown 80%, audio 75%

---

### Phase 2: Train SmolLM2 on Mutation Strategies (Week 3-4)

**Goal**: Teach SmolLM2-360M to generate prompt variants using proven mutation strategies

**Approach**: Use Flan-T5-Small (8GB M1 compatible) to generate initial mutations, SmolLM2 validates

**Tasks**:
1. Create mutation instruction prompts for Flan-T5:
   - "Generate 3 variants of this prompt: Original [PROMPT]. Mutate: verbosity, examples, ordering."
   - Constrain mutations: "Keep JSON schema, change only [aspect]"
2. Generate 10 variants per skill template (40 total)
3. Validate variants with SmolLM2 (ensure valid JSON output)
4. Store variants in `apps/tinyArms/skills/variants/`

**Deliverables**:
- 40 prompt variants (10 per skill)
- Mutation metadata: which aspect changed (verbosity, ordering, examples)
- Validation report: which variants produce valid output

**Success Criteria**:
- 80% of variants produce valid JSON
- At least 3 mutation types per skill (verbosity, ordering, examples)
- No variants exceed 8K tokens

---

### Phase 3: Validate Variants Maintain Task Objectives (Week 5-6)

**Goal**: Ensure prompt variants don't drift from original task objectives

**Validation Method**:
1. **Rule Preservation**: Check variants maintain critical constraints (kebab-case, line refs, JSON schema)
2. **Output Consistency**: Run same input through original + variants, compare outputs
3. **Accuracy Testing**: Measure accuracy on test set (20 examples per skill)

**Tasks**:
1. Create test sets:
   - Code linting: 20 files with known violations
   - File naming: 20 images with expected filenames
   - Markdown: 20 document diffs with known changes
   - Audio: 20 transcriptions with expected actions
2. Run all variants through test sets
3. Calculate accuracy: % of outputs matching expected
4. Filter variants: Keep only those with ≥90% accuracy

**Deliverables**:
- Test sets for all 4 skills
- Accuracy report per variant
- Filtered variant set (top performers only)

**Success Criteria**:
- ≥50% of variants achieve ≥90% accuracy
- Top 3 variants per skill identified
- No task objective drift detected

---

## References

### Prompt Libraries

1. [Anthropic Prompt Library](https://docs.anthropic.com/en/prompt-library/library) - Official library with code consultant, Python bug buster
2. [OpenAI Cookbook - Structured Outputs](https://cookbook.openai.com/examples/structured_outputs_intro) - JSON Schema for deterministic output
3. [Awesome ChatGPT Prompts](https://github.com/f/awesome-chatgpt-prompts) - Community-curated prompts
4. [GitHub: instructa/ai-prompts](https://github.com/instructa/ai-prompts) - Curated prompts for Cursor, Cline, GitHub Copilot

### Production AI Tools

5. [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) - Subjective code reviews beyond linting
6. [Cursor vs GitHub Copilot](https://www.builder.io/blog/cursor-vs-github-copilot) - Production-ready AI coding tools
7. [GitHub Copilot Instructions](https://github.com/features/copilot) - Custom prompt patterns via `.github/copilot-instructions.md`

### Academic Research

8. [Chain of Thought Prompting for LLMs](https://cameronrwolfe.substack.com/p/chain-of-thought-prompting-for-llms) - Intermediate reasoning steps
9. [Decomposed Prompting](https://arxiv.org/abs/2210.02406) - Modular approach for complex tasks
10. [SmolLM2 Research](https://arxiv.org/html/2502.02737v1) - 8K token limits, data-centric training
11. [Constitutional AI](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) - Rule-based AI behavior steering

### Few-Shot vs Zero-Shot

12. [Few-shot prompting to improve tool-calling](https://blog.langchain.com/few-shot-prompting-to-improve-tool-calling-performance/) - 11% → 75% accuracy with 3 examples
13. [Zero-shot vs Few-shot Prompting](https://www.analyticsvidhya.com/blog/2023/09/power-of-llms-zero-shot-and-few-shot-prompting/) - 10% accuracy improvement
14. [Zero-Shot vs Few-Shot Benchmarks](https://www.deepdivelabs.tech/blog-ddl/zero-shot-vs-few-shot-promptnbspa-comparison-amp-analysis-on-the-boolq-dataset) - BoolQ dataset F1 scores

### Structured Output

15. [How JSON Schema Works for LLMs](https://blog.promptlayer.com/how-json-schema-works-for-structured-outputs-and-tool-integration/) - Deterministic JSON generation
16. [Structured Output Generation in LLMs](https://medium.com/@emrekaratas-ai/structured-output-generation-in-llms-json-schema-and-grammar-based-decoding-6a5c58b698a6) - Grammar-based decoding
17. [OpenAI Structured Outputs Evaluation](https://cookbook.openai.com/examples/evaluation/use-cases/structured-outputs-evaluation) - Evals framework

### Task Decomposition

18. [Advanced Decomposition Techniques](https://learnprompting.org/docs/advanced/decomposition/introduction) - Breaking complex tasks
19. [Task Decomposition Prompts](https://github.com/NirDiamant/Prompt_Engineering/blob/main/all_prompt_engineering_techniques/task-decomposition-prompts.ipynb) - Jupyter notebook examples
20. [4 Prompting Techniques for Multi-Step Problems](https://www.marktechpost.com/2023/05/18/4-prompting-techniques-for-solving-difficult-and-multi-step-problems-with-llms/) - CoT, self-consistency, ART

### Vision-Language Models

21. [Vision Language Models Explained](https://huggingface.co/blog/vlms) - VLM architectures and capabilities
22. [Vision-Language Models Guide](https://encord.com/blog/vision-language-models-guide/) - Image captioning, semantic extraction
23. [Prompt Engineering for Vision Models](https://www.deeplearning.ai/short-courses/prompt-engineering-for-vision-models/) - DeepLearning.AI course
24. [NVIDIA VLM Prompt Engineering Guide](https://developer.nvidia.com/blog/vision-language-model-prompt-engineering-guide-for-image-and-video-understanding/) - Spatial vs semantic prompts

### Markdown Summarization

25. [Summarization with LangChain](https://medium.com/@abonia/summarization-with-langchain-b3d83c030889) - Stuff, Map-reduce, Refine techniques
26. [LangChain Summarization Tutorial](https://python.langchain.com/docs/tutorials/summarization/) - Official docs
27. [Summarization Best Practices](https://blog.promptlayer.com/prompt-engineering-guide-to-summarization/) - Extractive vs abstractive
28. [Google Cloud Document Summarization](https://cloud.google.com/blog/products/ai-machine-learning/long-document-summarization-with-workflows-and-gemini-models/) - Map-reduce, iterative refinement

### Audio/Intent Extraction

29. [Intent and Entity Recognition](https://medium.com/walmartglobaltech/joint-intent-classification-and-entity-recognition-for-conversational-commerce-35bf69195176) - Joint classification
30. [How Intent Recognizers Work](https://datascience.stackexchange.com/questions/11043/how-do-intent-recognisers-work) - Sample utterances
31. [Rhasspy Intent Recognition](https://rhasspy.readthedocs.io/en/latest/intent-recognition/) - Pattern matching
32. [17 Prompts for Building AI Apps](https://www.voiceflow.com/pathways/prompts-for-building-ai-apps) - Voiceflow examples

### Prompt Engineering Anti-Patterns

33. [Common Mistakes in Prompt Engineering](https://futureskillsacademy.com/blog/common-prompt-engineering-mistakes/) - Vagueness, lack of context
34. [7 Prompt Engineering Mistakes](https://www.promptjesus.com/blog/7-prompt-engineering-mistakes-beginners-must-avoid) - No role assignment, one-shot thinking
35. [14 Prompt Engineering Mistakes](https://odsc.medium.com/beyond-prompt-and-pray-14-prompt-engineering-mistakes-youre-probably-still-making-c2c3a32711bc) - Over-complication, wrong techniques

### LLM Evaluation

36. [Understanding 4 Main Approaches to LLM Evaluation](https://magazine.sebastianraschka.com/p/llm-evaluation-4-approaches) - Rule-based, LLM-as-judge
37. [LLM-as-a-Judge Guide](https://www.evidentlyai.com/llm-guide/llm-as-a-judge) - Combining methods
38. [LLM Evaluation Guide](https://www.comet.com/site/blog/llm-evaluation-guide/) - Metrics, methods, best practices

### Prompt Optimization

39. [Automatic Prompt Optimization](https://cameronrwolfe.substack.com/p/automatic-prompt-optimization) - Evolutionary algorithms
40. [EvoPrompt](https://artgor.medium.com/paper-review-connecting-large-language-models-with-evolutionary-algorithms-yields-powerful-prompt-6181b10a464) - Mutation and crossover
41. [GAAPO](https://arxiv.org/html/2504.07157v3) - Genetic algorithm for prompt optimization
42. [Promptbreeder](https://arxiv.org/pdf/2309.16797) - Self-referential prompt evolution

### Small Language Models

43. [SmolLM Papers Explained](https://ritvik19.medium.com/papers-explained-176-smol-lm-a166d5f1facc) - 135M, 360M, 1.7B variants
44. [Prompt Compression for LLMs](https://medium.com/@sahin.samia/prompt-compression-in-large-language-models-llms-making-every-token-count-078a2d1c7e03) - Token optimization
45. [PMPO Framework](https://arxiv.org/html/2505.16307v2) - Probabilistic metric prompt optimization

### Code Quality & Constitutional AI

46. [Constitutional AI Explained](https://toloka.ai/blog/constitutional-ai-explained/) - Principles for behavior steering
47. [Custom Rules for AI Agents](https://forgecode.dev/docs/custom-rules-guide/) - Persistent coding guidelines
48. [JetBrains Coding Guidelines](https://blog.jetbrains.com/idea/2025/05/coding-guidelines-for-your-ai-agents/) - AI agent code standards

### Diff Analysis

49. [Automated Patch Diff Analysis](https://blog.syss.com/posts/automated-patch-diff-analysis-using-llms/) - Markdown-formatted diff outputs
50. [Chopdiff](https://github.com/jlevy/chopdiff) - Diff filtering for LLM apps
51. [Diffalayze](https://github.com/SySS-Research/diffalayze) - LLM-based patch diffing

---

**Document Status**: Research Complete
**Next Steps**: Implement Phase 1 (prompt templates)
**Integration**: Reference this document in `05-prompt-evolution-system.md:387` (replace placeholder examples)
