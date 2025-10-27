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
    <string>/Users/huy/Downloads</string>
    <string>/Users/huy/Desktop</string>
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

### Agent 1: File Naming (Every 4 Hours + Watch)

**Strategy:** Hybrid - scheduled + file watching

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tinyarms.file-naming</string>
    
    <!-- Run TinyArms CLI -->
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/tinyarms</string>
        <string>run</string>
        <string>file-naming</string>
        <string>~/Downloads</string>
        <string>~/Desktop</string>
        <string>--json</string>
    </array>
    
    <!-- Schedule: Every 4 hours -->
    <key>StartInterval</key>
    <integer>14400</integer>
    
    <!-- File watching: Instant trigger on new files -->
    <key>WatchPaths</key>
    <array>
        <string>/Users/huy/Downloads</string>
        <string>/Users/huy/Desktop</string>
    </array>
    
    <!-- Debounce: Wait 10 seconds (avoid triggering during bulk downloads) -->
    <key>ThrottleInterval</key>
    <integer>10</integer>
    
    <!-- Power: Only when plugged in (for scheduled runs) -->
    <key>StartOnlyIfPowerSourceIsAC</key>
    <true/>
    
    <!-- Don't run immediately on load -->
    <key>RunAtLoad</key>
    <false/>
    
    <!-- Logging -->
    <key>StandardOutPath</key>
    <string>/Users/huy/.config/tinyarms/logs/file-naming.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/huy/.config/tinyarms/logs/file-naming.error.log</string>
    
    <!-- Environment -->
    <key>EnvironmentVariables</key>
    <dict>
        <key>OLLAMA_HOST</key>
        <string>http://localhost:11434</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    
    <!-- Resource limits -->
    <key>SoftResourceLimits</key>
    <dict>
        <key>NumberOfFiles</key>
        <integer>1024</integer>
    </dict>
    
    <!-- Auto-restart on crash -->
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
</dict>
</plist>
```

**Behavior:**
- Runs every 4 hours (scheduled)
- Also runs when files appear in Downloads/Desktop (instant)
- Only scheduled runs require AC power
- File watch triggers work on battery too (lightweight)

### Agent 2: Markdown Analysis (Every 2 Hours)

**Strategy:** Scheduled only, power-aware

```xml
<dict>
    <key>Label</key>
    <string>com.tinyarms.markdown-analysis</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/tinyarms</string>
        <string>run</string>
        <string>markdown-analysis</string>
        <string>~/CODES/nqh/.specify/memory/</string>
        <string>--json</string>
    </array>
    
    <!-- Every 2 hours -->
    <key>StartInterval</key>
    <integer>7200</integer>
    
    <!-- Only when plugged in -->
    <key>StartOnlyIfPowerSourceIsAC</key>
    <true/>
    
    <!-- Only when idle for 2 minutes (don't interrupt work) -->
    <key>StartOnlyWhileIdle</key>
    <true/>
    <key>IdleTime</key>
    <integer>120</integer>
    
    <key>StandardOutPath</key>
    <string>/Users/huy/.config/tinyarms/logs/markdown-analysis.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/huy/.config/tinyarms/logs/markdown-analysis.error.log</string>
</dict>
```

**Behavior:**
- Runs every 2 hours
- Only when plugged in + idle for 2 minutes
- Won't interrupt active work

### Agent 3: Code Linting (On-Demand Only)

**Strategy:** No schedule, triggered by MCP/CLI only

```xml
<dict>
    <key>Label</key>
    <string>com.tinyarms.code-linting</string>
    
    <!-- This agent doesn't auto-run -->
    <key>RunAtLoad</key>
    <false/>
    
    <!-- No StartInterval, no WatchPaths -->
    
    <!-- But can be triggered via: -->
    <!-- launchctl kickstart gui/$UID/com.tinyarms.code-linting -->
</dict>
```

**Note:** This agent is just for consistency. Linting is primarily CLI/MCP driven.

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

## Advanced Patterns

### Pattern 6: Network Monitoring

Run when connected to specific WiFi networks.

```xml
<!-- Run only on home WiFi (avoid on public networks) -->
<key>StartOnlyIfUserIsLoggedIn</key>
<true/>

<!-- Note: NetworkState requires additional setup -->
<!-- Usually combined with script that checks WiFi SSID -->
```

### Pattern 7: Calendar Integration

Run at specific times on specific days.

```xml
<!-- Run Monday-Friday at 9 AM -->
<key>StartCalendarInterval</key>
<array>
    <dict>
        <key>Weekday</key>
        <integer>1</integer> <!-- Monday -->
        <key>Hour</key>
        <integer>9</integer>
    </dict>
    <dict>
        <key>Weekday</key>
        <integer>2</integer> <!-- Tuesday -->
        <key>Hour</key>
        <integer>9</integer>
    </dict>
    <!-- ... through Friday -->
</array>
```

**Use for:** Work-hours-only tasks

### Pattern 8: Resource-Aware Execution

Don't run if memory is low.

```xml
<!-- This is enforced by TinyArms CLI checking memory before execution -->
<key>ProgramArguments</key>
<array>
    <string>/usr/local/bin/tinyarms</string>
    <string>run</string>
    <string>file-naming</string>
    <string>--check-memory</string> <!-- CLI flag -->
</array>
```

Then in CLI:

```typescript
if (options.checkMemory) {
    const freeMemory = os.freemem() / 1024 / 1024 / 1024; // GB
    if (freeMemory < 4) {
        console.log('Skipping: Low memory (< 4GB free)');
        process.exit(0); // Exit cleanly, no error
    }
}
```

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

## Error Handling

### Scenario 1: Ollama Not Running

LaunchAgent runs, CLI fails because Ollama is down.

**Solution:**

```xml
<!-- Auto-restart on failure -->
<key>KeepAlive</key>
<dict>
    <key>SuccessfulExit</key>
    <false/> <!-- Don't restart on successful exit -->
    <key>Crashed</key>
    <true/>  <!-- Restart on crash -->
</dict>

<!-- Throttle restarts to avoid thrashing -->
<key>ThrottleInterval</key>
<integer>60</integer> <!-- Wait 1 minute between restarts -->
```

Plus in CLI:

```typescript
// Check Ollama before running
if (!(await checkOllamaStatus())) {
    console.error('Ollama not running. Start Ollama first.');
    process.exit(1); // Exit with error (triggers retry if configured)
}
```

### Scenario 2: Model Not Downloaded

LaunchAgent runs, but model isn't available.

**Solution:**

```bash
# In CLI, auto-download missing models
if model_not_found:
    tinyarms models pull gemma3:4b
```

Or better:

```typescript
// Gracefully skip if model unavailable
if (!(await checkModelAvailability(model))) {
    console.warn(`Model ${model} not available. Skipping task.`);
    sendNotification({
        title: 'TinyArms',
        message: `${skill} skipped: ${model} not installed`,
        actions: ['Install Model', 'Dismiss']
    });
    process.exit(0); // Clean exit
}
```

### Scenario 3: Disk Full

Can't write logs or cache.

**Solution:**

```xml
<!-- Limit log file size -->
<key>StandardOutPath</key>
<string>/Users/huy/.config/tinyarms/logs/file-naming.log</string>

<!-- Rotate logs weekly via separate LaunchAgent -->
```

Plus logrotate-like cleanup:

```bash
# com.tinyarms.log-cleanup.plist
# Runs daily, cleans logs older than 7 days
find ~/.config/tinyarms/logs -name "*.log" -mtime +7 -delete
```

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
<string>/Users/huy/Downloads</string>
```

### 3. Log Files

Logs may contain sensitive info (file paths, content snippets).

**Mitigation:**
- Store logs in user-only directory (chmod 700)
- Rotate and delete old logs
- Don't log file contents, only metadata

---

## Future Ideas

### Idea 1: Adaptive Scheduling

Learn user's active hours, schedule tasks during inactive times.

```typescript
// Analyze past activity
const activeHours = analyzeUserActivity();
// activeHours = [9, 10, 11, 14, 15, 16, 17, 18]

// Schedule tasks during inactive hours (e.g., 13:00, 19:00)
const optimalTimes = findInactiveHours(activeHours);
generatePlist(optimalTimes);
```

### Idea 2: Contextual Triggers

Run tasks based on user context.

```xml
<!-- Run file-naming when in "Focus" mode (no distractions) -->
<!-- Requires integration with macOS Focus API -->
```

### Idea 3: Dependency Chains

One agent triggers another.

```xml
<!-- After file-naming completes, run backup -->
<key>StartAfter</key>
<array>
    <string>com.tinyarms.file-naming</string>
</array>
```

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
