# tinyArms v0.2.0 Usage Guide

## Status: Swift Migration (Alpha)

**Implementation**: Rewritten in Swift for Apple ecosystem
**Platforms**: macOS 13+, iOS 16+, iPadOS 16+
**Production Ready**: No (development phase)
**Last Updated**: 2025-11-02

---

## Prerequisites

### Required
1. **Xcode** 15.0 or higher
2. **Apple Silicon** (M1/M2/M3 Mac recommended)
3. **macOS** 13.0+ (development), 14.0+ (runtime daemon)
4. **Core ML models** (bundled with app or downloaded on first run)

### Installation Steps

#### 1. Clone & Build
```bash
git clone https://github.com/nqh-public/tinyArms.git
cd tinyArms
open TinyArms.xcodeproj  # Opens in Xcode
```

#### 2. Build in Xcode
- Select scheme: **TinyArmsMacOS** or **TinyArmsiOS**
- Product → Build (Cmd+B)
- Product → Run (Cmd+R)

#### 3. Grant Permissions
macOS will prompt for:
- File System Access (to watch ~/Downloads, etc.)
- Notifications (skill completion alerts)

#### 4. iOS TestFlight (Optional)
```bash
# Install TestFlight from App Store
# Scan QR code: [beta invite link]
# Install tinyArms beta
```

---

## Commands

### macOS CLI

#### Lint File
```bash
tinyarms-cli lint path/to/file.swift
```

#### Custom Constitution
```bash
tinyarms-cli lint src/auth.swift --constitution ~/my-principles.md
```

#### Concise Output
```bash
tinyarms-cli lint src/auth.swift --format concise
```

#### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.swift$')

if [ -n "$changed_files" ]; then
  for file in $changed_files; do
    echo "Linting $file..."
    tinyarms-cli lint "$file" --format concise
    if [ $? -ne 0 ]; then
      echo "❌ Constitutional violations in $file"
      exit 1
    fi
  done
fi
```

### macOS Daemon Control

#### Check Status
```bash
launchctl list | grep com.tinyarms.daemon
```

#### Restart Daemon
```bash
launchctl unload ~/Library/LaunchAgents/com.tinyarms.daemon.plist
launchctl load ~/Library/LaunchAgents/com.tinyarms.daemon.plist
```

#### View Logs
```bash
log show --predicate 'subsystem == "com.tinyarms"' --last 1h
```

### iOS Usage

1. Take screenshot → Share button
2. Select "tinyArms"
3. Choose skill (file-naming, visual-intelligence)
4. Review result → Apply/Dismiss

---

## Output Format

### JSON Output (stdout)
```json
{
  "violations": [
    {
      "rule": "architecture-first",
      "line": 5,
      "message": "Custom email validation when Swift Validator exists",
      "severity": "warning",
      "principle": "Principle III: Architecture-First Development",
      "constitutionalRef": "~/Library/Application Support/tinyArms/principles.md:5-10",
      "fix": {
        "action": "Use Swift Validator package",
        "suggestions": [
          "Add dependency: .package(url: \"https://github.com/SwiftValidatorCommunity/Validator\")",
          "import Validator; email.validate(rule: .email)"
        ]
      }
    }
  ],
  "summary": "Found 1 violation",
  "confidence": 0.85,
  "model": "MLX-Community/Qwen2.5-Coder-3B-Instruct",
  "latencyMs": 1840,
  "platform": "macOS",
  "format": "detailed"
}
```

### Exit Codes
- **0**: No violations (clean)
- **1**: Violations found OR error

---

## Resource Usage

### Memory Profile
- **macOS Daemon**: ~150-300MB (Swift runtime + Core ML model loaded)
- **iOS App**: ~80-150MB (Core ML optimized for mobile)
- **Model in RAM**: ~1.2-2GB (macOS Ollama) or ~250MB (iOS Core ML)

### Performance
- **First Run**: 1-3s (model preloaded in daemon)
- **iOS Share Extension**: 2-4s (Core ML inference)
- **Daemon Activation**: <100ms (FSEvents → skill execution)

### Disk Usage
- **macOS App**: ~15MB (Swift binary + bundled resources)
- **iOS App**: ~8MB (optimized binary)
- **Core ML Models**: 250MB-1.2GB (platform-dependent)
- **CloudKit Logs**: Synced to iCloud (no local storage)

---

## Configuration Files

### Constitution File
**Location**: `~/Library/Application Support/tinyArms/principles.md`
**Format**: Markdown
**Created**: Auto-generated on first launch (editable)

### CloudKit Sync
**Container**: `iCloud.com.tinyarms`
**Records**: SkillResult, SkillConfig
**Privacy**: User-scoped (never shared)

### Logs
**macOS**: Unified Logging (`log show --predicate 'subsystem == "com.tinyarms"'`)
**iOS**: Console.app (device logs)

---

## Troubleshooting

### "Model not found"
```bash
# macOS: Check Ollama
ollama list
ollama pull qwen2.5-coder:3b

# iOS: Models bundled in app, no action needed
```

### "Daemon not running"
```bash
launchctl list | grep com.tinyarms.daemon
# If not found:
launchctl load ~/Library/LaunchAgents/com.tinyarms.daemon.plist
```

### "CloudKit sync failing"
- Check iCloud login: System Preferences → Apple ID
- Verify iCloud Drive enabled
- Check app permissions: Privacy & Security → iCloud

### "Command not found: tinyarms-cli"
```bash
# Build in Xcode first
# Binary location: .build/debug/tinyarms-cli
# Or add to PATH:
export PATH="$PATH:$(pwd)/.build/debug"
```

### High Memory (macOS)
- Expected: ~2-3GB with Ollama models loaded
- Reduce: Use Core ML models instead (smaller, ~250MB)

---

## Development

### Run Without Building
```bash
swift run tinyarms-cli lint test-example.swift
```

### Run Tests
```bash
swift test
# Or in Xcode: Product → Test (Cmd+U)
```

### Debug Daemon
```bash
# Attach Xcode debugger:
# Debug → Attach to Process → tinyarms-daemon
```

---

## Limitations (v0.2.0 Alpha)

### Not Implemented Yet
- ❌ Tiered routing (always uses Core ML or Ollama primary)
- ❌ Semantic caching (CloudKit cache WIP)
- ❌ MCP tools (Swift MCP SDK in progress)
- ❌ Prompt evolution (researched, not prioritized)
- ❌ Full iOS widget support
- ❌ iPad Split View (basic support only)

### Known Issues
- CloudKit sync requires manual iCloud login
- iOS Share Extension limited to 50MB file size
- Daemon auto-restart on crash not yet configured
- No App Store distribution (TestFlight only)

---

## What Works (v0.2.0)

### Fully Functional
- ✅ Swift CLI (`tinyarms-cli lint`)
- ✅ macOS daemon (LaunchAgent)
- ✅ FSEvents file watching
- ✅ Core ML model inference (iOS)
- ✅ Ollama integration (macOS)
- ✅ iOS Share Extension
- ✅ CloudKit sync (basic)
- ✅ Constitutional linting
- ✅ Unified Logging
- ✅ XCTest suite

---

## Next Release (v0.3.0 Planned)

- [ ] App Store submission
- [ ] iPad Split View full support
- [ ] Widgets (iOS/macOS)
- [ ] Shortcuts integration
- [ ] Tiered routing implementation
- [ ] Semantic caching via CloudKit
- [ ] Swift MCP SDK
- [ ] Notarization (macOS)

---

## Support

- **Issues**: https://github.com/nqh-public/tinyArms/issues
- **Docs**: https://github.com/nqh-public/tinyArms/tree/main/docs
- **License**: MIT
