# 03 - Skills

**What each skill does**

---

## code-linting-fast

**Model**: Qwen2.5-Coder-3B-Instruct (Level 2)  
**Speed**: 2-3s per file  
**Priority**: 2 (pre-commit hooks)  
**Source**: `.specify/memory/constitution.md`

**Detects**:
- Hardcoded colors
- Magic numbers
- File size violations (>350 LOC)
- Import alias violations
- Missing line references
- Simple DRY violations

**Accuracy**: 85%

**Usage**:
\`\`\`bash
tinyarms run code-linting-fast src/ --dry-run
tinyarms run code-linting-fast src/
\`\`\`

**Config**:
\`\`\`yaml
code-linting-fast:
  enabled: true
  model: level2-code
  constitution_path: ~/.specify/memory/constitution.md
  priority: 2
\`\`\`

---

## code-linting-deep

**Model**: Qwen2.5-Coder 7B (Level 3, optional)  
**Speed**: 10-15s per file  
**Schedule**: Weekly (Sunday 2am, idle-only)  
**Source**: `.specify/memory/constitution.md`

**Detects** (vs fast):
- Architectural anti-patterns
- Complex DRY violations
- Cross-file pattern analysis
- Component decomposition issues

**Accuracy**: 95%

**Usage**:
\`\`\`yaml
code-linting-deep:
  enabled: false  # Enable manually
  model: level3
  schedule: "0 2 * * 0"
\`\`\`

---

## file-naming

**Model**: Gemma 3 4B (Level 2, optional)  
**Speed**: 2-4s per file  
**Schedule**: Batch every 5 mins

**Transforms**:
- `Screenshot 2024.png` → `hero-mockup-mobile.png`
- `IMG_1234.jpg` → `golden-gate-sunset.jpg`

**Usage**:
\`\`\`bash
tinyarms run file-naming ~/Downloads --dry-run
\`\`\`

**Config**:
\`\`\`yaml
file-naming:
  enabled: true
  model: level2-specialist
  watch_paths:
    - ~/Downloads/
    - ~/Desktop/
\`\`\`

---

## markdown-analysis

**Model**: Gemma 3 4B (Level 2, optional)  
**Speed**: 2-4s per file  
**Schedule**: Every 2 hours  
**Source**: `.specify/memory/`

**Detects**:
- Constitutional changes
- Conflicting decisions
- Documentation updates

**Usage**:
\`\`\`bash
tinyarms run markdown-analysis ~/.specify/memory/
\`\`\`

**Config**:
\`\`\`yaml
markdown-analysis:
  enabled: true
  model: level2-specialist
  watch_paths:
    - ~/.specify/memory/
\`\`\`

---

## audio-actions

**Model**: Gemma 3 4B (Level 2, optional)  
**Speed**: 3-5s per transcription  
**Source**: MacWhisper exports → `~/Documents/Transcriptions/`

**Extracts**:
- Intent: What speaker wants
- Actions: Specific tasks to do
- Priority: High/medium/low
- Context: Deadlines, people, dependencies

**Important**: SUGGEST ACTIONS (not summary)

**Usage**: Manual export from MacWhisper → tinyArms auto-processes

**Config**:
\`\`\`yaml
audio-actions:
  enabled: true
  model: level2-specialist
  watch_paths:
    - ~/Documents/Transcriptions/
  action_mode: suggest
\`\`\`

**See**: [03-INTEGRATIONS.md - MacWhisper section]

---

## Next Steps

1. **Enable skills**: `tinyarms skills enable <name>`
2. **Test skills**: `tinyarms run <skill> [paths] --dry-run`
3. **Configure**: See [02-CONFIGURATION.md](02-CONFIGURATION.md)

---

**Note**: This is a reference implementation. Skills shown are for design illustration.
