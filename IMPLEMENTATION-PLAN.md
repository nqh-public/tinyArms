# tinyArms Swift Implementation Plan

**Status**: Phase 1-2 in progress
**Timeline**: 6 weeks to Homebrew distribution
**Current Phase**: Week 1-4 (CLI + Daemon)

---

## Phase 1: CLI Tool (Weeks 1-2)

### Goals
- Working CLI matching TypeScript v0.1.0 functionality
- Notarized binary for distribution
- Foundation for daemon

### Deliverables
```bash
tinyarms-cli lint <file> [--constitution PATH] [--format concise|detailed]
# Output: JSON to stdout, exit code 1 if violations
```

### Technical Stack
- **Swift**: 6.2+ (full concurrency, @concurrent)
- **Xcode**: 16.0+
- **Package Manager**: Swift Package Manager
- **Dependencies**:
  - swift-argument-parser 1.5.0+ (CLI)
  - swift-log 1.6.0+ (logging)
- **Platform**: macOS 13.0+ (Ventura)

### Architecture
```
TinyArmsKit/
├─ Sources/
│  ├─ TinyArmsCore/
│  │  ├─ OllamaClient.swift      # URLSession HTTP client
│  │  ├─ Linter.swift             # Constitutional linting logic
│  │  ├─ ConstitutionLoader.swift # Load principles.md
│  │  ├─ Types.swift              # LintResult, Violation, etc.
│  │  └─ TokenCounter.swift       # 4-char heuristic
│  └─ TinyArmsCLI/
│     └─ main.swift               # ArgumentParser CLI
├─ Tests/
│  └─ TinyArmsTests/
│     ├─ OllamaClientTests.swift
│     ├─ LinterTests.swift
│     └─ Fixtures/
│        └─ test-constitution.md
└─ Package.swift
```

### Week 1: Foundation
1. Initialize Swift package (swift-tools-version: 6.0)
2. Port OllamaClient (actor-based, async/await)
3. Port Linter (exact TypeScript logic)
4. Implement Types (Codable structs)

### Week 2: CLI + Testing
5. Build CLI with ArgumentParser
6. Add XCTest suite (unit + integration)
7. Setup code signing (hardened runtime)
8. Create notarization script

---

## Phase 2: Daemon + Menu Bar (Weeks 3-4)

### Goals
- Always-on background daemon
- Native menu bar app with SwiftUI
- Auto-linting on file save

### Deliverables
- LaunchAgent auto-starts on login
- Menu bar shows recent results
- FSEvents watches project directories
- System notifications for violations

### Technical Stack
- **GRDB.swift**: 7.8.0 (SQLite, Swift 6)
- **MenuBarExtra**: SwiftUI (macOS 13+)
- **FSEvents**: Native file watching
- **UserNotifications**: System alerts

### Architecture (Additional)
```
TinyArmsKit/
├─ Sources/
│  ├─ TinyArmsMacOS/
│  │  ├─ DaemonController.swift   # Main daemon singleton
│  │  ├─ FSEventsWatcher.swift    # File watching (actor)
│  │  ├─ MenuBarApp.swift         # @main App struct
│  │  ├─ MenuBarView.swift        # SwiftUI content
│  │  └─ NotificationManager.swift # UserNotifications
│  └─ TinyArmsCore/
│     └─ DatabaseManager.swift    # GRDB (actor)
└─ Resources/
   ├─ com.tinyarms.daemon.plist   # LaunchAgent
   └─ Info.plist                  # LSUIElement = true
```

### Week 3: Daemon Core
9. Implement FSEventsWatcher (Continuations wrap FSEvents API)
10. Create LaunchAgent plist + install script
11. Build DaemonController (singleton, manages lifecycle)
12. Add 500ms debounce with AsyncAlgorithms

### Week 4: UI + Storage
13. Build MenuBarExtra with SwiftUI
14. Integrate GRDB DatabaseManager (lint_history table)
15. Add UserNotifications (violation alerts)
16. Test end-to-end: file save → lint → notification → menu bar

---

## Phase 3: MLX Swift (Weeks 5-6)

### Goals
- Direct on-device inference (<2s latency)
- Fallback to Ollama if MLX unavailable
- Homebrew distribution

### Deliverables
- MLXModelClient integration
- Performance benchmarks
- Homebrew tap + core submission
- Public documentation

---

## Distribution Timeline

**Week 2**: Direct download (notarized .zip)
**Week 4**: Homebrew tap → `brew install tinyarms/tap/tinyarms`
**Week 6**: Homebrew core submission
**Month 3+**: TestFlight (requires iOS app)

---

## Simplifications (No Over-Engineering)

### ✅ Keep Simple
- Direct Qwen2.5-Coder-3B calls (no tiered routing)
- Non-streaming (stream: false)
- Hardcoded config Phase 1 (YAML in Phase 2)
- File logging Phase 1 (GRDB in Phase 2)
- Basic token counting (4-char heuristic)

### ❌ Explicitly Defer
- CloudKit sync (Phase 4 with iOS)
- Semantic caching (Phase 4)
- Multi-skill system (Phase 5)
- MCP server (Phase 6)
- iOS Share Extension (Phase 4)

---

## Decision-Making Principles (from CLAUDE.md)

### MVP First
- Challenge scope expansion
- Force minimal working version
- Ship Phase 1 before expanding

### No Over-Engineering
- Use URLSession (not complex HTTP libs)
- Use hardcoded config initially
- Skip features not in TypeScript v0.1.0

### Swift Conventions
- PascalCase types, camelCase properties
- Actor-based thread safety (Swift 6)
- No "I" prefix for protocols
- Files match type names

### Reality Check
- Confirm Swift code exists before referencing
- Phase 1 = CLI only (no daemon until Phase 2)
- Test incrementally, don't batch

---

## Success Criteria

### Phase 1 Complete
- ✅ `tinyarms-cli lint` produces JSON output
- ✅ Constitutional linting accuracy matches TypeScript
- ✅ 2-3s latency with Ollama
- ✅ Notarized binary passes Gatekeeper
- ✅ XCTest suite passes

### Phase 2 Complete
- ✅ Daemon auto-starts on login
- ✅ Auto-lints on file save (<3s)
- ✅ Menu bar shows recent results
- ✅ Notifications work
- ✅ Installable via script or manual copy

---

## Technical Requirements

**Development**:
- macOS 14.0+ Sonoma (15.0 Sequoia preferred)
- Xcode 16.0+
- Swift 6.2+
- Apple Developer account ($99/year)

**Target**:
- macOS 13.0+ Ventura
- Universal binary (x86_64 + arm64)
- 2-6GB storage (Ollama models)

---

**Last Updated**: 2025-11-05
**Current Status**: Starting Phase 1, Week 1
