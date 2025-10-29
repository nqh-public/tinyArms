# 02 - Configuration

**Complete configuration guide with examples**

---

## Configuration Files

### User Configuration (config.yaml)

**Location**: `~/.config/tinyarms/config.yaml`
**Purpose**: Runtime behavior, skill settings, model selection

### Constants Configuration (constants.yaml)

**Location**: `apps/tinyArms/config/constants.yaml`
**Purpose**: Centralized constants with source documentation

All numeric values (latencies, thresholds, limits) are documented with:
- **Source**: RESEARCHED (benchmarks), ESTIMATED (extrapolation), ARBITRARY (placeholder)
- **Status**: VERIFIED, NEEDS_VALIDATION, PLACEHOLDER, REPLACE_IN_PRODUCTION
- **Testing plans**: What needs validation before production

**Examples**:
```yaml
performance:
  latency_targets_ms:
    embeddinggemma:
      value: 100
      source: "RESEARCHED - Ollama benchmarks (15-50ms actual)"
      status: "VERIFIED"

    jan_nano_4b_simple:
      value: 5500
      source: "ESTIMATED - Base 4s + 1 MCP call 1.5s"
      status: "HIGH_UNCERTAINTY"
      note: "MCP latency completely untested"

rate_limits:
  model_infer_per_minute:
    value: 60
    source: "ARBITRARY - Placeholder (~1 call/sec)"
    status: "REPLACE_IN_PRODUCTION"
    action: "Run load tests to find actual capacity"
```

**See**: `docs/research/magic-numbers-audit.md` for complete audit trail

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

## Per-Skill Configuration

### code-linting-fast

\`\`\`yaml
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
\`\`\`

### code-linting-deep

\`\`\`yaml
code-linting-deep:
  enabled: false
  model: level3
  schedule: "0 2 * * 0"
  rules:
    - architecture-first
    - complex-dry
    - component-decomposition
  idle_only:
    min_idle_minutes: 15
    require_ac_power: true
    min_free_memory_gb: 7
\`\`\`

### file-naming

\`\`\`yaml
file-naming:
  enabled: true
  model: level2-specialist
  schedule: "*/5 * * * *"
  watch_paths:
    - ~/Downloads/
    - ~/Desktop/
\`\`\`

### markdown-analysis

\`\`\`yaml
markdown-analysis:
  enabled: true
  model: level2-specialist
  schedule: "0 */2 * * *"
  watch_paths:
    - ~/.specify/memory/
\`\`\`

### audio-actions

\`\`\`yaml
audio-actions:
  enabled: true
  model: level2-specialist
  watch_paths:
    - ~/Documents/Transcriptions/
  extensions: [".txt"]
  debounce: 5
  action_mode: suggest
  prompt_template: skills/audio-actions.md
\`\`\`

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

## SQLite Database Schema (Production-Validated)

**Status**: ✅ Validated against Langfuse (PostgreSQL) and Continue.dev (SQLite) patterns

### Timestamp Convention

**Use INTEGER (Unix epoch, UTC)**, not ISO-8601 text:
- Smaller storage (8 bytes vs 19+ bytes)
- Faster queries (integer comparison vs string parsing)
- Easier math (duration = end - start)
- Conversion: `Math.floor(Date.now() / 1000)`

### Primary Key Convention

**Use INTEGER PRIMARY KEY AUTOINCREMENT** (local IDs):
- Simple, sequential, efficient
- No collision risk (unlike UUIDs)
- Suitable for single-device SQLite

### Index Strategy

**Always index**:
- Foreign keys
- Timestamps (for time-range queries)
- Status/type fields (for filtering)
- Composite: `[entity_id, timestamp]` for timeline queries

### Example Schema Updates

```sql
-- task_history (UPDATED)
CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  execution_start INTEGER NOT NULL,  -- Changed from timestamp
  execution_end INTEGER,
  duration_ms INTEGER,                -- Pre-calculated
  execution_status TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (execution_status IN ('pending', 'running', 'completed', 'error'))
);

CREATE INDEX idx_task_history_start ON task_history(execution_start);
CREATE INDEX idx_task_history_status ON task_history(execution_status);

-- cache_entries (UPDATED)
CREATE TABLE IF NOT EXISTS cache_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT NOT NULL UNIQUE,
  cache_value TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,                 -- TTL support
  hit_count INTEGER NOT NULL DEFAULT 1,
  is_valid BOOLEAN NOT NULL DEFAULT 1 -- Manual invalidation
);

CREATE INDEX idx_cache_expires ON cache_entries(expires_at);
CREATE INDEX idx_cache_last_used ON cache_entries(last_used_at);
```

**Sources**: Langfuse Prisma schema, Continue.dev SQLite patterns

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
