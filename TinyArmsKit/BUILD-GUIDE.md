# TinyArms Swift Build Guide

**Note**: This Swift implementation requires macOS with Xcode to build. The current environment (Linux) cannot compile Swift packages natively.

## Prerequisites

### Required Software
- **macOS**: 13.0+ (Ventura) or 14.0+ (Sonoma)
- **Xcode**: 16.0+ (for Swift 6 support)
- **Command Line Tools**: `xcode-select --install`
- **Ollama**: For model inference (`brew install ollama`)

### Apple Developer Account
- Required for code signing and notarization
- Free account works for development
- Paid account ($99/year) required for distribution

## Building from Source

### 1. Clone Repository

```bash
cd /path/to/tinyArms/TinyArmsKit
```

### 2. Resolve Dependencies

Swift Package Manager will automatically download dependencies on first build:
- swift-argument-parser 1.5.0+
- swift-log 1.6.0+
- GRDB.swift 7.8.0
- swift-async-algorithms 1.0.0

### 3. Build CLI Tool

```bash
# Debug build
swift build

# Release build (optimized)
swift build -c release

# CLI binary location
.build/release/tinyarms-cli
```

### 4. Build Menu Bar App (Requires Xcode)

The menu bar app requires Xcode project generation:

```bash
# Generate Xcode project
swift package generate-xcodeproj

# Open in Xcode
open TinyArmsKit.xcodeproj
```

In Xcode:
1. Select "TinyArmsMacOS" scheme
2. Product → Archive
3. Distribute App → Copy App

**Or use command line**:

```bash
xcodebuild -scheme TinyArmsMacOS \
  -configuration Release \
  -archivePath ./build/TinyArms.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath ./build/TinyArms.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist ExportOptions.plist
```

## Installation

### CLI Tool

```bash
# Copy to /usr/local/bin
sudo cp .build/release/tinyarms-cli /usr/local/bin/

# Verify
tinyarms-cli --version
```

### Menu Bar App (Daemon)

```bash
# Copy app bundle
cp -r build/TinyArms.app /Applications/

# Install LaunchAgent
./Scripts/install-daemon.sh
```

## Code Signing (Required for Distribution)

### 1. Development Signing (Xcode Automatic)

In Xcode:
1. Select project in navigator
2. Signing & Capabilities tab
3. Team → Select your Apple ID
4. Automatically manage signing ✓

### 2. Distribution Signing (Manual)

```bash
# List available identities
security find-identity -v -p codesigning

# Sign app with Developer ID
codesign --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --options runtime \
  --timestamp \
  --deep \
  /Applications/TinyArms.app

# Verify signature
codesign -dv --verbose=4 /Applications/TinyArms.app
spctl -a -t exec -vv /Applications/TinyArms.app
```

### 3. Notarization (Required for Distribution)

```bash
# Create DMG
hdiutil create -volname "TinyArms" \
  -srcfolder /Applications/TinyArms.app \
  -ov -format UDZO \
  TinyArms.dmg

# Submit for notarization
xcrun notarytool submit TinyArms.dmg \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait

# Staple ticket
xcrun stapler staple TinyArms.dmg

# Verify
spctl -a -t open --context context:primary-signature -v TinyArms.dmg
```

## Testing

### Unit Tests

```bash
# Run all tests
swift test

# Run specific suite
swift test --filter TokenCounterTests

# Verbose output
swift test --verbose
```

### Integration Testing

```bash
# Ensure Ollama is running
ollama serve &

# Pull required model
ollama pull qwen2.5-coder:3b-instruct

# Test CLI
swift run tinyarms-cli lint Tests/TinyArmsTests/Fixtures/test-code-violations.swift

# Test with custom constitution
swift run tinyarms-cli lint path/to/file.swift \
  --constitution Tests/TinyArmsTests/Fixtures/test-constitution.md
```

### Daemon Testing

1. Build menu bar app in Xcode
2. Run from Xcode (Product → Run)
3. Check menu bar for brain icon
4. Modify a watched file (~/Downloads/test.swift)
5. Verify notification appears
6. Click menu bar icon → see recent results

## Troubleshooting

### Swift Compiler Not Found

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Set active developer directory
sudo xcode-select --switch /Applications/Xcode.app
```

### Dependency Resolution Fails

```bash
# Clean build artifacts
swift package clean

# Reset package cache
rm -rf .build
swift package resolve
```

### Code Signing Errors

```bash
# Check available identities
security find-identity -v -p codesigning

# Unlock keychain
security unlock-keychain ~/Library/Keychains/login.keychain-db
```

### Notarization Fails

Common issues:
- **Hardened Runtime not enabled**: Add `--options runtime` to codesign
- **Missing timestamp**: Add `--timestamp` to codesign
- **Invalid entitlements**: Check entitlements file matches requirements

## Development Workflow

### Iterating on CLI

```bash
# Edit source
vim Sources/TinyArmsCore/Linter.swift

# Quick build + test
swift build && swift test

# Run CLI without installing
swift run tinyarms-cli lint path/to/test.swift
```

### Iterating on Menu Bar App

1. Open Xcode project
2. Edit source files
3. Product → Run (⌘R)
4. Test in menu bar
5. View logs in Console.app (filter: "tinyarms")

### Debugging

```bash
# Build with debug symbols
swift build -c debug

# Run with LLDB
lldb .build/debug/tinyarms-cli
(lldb) run lint path/to/file.swift
```

In Xcode:
1. Set breakpoints in source
2. Product → Run
3. Xcode debugger activates on breakpoint

## Performance Profiling

### CLI Latency

```bash
time swift run -c release tinyarms-cli lint path/to/large-file.swift
```

### Memory Usage

```bash
# Monitor memory
/usr/bin/time -l swift run -c release tinyarms-cli lint path/to/file.swift
```

In Xcode:
1. Product → Profile (⌘I)
2. Choose "Allocations" or "Leaks"
3. Record session
4. Analyze memory graph

## Distribution

### Homebrew Tap (Planned)

```bash
# After building and notarizing
brew install tinyarms/tap/tinyarms
```

### Direct Download (Planned)

```bash
# Download notarized DMG
curl -L -O https://github.com/nqh-public/tinyArms/releases/latest/download/TinyArms.dmg

# Mount and copy
hdiutil attach TinyArms.dmg
cp -r /Volumes/TinyArms/TinyArms.app /Applications/
hdiutil detach /Volumes/TinyArms
```

## Next Steps

After successful build:
1. Test CLI with sample constitution
2. Install daemon and test auto-linting
3. Monitor logs for errors
4. Provide feedback on GitHub Issues

For development setup, see [CONTRIBUTING.md](../CONTRIBUTING.md).
