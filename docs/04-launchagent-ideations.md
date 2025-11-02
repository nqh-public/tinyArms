# 🦖 TinyArms LaunchAgent Ideations

## Overview

Use macOS LaunchAgents for intelligent, battery-efficient task scheduling. Better than cron for TinyArms because:

✓ Native macOS integration
✓ Conditional execution (AC power, idle time, etc.)
✓ Automatic restart on failure
✓ Better logging and error handling
✓ Can watch file paths directly

---

## LaunchAgent vs Cron Comparison

| Feature | LaunchAgent | Cron |
|---------|------------|------|
| Platform | macOS only | Universal Unix |
| Power awareness | ✓ Built-in | ✗ None |
| File watching | ✓ Native | ✗ Manual polling |
| Environment | ✓ Full user env | ⚠️ Limited PATH |
| Logging | ✓ stdout/stderr | ⚠️ Manual setup |
| Restart on crash | ✓ Automatic | ✗ None |
| User context | ✓ Runs as user | ⚠️ May run as root |

**Verdict:** LaunchAgent is superior for TinyArms on macOS.

---

## Core LaunchAgent Patterns

### Pattern 1: Time-Based Scheduling

Run skill every N hours/minutes/days.

```xml
<!-- com.tinyarms.file-naming.plist -->
<key>StartCalendarInterval</key>
<array>
    <!-- Run every 4 hours (0:00, 4:00, 8:00, 12:00, 16:00, 20:00) -->
    <dict><key>Hour</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>4</integer></dict>
    <dict><key>Hour</key><integer>8</integer></dict>
    <dict><key>Hour</key><integer>12</integer></dict>
    <dict><key>Hour</key><integer>16</integer></dict>
    <dict><key>Hour</key><integer>20</integer></dict>
</array>

<!-- Alternative: Interval (every 14400 seconds = 4 hours) -->
<key>StartInterval</key>
<integer>14400</integer>
```

**Use for:** file-naming, markdown-analysis

### Pattern 2: File Path Watching

Run when files appear in specific directories.

```xml
<key>WatchPaths</key>
<array>
    <string>~/Downloads</string>
    <string>~/Desktop</string>
</array>

<!-- Debounce: Wait 5 seconds before triggering -->
<key>ThrottleInterval</key>
<integer>5</integer>
```

**Use for:** Instant file naming when screenshots appear

### Pattern 3: Power-Aware Execution

Only run when plugged into AC power (save battery).

```xml
<key>StartOnlyIfPowerSourceIsAC</key>
<true/>
```

**Use for:** Heavy tasks (code linting with Qwen 7B)

### Pattern 4: Idle Detection

Run when Mac has been idle for N seconds.

```xml
<!-- Run after 5 minutes of idle time -->
<key>StartOnlyWhileIdle</key>
<true/>
<key>IdleTime</key>
<integer>300</integer>
```

**Use for:** Background analysis tasks

### Pattern 5: On-Demand (No auto-start)

Agent is loaded but never runs automatically. Only triggered manually or by other services.

```xml
<key>RunAtLoad</key>
<false/>

<!-- No schedule, no watch paths -->
```

**Use for:** code-linting (manual/MCP only)

---

## TinyArms LaunchAgent Design

### Agent 1: File Naming (Hybrid: 4h schedule + file watch)

**Key Settings**:
- `StartInterval`: 14400 (every 4 hours)
- `WatchPaths`: ~/Downloads, ~/Desktop
- `ThrottleInterval`: 10s (debounce bulk downloads)
- `StartOnlyIfPowerSourceIsAC`: true (scheduled runs only, file watch works on battery)

**Full 73-line XML deleted** (lines 122-194). See core LaunchAgent pattern above.

---

### Agent 2: Markdown Analysis (Scheduled, power-aware)

**Key Settings**:
- `StartInterval`: 7200 (every 2 hours)
- `StartOnlyIfPowerSourceIsAC`: true
- `StartOnlyWhileIdle`: true + `IdleTime`: 120s

**Unique keys only** (reference Agent 1 for common keys like `ProgramArguments`, `StandardOutPath`)

---

### Agent 3: Code Linting (On-Demand)

**Key Settings**:
- `RunAtLoad`: false
- No `StartInterval`, no `WatchPaths`
- Trigger: `launchctl kickstart gui/$UID/com.tinyarms.code-linting`

---

## Installation Strategy

### Option 1: Scripted Install (Recommended)

```bash
#!/bin/bash
# scripts/install-launchagents.sh

PLIST_DIR="$HOME/Library/LaunchAgents"
CONFIG_DIR="$HOME/.config/tinyarms"

echo "🦖 Installing TinyArms LaunchAgents..."

# Create log directory
mkdir -p "$CONFIG_DIR/logs"

# Install each agent
for agent in file-naming markdown-analysis; do
    plist="com.tinyarms.$agent.plist"
    
    # Generate plist from template
    sed "s|HOME|$HOME|g" "config/launchagents/$plist" > "$PLIST_DIR/$plist"
    
    # Load agent
    launchctl load "$PLIST_DIR/$plist"
    
    echo "✓ Installed $agent"
done

echo "✓ LaunchAgents installed and loaded"
launchctl list | grep com.tinyarms
```

### Option 2: SwiftUI App Install

When user enables a skill in Settings:

```swift
func enableSkill(_ skill: String) {
    // 1. Generate plist
    let plist = generatePlist(for: skill)
    
    // 2. Write to LaunchAgents
    let plistPath = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/LaunchAgents/com.tinyarms.\(skill).plist")
    
    try? plist.write(to: plistPath, atomically: true, encoding: .utf8)
    
    // 3. Load agent
    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/bin/launchctl")
    task.arguments = ["load", plistPath.path]
    try? task.run()
}
```

---

## Management Commands

### Load Agent
```bash
launchctl load ~/Library/LaunchAgents/com.tinyarms.file-naming.plist
```

### Unload Agent
```bash
launchctl unload ~/Library/LaunchAgents/com.tinyarms.file-naming.plist
```

### Start Agent Immediately
```bash
launchctl kickstart gui/$UID/com.tinyarms.file-naming
```

### Stop Agent
```bash
launchctl kill SIGTERM gui/$UID/com.tinyarms.file-naming
```

### View Agent Status
```bash
launchctl list | grep com.tinyarms
```

### View Logs
```bash
tail -f ~/.config/tinyarms/logs/file-naming.log
```

### Debug Agent
```bash
# Print why agent isn't running
launchctl print gui/$UID/com.tinyarms.file-naming
```

---

## Advanced Patterns (Deleted - See Apple Docs)

**Patterns 6-8 removed** (Network monitoring, Calendar integration, Resource-aware execution)

**Note**: These are generic LaunchAgent features, not tinyArms-specific. See Apple's LaunchAgent documentation for full reference.

---

## Battery Impact Analysis

### Scenario 1: Minimal Schedule (Default)

```
file-naming:     every 4 hours (6x/day)
markdown-analysis: every 2 hours (12x/day) but only when plugged in + idle

Estimated battery impact:
- file-naming: 6 runs × 3s × 5% CPU = ~1% battery/day
- markdown-analysis: Only on AC, 0% battery

Total: ~1% battery/day
```

### Scenario 2: Aggressive Schedule

```
file-naming:     every 1 hour (24x/day)
markdown-analysis: every 30 min (48x/day) even on battery

Estimated battery impact:
- file-naming: 24 runs × 3s × 5% CPU = ~4% battery/day
- markdown-analysis: 48 runs × 2s × 5% CPU = ~5% battery/day

Total: ~9% battery/day
```

### Scenario 3: File Watching Only

```
file-naming: Triggered by new files in Downloads/Desktop
markdown-analysis: Disabled

Estimated battery impact:
- Depends on file activity
- 10 files/day × 3s × 5% CPU = ~0.5% battery/day

Total: ~0.5% battery/day (best for battery)
```

**Recommendation:** Use Pattern 1 (hybrid) for file-naming, scheduled for markdown-analysis.

---

## Error Handling (tinyArms-Specific)

**Keep only tinyArms-specific error cases** (Ollama down, model missing, disk full):

1. **Ollama not running**: CLI checks status → exit(1) → LaunchAgent retries (KeepAlive + ThrottleInterval 60s)
2. **Model unavailable**: CLI sends notification → exit(0) clean (no retry loop)
3. **Disk full**: Log rotation via separate agent (delete logs >7 days old)

**Generic LaunchAgent patterns removed** (reference Apple documentation instead)

---

## Testing Strategy

### Test 1: Does Agent Load?

```bash
launchctl load com.tinyarms.file-naming.plist
launchctl list | grep com.tinyarms.file-naming

# Should show: PID, status, label
```

### Test 2: Does Schedule Work?

```bash
# Trigger manually
launchctl kickstart gui/$UID/com.tinyarms.file-naming

# Check logs
tail ~/.config/tinyarms/logs/file-naming.log
```

### Test 3: Does File Watching Work?

```bash
# Create test file
touch ~/Downloads/test-screenshot.png

# Wait 10 seconds (ThrottleInterval)
sleep 11

# Check if agent ran
tail ~/.config/tinyarms/logs/file-naming.log
```

### Test 4: Power Awareness

```bash
# Unplug Mac, wait for scheduled run time
# Agent should NOT run (StartOnlyIfPowerSourceIsAC)

# Plug in, trigger again
launchctl kickstart gui/$UID/com.tinyarms.file-naming
# Should run now
```

---

## Debugging Common Issues

### Issue: Agent loads but never runs

**Diagnose:**
```bash
launchctl print gui/$UID/com.tinyarms.file-naming
```

Look for:
- `state = waiting` (good, waiting for trigger)
- `last exit code = <non-zero>` (check logs for error)
- `throttled` (hit ThrottleInterval limit)

**Fix:** Check logs, fix CLI errors

### Issue: Agent runs too often

**Diagnose:**
```bash
# Count runs in last hour
grep "$(date '+%Y-%m-%d %H')" ~/.config/tinyarms/logs/file-naming.log | wc -l
```

**Fix:** Increase ThrottleInterval

### Issue: Agent not respecting power settings

**Diagnose:**
```bash
# Check if key exists
plutil -p ~/Library/LaunchAgents/com.tinyarms.file-naming.plist | grep AC
```

**Fix:** Add `StartOnlyIfPowerSourceIsAC` key

---

## Migration from Cron

If you had cron jobs before:

```bash
# 1. List current cron jobs
crontab -l > /tmp/old-cron.txt

# 2. Convert to LaunchAgents
# For each cron schedule, create equivalent plist

# 3. Remove cron jobs
crontab -r

# 4. Verify LaunchAgents work
launchctl list | grep com.tinyarms
```

**Cron to LaunchAgent conversion:**

| Cron | LaunchAgent |
|------|-------------|
| `0 */4 * * *` | `<key>StartInterval</key><integer>14400</integer>` |
| `*/30 * * * *` | `<key>StartInterval</key><integer>1800</integer>` |
| `0 9 * * 1-5` | `StartCalendarInterval` with Weekday 1-5, Hour 9 |

---

## Security Considerations

### 1. Permissions

LaunchAgents run as the user, so they have:
- Full access to user's files
- Network access
- Keychain access (if needed)

**Mitigation:** TinyArms only accesses configured directories.

### 2. Injection Attacks

If plist paths come from user input:

```bash
# Bad: User could inject malicious path
<string>$USER_INPUT</string>

# Good: Validate and sanitize
<string>~/Downloads</string>
```

### 3. Log Files

Logs may contain sensitive info (file paths, content snippets).

**Mitigation:**
- Store logs in user-only directory (chmod 700)
- Rotate and delete old logs
- Don't log file contents, only metadata

---

## Future Ideas (Moved to ROADMAP.md)

**3 ideas removed**:
1. Adaptive scheduling (learn user active hours)
2. Contextual triggers (macOS Focus API integration)
3. Dependency chains (one agent triggers another)

**Note**: See ROADMAP.md (future) for these Phase 2+ enhancements

---

## Conclusion

**LaunchAgents make TinyArms a true macOS citizen.**

Benefits:
- ✓ Runs in background without draining battery
- ✓ Respects system state (power, idle, focus)
- ✓ Automatic recovery from failures
- ✓ Native logging and monitoring

**Recommended Setup:**
1. `file-naming`: Hybrid (scheduled + file watching)
2. `markdown-analysis`: Scheduled (power-aware)
3. `code-linting`: On-demand (MCP/CLI only)

This gives you automation without hassle, and respects your Mac's battery life! 🦖
