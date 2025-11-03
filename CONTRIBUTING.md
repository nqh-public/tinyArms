# Contributing to tinyArms

Thank you for your interest in contributing to tinyArms! 🦖

---

## Project Status

**Current Phase**: Swift migration (Phase 1)

tinyArms is transitioning from TypeScript to native Swift for Apple ecosystem integration (macOS, iOS, iPadOS). See [README.md](README.md) for roadmap.

---

## Ways to Contribute

### 1. Swift Implementation

**Phase 1 (Q1 2026)** - macOS Foundation:
- TinyArmsKit Swift package setup
- LaunchAgent daemon
- FSEvents file watching
- Ollama/MLX Swift integration
- Menu bar app (SwiftUI + AppKit)

**Phase 2 (Q2 2026)** - iOS MVP:
- Share Extension (image, text, file input)
- Core ML model integration
- Result UI (SwiftUI)
- CloudKit sync (basic)

**Phase 3-4 (Q3-Q4 2026)** - iPadOS + App Store:
- Split View, Drag & Drop
- Shortcuts, Widgets
- Code signing, TestFlight, App Store

See [README.md - Development Status](README.md#development-status) for details.

### 2. Documentation

- Update Swift code examples
- Add iOS/iPadOS usage guides
- Improve Xcode setup instructions
- Write tutorials for specific skills

### 3. Research & Validation

- Benchmark Core ML models on iPhone/iPad
- Test MLX Swift vs Ollama performance (macOS)
- Validate CloudKit sync latency
- Contribute Apple ecosystem production evidence

### 4. Bug Reports & Feature Requests

Use [GitHub Issues](https://github.com/nqh/tinyArms/issues) with:
- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- System info (macOS/iOS version, device model, Xcode version)

---

## Development Setup

### Prerequisites

**macOS Development**:
- **macOS 14.0+** (Sequoia preferred)
- **Xcode 15.0+** with Command Line Tools
- **Apple Silicon** (M1+)
- **16GB RAM** recommended (8GB minimum)
- **Apple Developer Account** ($99/year for code signing)

**iOS/iPadOS Testing**:
- **Physical devices** (iPhone 12+, iPad Pro 2020+, iPad Air 4+)
- **TestFlight** access (beta distribution)

### Installation

```bash
# Clone repo
git clone https://github.com/nqh/tinyArms
cd tinyArms/apps/tinyArms

# Open in Xcode
open TinyArms.xcodeproj

# Or use command line
swift build

# Run tests
swift test

# Or in Xcode: Cmd+U
```

### Swift Package Dependencies

Edit `Package.swift` to add dependencies:

```swift
dependencies: [
    // GRDB.swift - SQLite wrapper
    .package(url: "https://github.com/groue/GRDB.swift.git", from: "6.0.0"),

    // MLX Swift - On-device ML (optional, macOS)
    .package(url: "https://github.com/ml-explore/mlx-swift", from: "0.1.0"),
]
```

### Download Models

**macOS** (Ollama):
```bash
brew install ollama
ollama pull qwen2.5-coder:3b
```

**iOS** (Core ML - bundled in app):
- Models packaged in Xcode Resources
- Downloaded on first launch via app

---

## Coding Standards

### File Structure

```
TinyArmsKit/
├── Sources/
│   ├── TinyArmsCore/          # Shared (macOS + iOS)
│   │   ├── Models/            # Data models (Codable)
│   │   ├── Protocols/         # ModelClient, SkillExecutor
│   │   └── Storage/           # GRDB, CloudKit
│   ├── TinyArmsMacOS/         # Daemon, FSEvents
│   │   ├── Daemon/            # LaunchAgent
│   │   ├── FileWatching/      # FSEvents wrapper
│   │   └── MenuBar/           # SwiftUI + AppKit
│   └── TinyArmsiOS/           # Share Extension
│       ├── ShareExtension/    # Extension target
│       └── UI/                # SwiftUI views
├── Tests/
│   ├── CoreTests/             # XCTest unit tests
│   └── UITests/               # XCUITest integration
└── Package.swift
```

### File Naming

- **Files**: `PascalCase.swift` (e.g., `ModelClient.swift`)
- **Types**: `PascalCase` (struct, class, enum, protocol)
- **Properties/Functions**: `camelCase`
- **Constants**: `camelCase` (Swift convention, not SCREAMING_SNAKE_CASE)
- **NO "I" prefix** for protocols (use `protocol SkillExecutor`, not `ISkillExecutor`)

### Code Quality

- **Swift strict mode**: Enable all warnings, treat warnings as errors
- **SwiftLint**: Run before committing (`.swiftlint.yml` in repo)
- **File size**: Keep files under 350 lines (split if larger)
- **Tests**: Add XCTests for new features (target: 70% coverage)
- **Comments**: Explain non-obvious logic (why, not what)
- **Access control**: Use `private`, `fileprivate`, `internal`, `public` appropriately

### Swift Conventions

```swift
// Protocol (no I prefix)
protocol ModelClient {
    func generate(prompt: String) async throws -> String
}

// Struct (value type preferred)
struct SkillResult: Codable {
    let skillName: String
    let input: String
    let output: String
    let timestamp: Date
}

// Enum (associated values)
enum ModelBackend {
    case ollama(url: URL)
    case mlx(modelPath: String)
    case coreML(model: MLModel)
}

// Extension (organize by protocol conformance)
extension SkillResult: Identifiable {
    var id: String { "\(skillName)-\(timestamp.timeIntervalSince1970)" }
}
```

---

## Testing

### Running Tests

```bash
# Command line
swift test

# Xcode
Cmd+U (all tests)
Cmd+Opt+U (test this file)

# Specific test
swift test --filter TinyArmsCoreTests

# Coverage report (Xcode)
# Edit Scheme → Test → Options → Code Coverage
```

### Writing Tests

- Use **XCTest** framework
- Test files: `*Tests.swift` in `Tests/` folder
- Focus on:
  - Core logic (routing, skill execution)
  - Edge cases (empty input, network errors)
  - Platform-specific code (macOS daemon vs iOS Share Extension)

**Example**:
```swift
import XCTest
@testable import TinyArmsCore

final class SkillExecutorTests: XCTestCase {
    func testCodeLintingDetectsHardcodedColors() async throws {
        let executor = CodeLintingExecutor()
        let result = try await executor.execute(input: "let color = \"#FF0000\"")

        XCTAssertTrue(result.violations.contains { $0.rule == "hardcoded-color" })
    }

    func testEmptyInputReturnsNoViolations() async throws {
        let executor = CodeLintingExecutor()
        let result = try await executor.execute(input: "")

        XCTAssertTrue(result.violations.isEmpty)
    }
}
```

---

## Pull Request Process

### 1. Fork & Branch

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/tinyArms
cd tinyArms

# Create feature branch
git checkout -b feature/my-feature
```

### 2. Make Changes

- Follow Swift coding standards above
- Add XCTests for new features
- Update documentation if needed
- Keep commits focused and atomic
- Run SwiftLint: `swiftlint lint`

### 3. Commit Messages

Use conventional commits:

```
feat(macos): add FSEvents file watching to daemon
fix(ios): handle missing photo library permissions
docs(readme): update Xcode setup instructions
test(core): add edge cases for skill execution
```

Format:
```
<type>(<scope>): <short description>

<optional body with details>

<File.swift:line-numbers> (if code change)
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`
**Scopes**: `macos`, `ios`, `ipados`, `core`, `cloudkit`, `ui`

### 4. Test & Lint

```bash
# Run all checks
swift test
swiftlint lint
swift build

# Xcode: Product → Test (Cmd+U)
# All should pass before submitting PR
```

### 5. Submit PR

- **Title**: Clear, descriptive (e.g., "Add Share Extension for iOS screenshot renaming")
- **Description**:
  - What changed
  - Why (problem solved)
  - How to test (steps + expected result)
  - Platform (macOS, iOS, iPadOS, or all)
  - Screenshots (for UI changes)
  - Related issues (if any)

### 6. Code Review

- Be responsive to feedback
- Make requested changes
- Keep PR focused (one feature/fix per PR)
- Squash commits if asked

---

## Architecture Decisions

### Design Philosophy

1. **Native Apple ecosystem**: SwiftUI, CloudKit, Core ML, FSEvents
2. **On-device first**: Privacy-first, no cloud dependencies unless explicit
3. **Memory-efficient**: Optimized for iPhone (4-8GB) and Mac (8-16GB)
4. **Fast rules before AI**: Level 0 (deterministic) handles 60-75% of tasks
5. **Evidence-based**: All claims cite research or benchmarks

### Platform-Specific Guidelines

**macOS**:
- Use FSEvents (not file polling)
- Launch Daemons for automation
- Menu bar app (SwiftUI + AppKit)
- Ollama or MLX Swift for models

**iOS**:
- Share Extension (primary UX)
- Core ML models (Apple Neural Engine)
- Background Tasks (limited execution)
- CloudKit sync

**iPadOS**:
- Inherit iOS, add Split View
- Drag & Drop batch processing
- Keyboard shortcuts
- Pointer interactions

### Adding New Skills

Skills follow Swift structure:

```
TinyArmsKit/Sources/TinyArmsCore/Skills/
└── CodeLinting/
    ├── CodeLintingSkill.swift       # Conforms to SkillExecutor protocol
    ├── CodeLintingConfig.swift      # Codable configuration
    └── CodeLintingResult.swift      # Codable result model
```

**Example**:
```swift
struct CodeLintingSkill: SkillExecutor {
    typealias Input = String
    typealias Output = CodeLintingResult

    func execute(input: String) async throws -> CodeLintingResult {
        // Level 0: Regex rules
        let violations = detectHardcodedColors(in: input)

        // Level 2: LLM if complex
        if violations.isEmpty {
            return try await queryLLM(input)
        }

        return CodeLintingResult(violations: violations)
    }
}
```

---

## Research Contributions

### How to Contribute Research

1. **Benchmarks**: Run models on Apple devices:
   - Model name (Qwen2.5-Coder-3B, SmolLM2-360M)
   - Device (M1 Mac, iPhone 14 Pro, iPad Air 5)
   - Latency (p50, p95, p99)
   - Accuracy (if applicable)
   - Memory usage
   - Battery impact (iOS)

2. **Production Evidence**: Share Apple ecosystem apps:
   - Architecture pattern (daemon, Share Extension, CloudKit)
   - Scale (users, daily invocations)
   - Observed metrics
   - Lessons learned

3. **Academic Papers**: Cite relevant research:
   - Link to paper (arXiv, WWDC sessions, Apple ML Research)
   - Key findings for tinyArms
   - Validation/contradiction of design

### Documentation Standards

- **Cite sources**: References (research file + line number)
- **Quantify impact**: Numbers ("20-30% reduction"), not vague
- **Mark assumptions**: "Assumed (needs validation on device)"
- **Production examples**: Real-world evidence > theory

---

## Community

### Code of Conduct

- **Be respectful**: Constructive criticism
- **Be patient**: Maintainers are volunteers
- **Be helpful**: Share knowledge
- **Be inclusive**: Welcome all skill levels

### Getting Help

- **Questions**: [GitHub Discussions](https://github.com/nqh/tinyArms/discussions)
- **Bugs**: [GitHub Issues](https://github.com/nqh/tinyArms/issues)
- **Features**: [GitHub Issues](https://github.com/nqh/tinyArms/issues) with `enhancement` label

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in docs for major features
- TestFlight beta access (early iOS builds)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make tinyArms better! 🦖

**Platforms**: macOS, iOS, iPadOS • **Language**: Swift 5.9+ • **Privacy**: 100% on-device
