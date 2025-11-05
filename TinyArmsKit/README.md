# TinyArmsKit

Swift package for tinyArms - Constitutional code linter using local AI models.

## Status

**Phase 1**: CLI tool (in progress)
**Phase 2**: Daemon + menu bar (pending)
**Phase 3**: MLX Swift integration (pending)

## Requirements

- **macOS**: 13.0+ (Ventura)
- **Swift**: 6.0+
- **Xcode**: 16.0+ (for building)
- **Ollama**: Required for model inference

## Installation

### From Source (Development)

```bash
cd TinyArmsKit
swift build -c release
cp .build/release/tinyarms-cli /usr/local/bin/
```

### Testing

```bash
# Run all tests
swift test

# Run specific test
swift test --filter OllamaClientTests
```

## Usage

### CLI Tool

```bash
# Lint a file
tinyarms-cli lint path/to/file.swift

# Custom constitution
tinyarms-cli lint path/to/file.swift --constitution ~/.tinyarms/custom-principles.md

# Concise output
tinyarms-cli lint path/to/file.swift --format concise

# Different model
tinyarms-cli lint path/to/file.swift --model qwen2.5-coder:7b-instruct
```

### Output

JSON to stdout:
```json
{
  "confidence": 0.85,
  "format": "detailed",
  "latencyMs": 2341,
  "model": "qwen2.5-coder:3b-instruct",
  "summary": "Found 2 violations of constitutional principles",
  "tokenCount": 1234,
  "violations": [
    {
      "id": "...",
      "line": 15,
      "message": "Hardcoded color value instead of using design tokens",
      "rule": "universal-reusability",
      "severity": "warning",
      "principle": "Principle I: Universal Reusability",
      "fix": {
        "action": "Use design token from theme",
        "suggestions": ["Replace with theme.colors.primary"]
      }
    }
  ]
}
```

Exit code:
- `0`: No violations
- `1`: Violations found or error

## Architecture

```
TinyArmsKit/
├─ Sources/
│  ├─ TinyArmsCore/           # Shared core logic
│  │  ├─ OllamaClient.swift   # HTTP client (URLSession)
│  │  ├─ Linter.swift         # Constitutional linting
│  │  ├─ Types.swift          # Data models
│  │  ├─ TokenCounter.swift   # Token budget enforcement
│  │  └─ ConstitutionLoader.swift
│  ├─ TinyArmsMacOS/          # macOS daemon (Phase 2)
│  └─ TinyArmsCLI/            # CLI executable
└─ Tests/
   └─ TinyArmsTests/
```

## Development

### Building

```bash
swift build
```

### Running Tests

```bash
# All tests
swift test

# Specific suite
swift test --filter TokenCounterTests

# With output
swift test --verbose
```

### Running CLI Locally

```bash
swift run tinyarms-cli lint Tests/TinyArmsTests/Fixtures/test-code-violations.swift
```

## Phase 2: Daemon (Coming Soon)

- FSEvents file watching
- LaunchAgent auto-start
- MenuBarExtra UI
- GRDB storage
- UserNotifications

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

MIT - See [LICENSE](../LICENSE)
