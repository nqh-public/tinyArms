# 02 - Configuration

**Complete configuration guide with examples**

---

## Configuration Files

### User Configuration (config.yaml)

**Location**: `~/.config/tinyarms/config.yaml`
**Purpose**: Runtime behavior, skill settings, model selection

### Constants Configuration

**Developer reference**: See apps/tinyArms/config/constants.yaml for centralized constants with source documentation.

---

## User Configuration (config.yaml)

**Location**: `~/.config/tinyarms/config.yaml`

---

## Minimal Config (Core Only)

\`\`\`yaml
models:
  level1: embeddinggemma:300m
  level2-code: qwen2.5-coder:3b

skills:
  code-linting-fast:
    enabled: true
    model: level2-code
    constitution_path: ~/.specify/memory/constitution.md
    priority: 2

system:
  ollama_host: http://localhost:11434
\`\`\`

**Storage:** 2.1GB  
**Features:** Fast code linting only

---

## Balanced Config (Recommended)

\`\`\`yaml
models:
  level1: embeddinggemma:300m           # 200MB
  level2-code: qwen2.5-coder:3b         # 1.9GB
  level2-specialist: gemma3-4b          # 2.3GB (reused)

skills:
  # Fast code linting (pre-commit)
  code-linting-fast:
    enabled: true
    model: level2-code
    constitution_path: ~/.specify/memory/constitution.md
    priority: 2
    rules:
      - hardcoded-colors
      - magic-numbers
      - file-size
      - line-references
      - import-aliases

  # File naming
  file-naming:
    enabled: true
    model: level2-specialist
    schedule: "*/5 * * * *"  # Every 5 minutes
    watch_paths:
      - ~/Downloads/
      - ~/Desktop/

  # Markdown analysis
  markdown-analysis:
    enabled: true
    model: level2-specialist
    schedule: "0 */2 * * *"  # Every 2 hours
    watch_paths:
      - ~/.specify/memory/

  # Voice actions
  audio-actions:
    enabled: true
    model: level2-specialist
    watch_paths:
      - ~/Documents/Transcriptions/
    extensions: [".txt"]
    debounce: 5
    action_mode: suggest

system:
  ollama_host: http://localhost:11434
  max_memory_mb: 12000
  require_ac_power: false
\`\`\`

**Storage:** 3.1GB (no duplicate Gemma)  
**Features:** All skills except deep linting

---

## Complete Config (All Models)

\`\`\`yaml
models:
  level1: embeddinggemma:300m           # 200MB
  level2-code: qwen2.5-coder:3b         # 1.9GB
  level2-general: qwen3:4b              # 2.5GB
  level2-specialist: gemma3-4b          # 2.3GB
  level3: qwen2.5-coder:7b              # 4.7GB

skills:
  # Fast code linting (pre-commit)
  code-linting-fast:
    enabled: true
    model: level2-code
    constitution_path: ~/.specify/memory/constitution.md
    priority: 2

  # Deep code linting (weekly)
  code-linting-deep:
    enabled: false  # Enable manually when needed
    model: level3
    schedule: "0 2 * * 0"  # Sunday 2am
    rules:
      - architecture-first
      - complex-dry
      - component-decomposition
    idle_only:
      min_idle_minutes: 15
      require_ac_power: true
      min_free_memory_gb: 7

  # File naming
  file-naming:
    enabled: true
    model: level2-specialist
    schedule: "*/5 * * * *"
    watch_paths:
      - ~/Downloads/
      - ~/Desktop/

  # Markdown analysis
  markdown-analysis:
    enabled: true
    model: level2-specialist
    schedule: "0 */2 * * *"
    watch_paths:
      - ~/.specify/memory/

  # Voice actions
  audio-actions:
    enabled: true
    model: level2-specialist
    watch_paths:
      - ~/Documents/Transcriptions/
    extensions: [".txt"]
    debounce: 5
    action_mode: suggest

system:
  ollama_host: http://localhost:11434
  max_memory_mb: 12000
  require_ac_power: false

notifications:
  enabled: true
  pushover:
    enabled: false
    user_key: YOUR_USER_KEY
    api_token: YOUR_API_TOKEN
\`\`\`

**Storage:** 12.6GB  
**Features:** All skills including deep analysis

---

## CLI Commands

\`\`\`bash
# View all config
tinyarms config show

# Get specific value
tinyarms config get skills.file-naming.schedule

# Update config
tinyarms config set skills.file-naming.schedule "0 */2 * * *"

# Validate config
tinyarms config validate
\`\`\`

---

## Environment Variables

\`\`\`bash
# Ollama host
export OLLAMA_HOST=http://localhost:11434

# Config path
export TINYARMS_CONFIG=~/.config/tinyarms/config.yaml

# Log level
export TINYARMS_LOG_LEVEL=debug
\`\`\`

---

## Database Schema

**See DATABASE-SCHEMA.md for complete SQLite schema** (production-validated patterns from Langfuse/Continue.dev).

---

## Storage Management

**Status**: ⚠️ Schema design validated (research from Langfuse/Continue.dev patterns)
**Purpose**: Persistent state management

### SQLite Database Location

**Path**: `~/.config/tinyarms/tinyarms.db`

### Tables

**Production-validated schema** (based on Langfuse and Continue.dev):
- `task_history` - Execution records (with INTEGER timestamps)
- `user_feedback` - Learning data
- `performance_metrics` - Speed/accuracy tracking
- `cache_entries` - Router cache with TTL
- `statistics` - Analytics

See [SQLite Database Schema section above](#sqlite-database-schema-production-validated) for complete SQL.

### Configuration Access

**YAML for humans** (`~/.config/tinyarms/config.yaml`):
```yaml
models:
  level1: embeddinggemma:300m
  level2-code: qwen2.5-coder:3b

skills:
  code-linting-fast:
    enabled: true
    model: level2-code
```

**JSON API for agents**:
```bash
# Query config programmatically
tinyarms config show --json | jq '.skills["code-linting-fast"]'
```

---

## Next Steps

1. **Test configuration**: `tinyarms config validate`
2. **Run skills**: `tinyarms run file-naming ~/Downloads --dry-run`
3. **Troubleshooting**: See [02-TROUBLESHOOTING.md](02-TROUBLESHOOTING.md)

---

**Note**: This is a reference implementation. Config structure shown is for design illustration.
