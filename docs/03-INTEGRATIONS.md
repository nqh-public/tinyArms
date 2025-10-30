# 03 - Integrations

**MacWhisper, jan-nano-4b, Claude Code, MCP, LaunchAgent, and other tool integrations**

---

## Level 0 Rules Engine

**Purpose**: Instant responses for pattern-matching tasks (<1ms)
**Target**: Handle 60-75% of tasks here

**See 01-ARCHITECTURE.md:87-105** for deterministic rules implementation details (examples, when to use rules vs AI, performance characteristics)

---

## MacWhisper Integration

**Approach**: Manual export (free, test workflow first)
**Cost**: $0 (works with free MacWhisper)
**Automation**: Semi-manual (you export, tinyArms processes)

**Workflow**: Record audio → MacWhisper transcribe → Export as .txt to `~/Documents/Transcriptions/` → tinyArms detects file → Gemma 3 4B suggests actions → macOS/iOS notification

**Setup**: Create folder (`mkdir -p ~/Documents/Transcriptions`), configure audio-actions skill, test with sample transcription

**Full guide**: See archive/MACWHISPER-INTEGRATION.md for complete setup, example outputs, and troubleshooting

---

## jan-nano-4b Integration (Optional)

**Purpose**: MCP-powered research agent for Claude Code (delegate multi-source research to preserve Claude Code context)
**Advantage**: 83.2% SimpleQA accuracy vs 59.2% Qwen3-4B (+24pts), 128K context, native MCP training

**Full guide**: See 03-jan-nano-4b-research-agent.md for complete use cases, benchmarks, and implementation roadmap

---

## Claude Code MCP Integration

**Status**: ⚠️ 0% IMPLEMENTED (design validated against 10+ production MCP servers)
**Purpose**: Claude Code/Aider/Cursor call tinyArms tools via MCP

**Available tools**: `rename_file`, `lint_code`, `fix_lint_issues`, `analyze_changes`, `extract_keywords`, `get_system_status`, `run_precommit_checks` (naming pattern: `[action]_[noun]`, validated against production MCP servers)

**Full guide**: See 04-mcp-server-ideations.md for setup, tool specifications, and integration examples

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

**Features**: Time-based triggers, file watching, power-aware (AC only for Level 3), idle detection, auto-restart on crash only

**Key findings**: Implement idle detection in code (IOHIDSystem API), power checks via `pmset -g ps`, use ProcessType=Background for efficiency cores, KeepAlive with Crashed=true only

**Full guide**: See 04-launchagent-ideations.md for complete LaunchAgent XML examples, idle/power detection scripts, and production patterns

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
