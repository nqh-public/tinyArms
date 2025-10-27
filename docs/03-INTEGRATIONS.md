# 03 - Integrations

**MacWhisper, jan-nano-4b, Claude Code, and other tool integrations**

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

**Purpose**: Claude Code calls tinyArms tools via MCP

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

### Available Tools

- **lint_code**: Constitutional code review
- **rename_file**: Intelligent file naming
- **analyze_changes**: Markdown change detection
- **extract_keywords**: Text processing
- **query_system**: System state queries
- **research_with_mcp**: Delegate to jan-nano-4b (if installed)

### Usage Example

\`\`\`
User: "Lint all TypeScript files against our constitution"

Claude Code:
1. Calls lint_code tool for each .ts file
2. Aggregates violations
3. Shows user results with file:line references
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
