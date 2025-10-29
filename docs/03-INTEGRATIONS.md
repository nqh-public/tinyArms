# 03 - Integrations

**MacWhisper, jan-nano-4b, Claude Code, MCP, LaunchAgent, and other tool integrations**

---

## Level 0 Rules Engine

**Purpose**: Instant responses for pattern-matching tasks (<1ms)
**Target**: Handle 60-75% of tasks here
**Status**: ⚠️ Implementation needed

### Examples

**Filename formatting (kebab-case)**:
```typescript
function formatFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
// "Screenshot 2024.png" → "screenshot-2024.png" (<1ms)
```

**Keyword extraction (RAKE algorithm)**:
```typescript
function extractKeywords(text: string): string[] {
  const stopwords = ['the', 'a', 'an', 'in', 'on', 'at'];
  const words = text.toLowerCase().split(/\s+/);
  const filtered = words.filter(w => !stopwords.includes(w));
  return filtered; // <1ms
}
```

**File type detection**:
```typescript
function detectFileType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const typeMap = {
    'tsx': 'react-component',
    'ts': 'typescript',
    'md': 'markdown',
    'png': 'image',
    'jpg': 'image'
  };
  return typeMap[ext] || 'unknown'; // <1ms
}
```

### When to Use Rules

**Good candidates**:
- Pattern matching (kebab-case, camelCase transformations)
- Lookup tables (file type → category)
- Simple string operations (trim, replace, split)
- Mathematical calculations (no AI needed)

**Bad candidates**:
- Semantic understanding ("Is this a hero section?")
- Context-dependent decisions ("Does this violate DRY?")
- Natural language processing

**Full details**: See [01-ARCHITECTURE.md - Level 0 section](01-ARCHITECTURE.md#level-0-deterministic-rules)

---

## MacWhisper Integration

**Approach**: Manual export (free, test workflow first)  
**Cost**: $0 (works with free MacWhisper)  
**Automation**: Semi-manual (you export, tinyArms processes)

### How It Works

\`\`\`
You record audio
    ↓
Open MacWhisper → Transcribe
    ↓
Click Export → Save as .txt to ~/Documents/Transcriptions/
    ↓
tinyArms detects new .txt file (file watcher)
    ↓
tinyArms reads transcription
    ↓
tinyArms uses Gemma 3 4B (Level 2) to SUGGEST ACTIONS
    ↓
macOS notification + optional iOS (Pushover)
\`\`\`

### Setup

**1. Create export folder**:
\`\`\`bash
mkdir -p ~/Documents/Transcriptions
\`\`\`

**2. Configure tinyArms**:
\`\`\`yaml
skills:
  audio-actions:
    enabled: true
    model: level2-specialist  # Gemma 3 4B
    watch_paths:
      - ~/Documents/Transcriptions/
    extensions: [".txt"]
    debounce: 5
    action_mode: suggest
\`\`\`

**3. Test**:
1. Transcribe audio in MacWhisper
2. Export as .txt to `~/Documents/Transcriptions/`
3. Watch tinyArms process it: `tinyarms logs --skill audio-actions --follow`

### Example Output

**Input**: `meeting-2024-10-27.txt`
\`\`\`
"Email John about Q4 report by Friday. Book flights for conference in March."
\`\`\`

**Output** (macOS notification):
\`\`\`
🦖 tinyArms: Audio Actions

2 actions from meeting-2024-10-27.txt:
1. [HIGH] Email John about Q4 report (deadline: Friday)
2. [MED] Book conference flights

Tap to see details →
\`\`\`

### Full Guide

**See docs/archive/MACWHISPER-INTEGRATION.md for complete documentation**

---

## jan-nano-4b Integration (Optional)

**Purpose**: MCP-powered research agent for Claude Code  
**Use Case**: Delegate multi-source research to preserve Claude Code context  
**Storage**: 4.3GB (Q8) or 2.3GB (iQ4_XS)

### Why jan-nano-4b?

**vs Qwen3-4B-Instruct for research**:
- SimpleQA (with MCP): 83.2% vs 59.2% (+24pts)
- Context window: 128K vs 32K (4x)
- MCP optimization: Native RLVR training
- Tool orchestration: Autonomous vs prompt-based

### Architecture

\`\`\`
User asks Claude Code: "Research TanStack Start deployment on Railway"
  ↓
Claude Code → tinyArms MCP tool: research_with_mcp
  ↓
tinyArms Level 2 Research: jan-nano-4b
  ↓
jan-nano-4b calls MCP servers:
  - GitHub MCP (search repos, PRs)
  - Context7 MCP (official docs)
  - Web MCP (blog posts, tutorials)
  ↓
Returns synthesized findings to Claude Code
\`\`\`

### Installation

\`\`\`bash
# Recommended: Q8 (best quality)
ollama pull mannix/jan-nano:q8_0  # 4.3GB

# Alternative: iQ4_XS (faster, smaller)
ollama pull mannix/jan-nano:iq4_xs  # 2.3GB
\`\`\`

### Configuration

\`\`\`yaml
models:
  level2-research: mannix/jan-nano:q8_0

skills:
  research:
    enabled: true
    model: level2-research
    mcp_servers:
      - github
      - context7
      - filesystem
      - web-search
    max_sources: 20
    context_window: 128000
\`\`\`

### Full Guide

**See docs/archive/JAN-NANO-4B-INTEGRATION.md for complete documentation**

---

## Claude Code MCP Integration

**Status**: ⚠️ 0% IMPLEMENTED (design validated against 10+ production MCP servers)
**Purpose**: Claude Code/Aider/Cursor call tinyArms tools via MCP

### Setup

Add to `~/.config/claude-code/mcp.json`:
\`\`\`json
{
  "mcpServers": {
    "tinyarms": {
      "command": "tinyarms",
      "args": ["mcp-server"]
    }
  }
}
\`\`\`

### Available Tools (AI Agents → tinyArms)

**Naming Pattern**: `[action]_[noun]` (snake_case, verb-first)
- ✅ Validated against GitHub MCP, Filesystem MCP, PostgreSQL MCP, Context7 MCP
- ⚠️ All destructive operations support `dry_run` parameter

**Tools**:
- `rename_file` - Intelligent file naming ✅
- `lint_code` - Constitutional code review (read-only analysis) ✅
- `fix_lint_issues` - Apply constitutional fixes (with dry_run support) 🆕
- `analyze_changes` - Markdown change detection ✅
- `extract_keywords` - Text processing ✅
- `get_system_status` - System state queries (renamed from query_system) 🔄
- `run_precommit_checks` - Execute pre-commit hooks with autofix 🆕

### Usage Example

\`\`\`typescript
// Claude Code context
User: "Lint all TypeScript files against our constitution"

Claude Code:
1. Calls lint_code tool for each .ts file
2. Aggregates violations
3. Shows user the results with file:line references
\`\`\`

### tinyArms → Other MCP Servers

**Purpose**: Access external tools to enhance skills

**Integrated MCP Servers**:
- **GitHub MCP**: Fetch PR context during linting
- **Context7 MCP**: Official library docs
- **Filesystem MCP**: Read local project files
- **Figma MCP**: Design specs (future)

**Example**:
\`\`\`
Claude Code: "Lint this file"
  ↓
tinyArms (Qwen 7B) + GitHub MCP (fetch PR context)
  ↓
Returns: Constitutional violations with line refs
\`\`\`

---

## Aider Integration

\`\`\`bash
# Aider can call tinyArms CLI directly
aider --message "Use tinyarms to rename these files properly"
\`\`\`

---

## Cursor Integration

Add to `.cursor/mcp-servers.json`:
\`\`\`json
{
  "tinyarms": {
    "command": "tinyarms mcp-server"
  }
}
\`\`\`

---

## LaunchAgent Automation

**Status**: ⚠️ Design validated (research from production macOS apps)
**Purpose**: macOS-native scheduling for skills

### Features

- **Time-based triggers**: Every 2 hours, every 5 mins
- **File watching**: Instant triggers (via WatchPaths)
- **Power-aware**: AC only for Level 3 (heavy tasks)
- **Idle detection**: Don't interrupt work
- **Auto-restart**: Only on crash (prevent loops)

### Example LaunchAgent (Production-Validated)

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.tinyarms.file-naming</string>

  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/tinyarms</string>
    <string>run</string>
    <string>file-naming</string>
    <string>~/Downloads</string>
  </array>

  <!-- Scheduling -->
  <key>StartInterval</key>
  <integer>300</integer> <!-- 5 minutes -->

  <key>RunAtLoad</key>
  <true/> <!-- Run immediately on load -->

  <!-- Resource Management (Apple Silicon optimization) -->
  <key>ProcessType</key>
  <string>Background</string> <!-- Use efficiency cores -->

  <key>LowPriorityBackgroundIO</key>
  <true/> <!-- Reduce I/O priority -->

  <!-- Logging (CRITICAL for debugging) -->
  <key>StandardOutPath</key>
  <string>/Users/YOUR_USER/Library/Logs/tinyArms/stdout.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/YOUR_USER/Library/Logs/tinyArms/stderr.log</string>

  <!-- Auto-restart (only on crash) -->
  <key>KeepAlive</key>
  <dict>
    <key>Crashed</key>
    <true/>
  </dict>

  <!-- Prevent restart loops -->
  <key>ThrottleInterval</key>
  <integer>60</integer> <!-- 60 seconds minimum between restarts -->
</dict>
</plist>
\`\`\`

### Idle Detection (in shell script, NOT LaunchAgent)

\`\`\`bash
# Get idle time in seconds
IDLE_TIME=$(ioreg -c IOHIDSystem | awk '/HIDIdleTime/{print int($NF/1000000000);exit}')
IDLE_THRESHOLD=300 # 5 minutes

if [ "$IDLE_TIME" -lt "$IDLE_THRESHOLD" ]; then
  echo "User active (idle: ${IDLE_TIME}s), skipping heavy tasks"
  exit 0
fi
\`\`\`

### Power-Aware Logic (in shell script)

\`\`\`bash
# Check if on AC power
if ! pmset -g ps | grep -q "AC Power"; then
  echo "On battery power, skipping heavy tasks"
  exit 0
fi

# Use caffeinate to prevent sleep during processing
caffeinate -i ./process-tasks.sh
\`\`\`

### Idle-Only Scheduling for Deep Scans

\`\`\`yaml
skills:
  code-linting-deep:
    model: qwen2.5-coder:7b
    schedule:
      type: idle_only
      min_idle_minutes: 15        # Mac idle >15 min
      require_ac_power: true       # Only when plugged in
      min_free_memory_gb: 7        # Need 7GB free before loading
      time_window: "22:00-06:00"   # Optional: 10pm-6am only
\`\`\`

### Key Findings

- Production apps implement idle detection in code (IOHIDSystem API), not LaunchAgent
- Power-aware logic uses `pmset -g ps` for AC power checks
- Always include StandardOutPath/StandardErrorPath for debugging
- ProcessType=Background uses efficiency cores on Apple Silicon
- KeepAlive with Crashed=true only (prevents restart loops)

**Sources**: Restic scheduler, Watchman, SleepWatcher, Carbon Copy Cloner, Apple LaunchAgent docs

**Full details**: See [04-launchagent-ideations.md](04-launchagent-ideations.md)

---

## iOS Notification Sync (Pushover)

**Cost**: $5 one-time (no subscription)  
**Why**: Extends notifications to iPhone/iPad, not just macOS

### Setup

1. **Purchase Pushover app** ($5 one-time)
   - iOS: https://apps.apple.com/app/pushover/id506088175

2. **Get API credentials**:
   - Sign up: https://pushover.net/signup
   - Create application: https://pushover.net/apps/build
   - Copy: **User Key** and **API Token**

3. **Configure tinyArms**:
\`\`\`yaml
notifications:
  pushover:
    enabled: true
    user_key: YOUR_USER_KEY
    api_token: YOUR_API_TOKEN
\`\`\`

4. **Test**:
\`\`\`bash
tinyarms run file-naming ~/Downloads --notify
\`\`\`

---

## Next Steps

1. **Test integrations**: Choose one to start with
2. **MacWhisper**: Free, test workflow first
3. **Claude Code MCP**: If using Claude Code daily
4. **jan-nano-4b**: If multi-source research is frequent (2+ times/week)

---

**Note**: This is a reference implementation. Integrations shown are for design illustration.
