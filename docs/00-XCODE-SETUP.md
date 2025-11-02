# Xcode Setup

## Requirements

- Xcode 15.0+ (macOS 14.0+)
- Apple Developer account ($99/year for deploy, free for local)

---

## Project Structure

```
TinyArms.xcodeproj
├─ TinyArmsKit (Package)
│  ├─ Core (shared: macOS + iOS)
│  ├─ MacOS (daemon, FSEvents, Ollama)
│  └─ iOS (Share Extension, Core ML)
├─ TinyArmsMacOS (app target)
├─ TinyArmsiOS (app target)
└─ TinyArmsTests
```

---

## Initial Setup

```bash
# 1. Clone
git clone repo && cd tinyArms/apps/tinyArms

# 2. Resolve packages
open TinyArms.xcodeproj
# Xcode: File → Packages → Resolve Package Versions

# 3. Configure signing
# Target → Signing & Capabilities → Team → Select Apple ID

# 4. Build
# Cmd+B (all targets)
```

---

## Dependencies (Swift Package Manager)

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/groue/GRDB.swift", from: "6.0.0"),
    .package(url: "https://github.com/apple/swift-algorithms", from: "1.0.0"),
]
```

**Auto-resolved** on project open.
