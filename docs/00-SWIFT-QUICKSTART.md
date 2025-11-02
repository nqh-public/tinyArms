# Swift Quick Start

## macOS Development

```bash
git clone repo
open TinyArms.xcodeproj
# Select TinyArmsMacOS scheme → Cmd+R
# Grant permissions: Full Disk Access + Login Items
```

**Test**: Touch file in ~/Desktop → See 🦖 notification

---

## iOS TestFlight

```bash
1. Install TestFlight (App Store)
2. Open beta invite → Install tinyArms
3. Take screenshot → Share → tinyArms
4. Apply suggested rename
```

---

## Build from Source

**macOS**:
```bash
swift build --configuration release
cp config/com.tinyarms.daemon.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.tinyarms.daemon.plist
```

**iOS**:
```bash
open TinyArms.xcodeproj
# Select iOS scheme → Set Team → Cmd+R
```

---

## Platform Differences

| | macOS | iOS |
|-|-------|-----|
| **Trigger** | FSEvents (auto) | Share Sheet (manual) |
| **Models** | Ollama (3-7B) | Core ML (360M) |
| **Storage** | Unlimited | Sandboxed |
