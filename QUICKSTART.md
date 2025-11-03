# 🦖 tinyArms - Quick Start Guide

Get tinyArms running when released!

**Status**: Swift migration Phase 1 - Coming Q1 2026

---

## Prerequisites

### Development (Build from Source)
- **macOS**: 14.0+ (Sequoia preferred)
- **Xcode**: 15.0+ with Command Line Tools
- **Apple Silicon**: M1+ required (Apple Neural Engine)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 5-10GB free (models + Xcode project)

### End User (When Released)
- **macOS**: 13.0+ (Ventura)
- **iOS**: 17.0+ (iPhone 12+ for Neural Engine)
- **iPadOS**: 17.0+ (iPad Pro 2020+ / Air 4+)

---

## macOS Installation (When Released)

### Option A: Download Release (Easiest)

```bash
# Download from GitHub Releases
open TinyArms-macOS-v0.2.0.dmg

# Drag to Applications
# Grant permissions:
#   - LaunchAgent (background daemon)
#   - File Access (Downloads, Desktop)
#   - Spotlight (index results)

# Menu bar icon appears 🦖 → Ready!
```

### Option B: Build from Source

```bash
# Clone repository
git clone https://github.com/nqh/tinyArms
cd tinyArms/apps/tinyArms

# Open in Xcode
open TinyArms.xcodeproj

# Build & Run (Cmd+R)
# Grant permissions when prompted

# Menu bar icon appears 🦖
```

**First Launch**:
1. Menu bar icon 🦖 appears
2. Click → "Download Models" (2-4GB)
   - macOS: Qwen2.5-Coder-3B via Ollama (1.9GB)
   - OR: MLX Swift models (2-3GB)
3. Grant file access: Downloads, Desktop, `.specify/memory/`
4. Ready!

---

## iOS/iPadOS Installation (When in Beta)

### TestFlight Beta (Q2 2026)

```
1. Install TestFlight from App Store
2. Scan QR code (beta invite from GitHub)
3. Install tinyArms
4. Grant permissions:
   - Photos (for screenshot renaming)
   - Files (for document access)
   - Shortcuts (for Siri integration)
```

### First Use on iOS

```
1. Take screenshot (or select existing photo)
2. Tap Share button
3. Select "tinyArms" from Share Sheet
4. Choose skill:
   - visual-intelligence (rename screenshot)
   - privacy-redaction (blur PII)
   - writing-tools (grammar check)
5. Result appears → Tap "Apply"
```

**Models download on first use** (500MB-1GB):
- SmolLM2-360M (250MB, general tasks)
- MobileBERT (100MB, embeddings)
- CLIP ViT-B/32 (340MB, image understanding)

---

## First Steps (macOS)

### 1. Test Status

```bash
# Check daemon status
tinyarms-cli status

# Should show:
# Daemon: ● Running
# Models: Qwen2.5-Coder-3B (loaded)
# Memory: 2.1GB / 16GB
# Skills: code-linting (enabled)
```

### 2. Run First Skill

```bash
# Lint code against constitution
tinyarms-cli lint src/auth.ts

# Output:
# ❌ auth.ts:12 - Hardcoded color #3B82F6
#    Use semantic token: bg-primary
#
# ❌ auth.ts:45 - Magic number 3600
#    Extract to constant: SESSION_TIMEOUT_SECONDS
#
# ✅ 2 violations detected (2.3s)
```

### 3. Enable Automation

```bash
# macOS menu bar:
# Click 🦖 → Preferences → Automation

# Enable:
# ✓ Watch Downloads folder (rename screenshots)
# ✓ Watch ~/Desktop (rename files)
# ✓ Pre-commit hooks (code linting)
# ✓ Track .specify/memory/ (documentation changes)
```

---

## Configuration (macOS)

### Via Menu Bar

```
Click 🦖 → Preferences

General:
  ✓ Launch at login
  ✓ Show menu bar icon
  Model: Qwen2.5-Coder-3B (Ollama)

Automation:
  ✓ Watch Downloads (every 5 minutes)
  ✓ Watch Desktop
  ✓ Pre-commit hooks
  ✓ Track documentation (~/.specify/memory/)

Skills:
  ✓ code-linting (enabled)
  ⬜ visual-intelligence (iOS only)
  ⬜ privacy-redaction (Phase 2)
  ⬜ writing-tools (Phase 2)
```

### Via Config File

```bash
# Edit config
open ~/Library/Application\ Support/tinyArms/config.plist

# Or use CLI (when implemented)
tinyarms-cli config set skills.code-linting.enabled true
```

**Example config** (Property List):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>LaunchAtLogin</key>
    <true/>

    <key>ModelBackend</key>
    <string>ollama</string>

    <key>Skills</key>
    <dict>
        <key>code-linting</key>
        <dict>
            <key>Enabled</key>
            <true/>
            <key>Model</key>
            <string>qwen2.5-coder:3b</string>
            <key>ConstitutionPath</key>
            <string>~/.specify/memory/constitution.md</string>
        </dict>
    </dict>

    <key>WatchPaths</key>
    <array>
        <string>~/Downloads</string>
        <string>~/Desktop</string>
    </array>
</dict>
</plist>
```

---

## iOS/iPadOS Configuration

### Share Extension Setup

```
1. Open Settings → tinyArms
2. Enable:
   ✓ Share Extension
   ✓ Shortcuts
   ✓ Widgets
3. Choose default skill:
   • visual-intelligence (recommended)
   • privacy-redaction
   • writing-tools
```

### Shortcuts (Siri)

```
1. Open Shortcuts app
2. Create new shortcut:
   - Add Action: "Run tinyArms Skill"
   - Choose skill: visual-intelligence
   - Input: Last Screenshot
3. Name: "Rename Screenshot"
4. Add to Siri: "Hey Siri, rename screenshot"
```

---

## CloudKit Sync (Phase 4)

**Cross-device results**:

```
macOS:
  Rename file: Screenshot.png → hero-mockup.png
  ↓
CloudKit syncs result
  ↓
iOS:
  Spotlight search: "hero mockup"
  → Result appears (tinyArms renamed it on Mac)
  → Tap to open in Photos
```

**Setup**:
```
1. Sign in with same Apple ID (macOS + iOS)
2. Enable iCloud sync in Preferences
3. Results sync automatically (5-10s latency)
```

---

## Common Tasks

### Lint Code Before Commit (macOS)

```bash
# Manual
tinyarms-cli lint src/

# Or enable pre-commit hook
# (automatic via Preferences → Automation)
```

### Rename Screenshots (iOS)

```
1. Take screenshot
2. Share → tinyArms
3. Tap suggested name → Apply
```

### Batch Rename Files (iPadOS)

```
1. Open Files app
2. Select multiple screenshots
3. Drag & Drop onto tinyArms (Split View)
4. Review suggestions → Apply All
```

### Search Past Results (macOS)

```bash
# Spotlight search
Cmd+Space → "tinyarms hero mockup"
→ Results show: hero-mockup-mobile.png (renamed 2 days ago)
```

---

## Troubleshooting

### macOS Daemon Not Running

```bash
# Check status
tinyarms-cli status

# Restart daemon
launchctl kickstart gui/$UID/com.tinyarms.daemon

# View logs
cat ~/Library/Logs/tinyArms/daemon.log
```

### Models Not Downloaded

```
Menu bar 🦖 → Download Models
→ Select: Qwen2.5-Coder-3B (1.9GB)
→ Wait 2-5 minutes (depends on internet)
```

### iOS Share Extension Not Appearing

```
1. Settings → tinyArms → Reset Share Extension
2. Reboot iPhone
3. Test: Screenshot → Share → Should see tinyArms
```

### CloudKit Sync Not Working

```
1. Settings → Apple ID → iCloud → tinyArms
2. Toggle OFF → Toggle ON
3. Wait 30 seconds
4. Test: Rename file on Mac → Check iOS Spotlight
```

---

## Performance Tips

### macOS

```
Preferences → Performance:
  ✓ Run only when plugged in (saves battery)
  ✓ Limit memory to 4GB (for 8GB Macs)
  ⬜ Use smaller models (SmolLM2 vs Qwen - less accurate)
```

### iOS

```
Settings → tinyArms → Performance:
  ✓ Download models on WiFi only
  ✓ Use Low Power Mode compatible inference
  ⬜ Sync results immediately (vs batched)
```

---

## Next Steps

### For Developers

1. **Read architecture docs**
   - [docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md](docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md)
   - [docs/02-MACOS-DAEMON.md](docs/02-MACOS-DAEMON.md)

2. **Contribute**
   - See [CONTRIBUTING.md](CONTRIBUTING.md) for Swift dev setup
   - Issues: https://github.com/nqh/tinyArms/issues

### For End Users

1. **Enable more skills** (when Phase 2 released)
   - visual-intelligence (screenshot OCR)
   - privacy-redaction (auto-blur PII)
   - writing-tools (grammar, tone)

2. **Customize automation**
   - Add watch folders
   - Adjust schedules
   - Configure notifications

3. **Explore Shortcuts** (iOS)
   - Create custom workflows
   - Voice commands via Siri
   - Automate daily tasks

---

## Cost Comparison

| Service | Cost | Privacy | Platforms |
|---------|------|---------|-----------|
| **tinyArms** | **$0/month** | ✅ 100% on-device | macOS, iOS, iPadOS |
| GitHub Copilot | $10/month | ❌ Cloud | VS Code, IDEs |
| Claude Pro | $20/month | ❌ Cloud | Web, API |
| ChatGPT Plus | $20/month | ❌ Cloud | Web, iOS |

**tinyArms savings**: $120-240/year

---

## Getting Help

```bash
# CLI help
tinyarms-cli --help
tinyarms-cli lint --help

# View docs
open docs/

# GitHub issues
open https://github.com/nqh/tinyArms/issues
```

---

## That's It!

When released, tinyArms will:

- ✅ Run on macOS menu bar (always available)
- ✅ Work on iOS via Share Sheet (rename screenshots instantly)
- ✅ Sync results via CloudKit (search from any device)
- ✅ Lint code against YOUR constitution (pre-commit hooks)
- ✅ 100% on-device (privacy-first, zero API costs)

All with tiny models, on your devices, learning from YOU! 🦖

---

**Timeline**:
- Phase 1 (Q1 2026): macOS daemon
- Phase 2 (Q2 2026): iOS beta (TestFlight)
- Phase 3 (Q3 2026): iPadOS + advanced features
- Phase 4 (Q4 2026): App Store release

⭐ **Star the repo** to follow development: https://github.com/nqh/tinyArms
