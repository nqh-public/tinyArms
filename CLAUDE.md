# CLAUDE.md

**tinyArms-Specific Guidance for Claude Code**

Swift-native Apple ecosystem AI assistant (macOS + iOS + iPadOS). For general AI best practices, see standard LLM guidance.

---

## ⚠️ Critical: Swift Migration Phase

**Status**: Phase 1 - Swift foundation in progress

**What exists**:
- ✅ Complete architecture research (tiered routing, industry validation)
- ✅ Swift platform design (TinyArmsKit package structure)
- ✅ Model decisions (macOS: Ollama/MLX, iOS: Core ML)
- ✅ CloudKit sync architecture
- ⏳ Xcode project (planned)

**What does NOT exist**:
- ❌ Working Swift implementation
- ❌ Xcode workspace
- ❌ Actual Core ML integration
- ❌ iOS Share Extension

**Before implementing**: Confirm Swift code vs design documentation.

---

## Project Overview

**tinyArms** - Native Apple ecosystem AI assistant using on-device models for automated tasks.

**Platforms**: macOS (menu bar daemon), iOS (Share Extension), iPadOS (Split View)

**Key Design**: 100% on-device (privacy-first), tiered routing (rules before AI), CloudKit sync (cross-device results).

**Core Skills**:
1. code-linting (macOS pre-commit, 2-3s)
2. visual-intelligence (iOS screenshot OCR + naming)
3. privacy-redaction (auto-detect PII before sharing)
4. writing-tools (grammar, tone adjustment)

---

## Documentation

**📚 Complete navigation**: [docs/INDEX.md](docs/INDEX.md) (auto-generated, 43 files)

**Swift-specific**:
- [00-SWIFT-QUICKSTART.md](docs/00-SWIFT-QUICKSTART.md) - Xcode setup (5 min)
- [01-SWIFT-ARCHITECTURE-OVERVIEW.md](docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md) - TinyArmsKit package
- [02-MACOS-DAEMON.md](docs/02-MACOS-DAEMON.md) - LaunchAgent, FSEvents, menu bar
- [03-IOS-PLATFORM.md](docs/03-IOS-PLATFORM.md) - Share Extension, Shortcuts, Widgets

---

## Model Stack

### macOS (Daemon)
- **Level 1**: MobileBERT embeddings (100MB, semantic routing)
- **Level 2**: Qwen2.5-Coder-3B via Ollama or MLX Swift (1.9GB)
- **Level 3**: Qwen2.5-Coder-7B (4.7GB, optional deep analysis)

### iOS/iPadOS (On-Device)
- **Level 1**: MobileBERT Core ML (100MB, Apple Neural Engine)
- **Level 2**: SmolLM2-360M Core ML (250MB, general tasks)
- **Vision**: CLIP ViT-B/32 Core ML (340MB, image understanding)

**Reference**: [docs/01-MODELS.md](docs/01-MODELS.md), [docs/05-COREML-MODELS.md](docs/05-COREML-MODELS.md)

---

## Scope Guard (tinyArms-Specific)

**Reality check**: Swift implementation = Phase 1 (in progress), iOS = Phase 2 (planned Q2 2026).

**Challenge requests**:
- "Build the iOS app" → "Phase 2 design or start Phase 1 macOS first?"
- "Add CloudKit sync" → "Architecture doc or wait for Phase 4?"
- "Create Share Extension" → "Prototype or full implementation?"

**Force MVP** before expanding scope.

---

## Platform Requirements

### Development
- **macOS**: 14.0+ (Sequoia preferred), Apple Silicon (M1+)
- **Xcode**: 15.0+ (Swift 5.9+)
- **Apple Developer**: Account required ($99/year for code signing)

### Target Devices
- **macOS**: 13.0+ (Ventura), 8GB RAM, 2-6GB storage
- **iOS**: 17.0+, iPhone 12+ (A14 Neural Engine), 4GB+ RAM
- **iPadOS**: 17.0+, iPad Pro 2020+ / Air 4+, 6GB+ RAM

**Full details**: [README.md - Hardware Requirements](README.md#hardware-requirements)

---

## Tech Stack

**Language**: Swift 5.9+ (async/await, actors, macros)
**UI**: SwiftUI (macOS menu bar, iOS Share Extension, widgets)
**Storage**: GRDB.swift (local SQLite) + CloudKit (sync)
**ML**: Core ML (iOS), Ollama HTTP client or MLX Swift (macOS)
**File Watching**: FSEvents (macOS native, not chokidar)
**Automation**: Launch Daemons (macOS), Background Tasks (iOS)

**Package Manager**: Swift Package Manager (not npm)

---

## Swift Conventions

**Naming**:
- Types: `PascalCase` (struct, class, enum, protocol)
- Properties/functions: `camelCase`
- Files: `PascalCase.swift` (match type name)
- NO "I" prefix for protocols (use `protocol SkillExecutor`, not `ISkillExecutor`)

**File Structure**:
```
TinyArmsKit/
├─ Sources/
│  ├─ TinyArmsCore/        # Shared logic
│  ├─ TinyArmsMacOS/       # Daemon, FSEvents
│  └─ TinyArmsiOS/         # Share Extension
├─ Tests/
│  ├─ CoreTests/           # XCTest
│  └─ UITests/             # XCUITest
└─ Package.swift           # Dependencies
```

**Testing**: XCTest (not Vitest), run via `swift test` or Xcode

**Linting**: SwiftLint (not ESLint), run via Build Phase

---

## Quick Reference

**Type**: Native Apple ecosystem app
**Phase**: Phase 1 (Swift foundation, macOS daemon)
**Platforms**: macOS 13+ (primary), iOS 17+ (Phase 2), iPadOS 17+ (Phase 3)
**Unique trait**: Cross-device CloudKit sync, on-device privacy-first ML

**Swift CLI Examples** (when implemented):
```swift
// macOS daemon (background, LaunchAgent)
TinyArmsDaemon.main()

// CLI tool (manual invocation)
tinyarms-cli lint src/
tinyarms-cli status
tinyarms-cli models list
```

**iOS Examples** (when implemented):
```swift
// Share Extension
ShareViewController.handle(image: screenshot)

// Shortcuts
TinyArmsIntent.executeLinting(files: selectedFiles)
```

---

## Development Workflow

### Phase 1 (Current): macOS Foundation
1. Create Xcode project (TinyArms.xcodeproj)
2. Setup TinyArmsKit package (shared code)
3. Implement LaunchAgent daemon
4. Add FSEvents file watching
5. Integrate Ollama or MLX Swift (model client)
6. Build menu bar app (SwiftUI + AppKit)

### Phase 2 (Q2 2026): iOS MVP
1. Add iOS app target
2. Create Share Extension
3. Integrate Core ML models (SmolLM2-360M, MobileBERT)
4. Build result UI (SwiftUI)
5. Basic CloudKit sync

### Phase 3-4: iPadOS + App Store
- Split View, Drag & Drop
- Shortcuts, Widgets, Live Activities
- Code signing, TestFlight, App Store submission

**Reference**: [README.md - Development Status](README.md#development-status)

---

## Before Implementation

**Always ask**:
1. Is this Phase 1 (macOS) or Phase 2+ (iOS/iPadOS)?
2. Swift code or architecture doc?
3. MVP or full feature?

**Don't assume** TypeScript/Node.js patterns apply - this is native Swift/Apple ecosystem.
