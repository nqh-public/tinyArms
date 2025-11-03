<p align="center">
  <img src="tinyarms-logo.jpg" alt="tinyArms" width="300" />
</p>

# 🦖 tinyArms

**Native Apple ecosystem AI assistant. Runs on-device, costs nothing, learns your preferences.**

Super lightweight. Designed to be invisible. Learns from you. Grows with you. Task-specific. Makes your life easier without replacing your brain.

**Platforms**: macOS (menu bar daemon) • iOS (Share Sheet) • iPadOS (Split View)

---

## ⚠️ Status: Swift Migration (Phase 1)

**What's happening**: Full rewrite from TypeScript → Swift for native Apple ecosystem integration.

**What works**: Architecture design, research complete, Swift foundation started.

**What's coming**:
- Phase 1: macOS daemon (LaunchAgent, FSEvents, Core ML)
- Phase 2: iOS Share Extension (screenshot renaming, OCR, privacy redaction)
- Phase 3: iPadOS enhancements (Split View, Drag & Drop)
- Phase 4: CloudKit sync (results across devices)

**Timeline**: Phase 1 (Q1 2026), iOS beta (Q2 2026), App Store (Q3 2026)

⭐ **Star this repo** to follow Swift development.

---

## The Vision

Imagine you take a screenshot on iPhone. tinyArms **reads it via Share Sheet**, extracts text via OCR, and offers **3 intelligent names**:

```
Screenshot_2025-11-02.png

tinyArms suggests:
  1. hero-section-mobile-v1.png
  2. landing-page-screenshot.png
  3. website-mockup-draft.png

You pick #1 (or type your own).

tinyArms learns: "This user prefers structured names with platform + version."

Next screenshot → Better suggestions. Every choice trains the system.
```

**Cross-device sync**: Rename on iPhone, search from Mac via Spotlight (CloudKit sync).

---

## What Makes 🦖 tinyArms Different

### 1. Native Apple Ecosystem Integration

**macOS**: Menu bar daemon, Spotlight indexing, Quick Look previews
**iOS**: Share Extension, Shortcuts/Siri, Widgets, Live Activities
**iPadOS**: Split View, Drag & Drop batch processing
**Sync**: CloudKit (results searchable across all devices)

### 2. 100% On-Device (Privacy-First, Zero Cost)

- **macOS**: Local LLM inference (Ollama or MLX Swift)
- **iOS/iPadOS**: Core ML models (SmolLM2-360M, MobileBERT, CLIP)
- **No cloud**: Your code, files, data never leave your devices
- **No API keys**: No OpenAI/Anthropic accounts needed
- **No subscriptions**: Free tier forever (Pro tier optional for advanced skills)

**Model stack**:
- macOS: Qwen2.5-Coder-3B via Ollama or MLX Swift (1.9GB)
- iOS: Core ML SmolLM2-360M (250MB, Apple Neural Engine optimized)

### 3. Tiered Routing (Fast Rules + Smart AI)

Not everything needs AI. 🦖 tinyArms routes tasks intelligently:

```
Level 0: Deterministic Rules (<1ms, 60-75% of tasks)
  - Hardcoded color detection: bg-[#3B82F6]
  - File type detection, kebab-case formatting
  ↓ (no match)

Level 1: Semantic Routing (<100ms, 20-25% of tasks)
  - Core ML embeddings (MobileBERT 100MB)
  - Intent classification, similarity search
  ↓ (complex task)

Level 2: On-Device LLM (2-3s, 10-15% of tasks)
  - macOS: Qwen2.5-Coder-3B (code linting, refactoring)
  - iOS: SmolLM2-360M (grammar, simple rewrites)
  ↓ (deep analysis)

Level 3: Optional Large Model (10-15s, <5% of tasks)
  - macOS: Qwen2.5-Coder-7B (architectural violations)
  - iOS: Cloud fallback (optional, explicit user consent)
```

**Result**: Simple tasks instant, complex tasks 2-3s. Best of both worlds.

### 4. Self-Improving via Prompt Evolution (Future)

Planned for Phase 5: Adaptive prompts that improve through user feedback.

- Accuracy drops? System generates 3 new prompt variants (offline)
- You vote on outputs (Thompson Sampling A/B test)
- Best prompt auto-promoted
- 99% offline, <$0.06/year cloud cost

**Reference**: `ideas/future-prompt-evolution.md`

---

## Hardware Requirements

| Platform | RAM | Storage | Performance |
|----------|-----|---------|-------------|
| **macOS** | 8GB (16GB recommended) | 2-6GB models | M1+ (Apple Silicon required) |
| **iOS** | 4GB+ | 500MB-1GB models | iPhone 12+ (A14+ for Neural Engine) |
| **iPadOS** | 6GB+ | 500MB-1GB models | iPad Pro 2020+ or iPad Air 4+ |

**Platforms**: macOS 13.0+ (Ventura), iOS 17.0+, iPadOS 17.0+

---

## Quick Start (When Released)

### macOS

```bash
# Download from GitHub Releases
open TinyArms-macOS-v0.2.0.dmg

# Grant permissions (LaunchAgent, File Access, Spotlight)
# Menu bar icon appears → Ready

# Or build from source:
git clone https://github.com/nqh/tinyArms
cd tinyArms
open TinyArms.xcodeproj
# Build & Run (Cmd+R)
```

### iOS/iPadOS

```
1. Install TestFlight from App Store
2. Scan QR code (beta invite)
3. Open tinyArms app
4. Take screenshot → Share → tinyArms
5. Rename suggestion appears → Tap "Apply"
```

---

## Core Skills

### Implemented (v0.2.0)

1. **code-linting** (macOS)
   - Pre-commit hook integration
   - Detects: hardcoded colors, magic numbers, file size >350 LOC
   - Speed: 2-3s per file (Qwen2.5-Coder-3B)

### Planned (Phase 2-3)

2. **visual-intelligence** (iOS/macOS)
   - Screenshot OCR (PaddleOCR 8.6MB + Vision framework)
   - Scene understanding (CLIP ViT-B/32 340MB)
   - Use cases: Screenshot naming, receipt scanning, whiteboard capture

3. **writing-tools** (iOS/macOS)
   - Grammar/spelling (LanguageTool offline)
   - Tone adjustment (professional, friendly, concise)
   - Summarization (BART-large-CNN or SmolLM2)

4. **privacy-redaction** (iOS/macOS)
   - Auto-detect PII (emails, phone numbers, API keys)
   - Blur before sharing (Share Extension integration)
   - Pre-commit hook (block commits with secrets)

5. **context-aware-clipboard** (macOS)
   - Semantic search clipboard history (MobileBERT embeddings)
   - Auto-format on paste (URL → markdown, JSON → pretty-print)

6. **file-naming** (iOS/macOS)
   - Screenshot → descriptive names
   - Learns from your choices (prompt evolution)

---

## Documentation

### Foundation
- **[00-SWIFT-QUICKSTART.md](docs/00-SWIFT-QUICKSTART.md)** - 5-minute Xcode setup
- **[01-SWIFT-ARCHITECTURE.md](docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md)** - TinyArmsKit package structure

### Platform Guides
- **[02-MACOS-DAEMON.md](docs/02-MACOS-DAEMON.md)** - LaunchAgent, FSEvents, menu bar
- **[03-IOS-PLATFORM.md](docs/03-IOS-PLATFORM.md)** - Share Extension, Shortcuts, Widgets
- **[04-IPADOS-PLATFORM.md](docs/04-IPADOS-PLATFORM.md)** - Split View, Drag & Drop

### Advanced
- **[05-COREML-MODELS.md](docs/05-COREML-MODELS.md)** - Model conversion, Neural Engine
- **[06-CLOUDKIT-SYNC.md](docs/06-CLOUDKIT-SYNC.md)** - Cross-device sync architecture
- **[08-APP-STORE-DEPLOYMENT.md](docs/08-APP-STORE-DEPLOYMENT.md)** - Code signing, TestFlight

### Research
- **[research/](docs/research/)** - Tiered routing, confidence scoring, semantic caching (11 papers)
- **[research/06-apple-foundation-models-integration.md](docs/research/06-apple-foundation-models-integration.md)** - Apple FM vs tinyArms analysis

---

## Development Status

### Phase 1: macOS Foundation (In Progress)
- [x] Swift architecture design
- [x] Research complete (tiered routing, industry validation)
- [ ] Xcode project setup (TinyArmsKit package)
- [ ] LaunchAgent daemon
- [ ] FSEvents file watching
- [ ] Ollama/MLX Swift integration
- [ ] Menu bar app (SwiftUI)

### Phase 2: iOS MVP (Planned Q2 2026)
- [ ] Share Extension (image, text, file input)
- [ ] Core ML models (SmolLM2-360M, MobileBERT)
- [ ] Result UI (SwiftUI card)
- [ ] CloudKit sync (basic)

### Phase 3: iPadOS + Advanced (Planned Q3 2026)
- [ ] Split View support
- [ ] Drag & Drop batch processing
- [ ] Shortcuts integration (Siri)
- [ ] Widgets + Live Activities

### Phase 4: App Store Release (Planned Q4 2026)
- [ ] Code signing + notarization
- [ ] TestFlight public beta
- [ ] App Store submission
- [ ] StoreKit 2 (subscriptions)

---

## Why "tinyArms"?

Like a **T-Rex**: Small arms, but surprisingly capable when working WITH larger tools.

tinyArms doesn't replace your brain or workflow. It's the **invisible AI assistant** that learns your preferences, handles repetitive tasks, and gets better over time—without you thinking about it.

**Platform-first**: Designed for how you already work (Share Sheet, Shortcuts, Spotlight, menu bar).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for Swift development setup.

**Requirements**:
- Xcode 15.0+ (macOS Sequoia SDK)
- Apple Developer account ($99/year for code signing)
- Swift 5.9+
- macOS 14.0+ (development machine)

---

## License

MIT 🦖

**Native Apple ecosystem. On-device ML. Learns from YOU.**
