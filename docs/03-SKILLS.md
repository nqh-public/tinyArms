# 03 - Skills

**What each skill does**

**Full configuration examples**: See 02-CONFIGURATION.md:80-136 (balanced config)

---

## code-linting-fast

**Model**: Qwen2.5-Coder-3B | **Speed**: 2-3s | **Priority**: 2

**What it does**: Detects constitutional violations (hardcoded colors, magic numbers, file size >350 LOC, import alias violations, missing line references) for pre-commit hooks.

**Unique config**:
```yaml
constitution_path: ~/.specify/memory/constitution.md
rules: [hardcoded-colors, magic-numbers, file-size, line-references, import-aliases]
```

---

## code-linting-deep

**Model**: Qwen2.5-Coder 7B | **Speed**: 10-15s | **Schedule**: Weekly (idle-only)

**What it does**: Deep analysis for architectural anti-patterns, complex DRY violations, cross-file patterns, and component decomposition issues.

**Unique config**:
```yaml
schedule: "0 2 * * 0"  # Sunday 2am
require_idle: true
require_ac_power: true
```

---

## file-naming

**Model**: Gemma 3 4B | **Speed**: 2-4s | **Schedule**: Batch every 5 mins

**What it does**: Transforms generic filenames to descriptive names (`Screenshot 2024.png` → `hero-mockup-mobile.png`).

**Unique config**:
```yaml
watch_paths:
  - ~/Downloads/
  - ~/Desktop/
debounce: 300  # 5 minutes
```

---

## markdown-analysis

**Model**: Gemma 3 4B | **Speed**: 2-4s | **Schedule**: Every 2 hours

**What it does**: Detects constitutional changes, conflicting decisions, and documentation updates in `.specify/memory/`.

**Unique config**:
```yaml
watch_paths:
  - ~/.specify/memory/
extensions: [".md"]
```

---

## audio-actions

**Model**: Gemma 3 4B | **Speed**: 3-5s | **Source**: MacWhisper exports

**What it does**: Extracts intent, actions, priority, and context from voice transcriptions. SUGGESTS ACTIONS (not summaries).

**Unique config**:
```yaml
watch_paths:
  - ~/Documents/Transcriptions/
action_mode: suggest  # Critical: don't summarize, suggest tasks
```

**See**: 03-INTEGRATIONS.md:68-138 (MacWhisper setup)

---

## Next Steps

1. **Enable skills**: `tinyarms skills enable <name>`
2. **Test skills**: `tinyarms run <skill> [paths] --dry-run`
3. **Configure**: See [02-CONFIGURATION.md](02-CONFIGURATION.md)

---

**Note**: This is a reference implementation. Skills shown are for design illustration.
