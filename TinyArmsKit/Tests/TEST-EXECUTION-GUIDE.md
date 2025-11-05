# Test Execution Guide for macOS

**Environment**: This test suite requires macOS with Swift 6+ and Xcode 16+
**Current Status**: Tests implemented but not executed (Linux environment)
**Action Required**: Run on macOS to verify all tests pass

---

## ⚠️ Important: Swift Tests Cannot Run on Linux

The tinyArms test suite was implemented in a Linux environment where Swift compiler is not available. All 80 tests are ready but **MUST BE EXECUTED ON macOS** to verify functionality.

---

## 🔧 Prerequisites

### Required Software
- **macOS**: 13.0+ (Ventura) or 14.0+ (Sonoma)
- **Xcode**: 16.0+
- **Swift**: 6.0+ (comes with Xcode)
- **Ollama**: For integration tests

### Installation
```bash
# Install Xcode from Mac App Store
# Install Command Line Tools
xcode-select --install

# Install Ollama
brew install ollama

# Start Ollama
ollama serve &

# Pull required model
ollama pull qwen2.5-coder:3b-instruct
```

---

## 🚀 Quick Start Testing

### 1. Navigate to Project
```bash
cd /path/to/tinyArms/TinyArmsKit
```

### 2. Resolve Dependencies
```bash
# Swift Package Manager will auto-download dependencies
swift package resolve
```

### 3. Run Fast Tests (No Ollama Required)
```bash
# These tests use mocks and can run immediately
swift test --filter TokenCounterTests
swift test --filter ConstitutionLoaderTests
swift test --filter EdgeCaseTests
```

Expected output:
```
Test Suite 'TokenCounterTests' passed
Test Suite 'ConstitutionLoaderTests' passed
Test Suite 'EdgeCaseTests' passed
```

### 4. Run Integration Tests (Ollama Required)
```bash
# Ensure Ollama is running
ollama serve &

# Run all tests
swift test
```

---

## 📋 Test Execution Checklist

### Phase 1: Fast Tests (No External Dependencies)

Run these first to verify basic functionality:

```bash
# Unit tests - Core
swift test --filter TokenCounterTests           # Expected: 5 tests pass
swift test --filter ConstitutionLoaderTests     # Expected: 3 tests pass

# Edge cases
swift test --filter EdgeCaseTests               # Expected: 8 tests pass
```

**Expected Total**: 16 tests pass, 0 failures

### Phase 2: Mock-Based Tests

These tests use MockURLProtocol and don't require live Ollama:

```bash
# Linter tests (mostly mock-based)
swift test --filter LinterTests                 # Expected: 8 tests pass

# OllamaClient mock tests
swift test --filter OllamaClientMockTests       # Expected: 7 tests pass
```

**Expected Total**: 15 tests pass, 0 failures

### Phase 3: Database Tests

Tests GRDB functionality (no Ollama, but requires macOS):

```bash
# Database tests
swift test --filter DatabaseManagerTests        # Expected: 7 tests pass
```

**Expected Total**: 7 tests pass, 0 failures

### Phase 4: Integration Tests (Ollama Required)

**Important**: Start Ollama before running these tests

```bash
# Start Ollama in background
ollama serve &

# Wait for startup
sleep 2

# Pull model if not already present
ollama pull qwen2.5-coder:3b-instruct

# Run OllamaClient tests (live connection)
swift test --filter OllamaClientTests           # Expected: 3 tests pass

# Run CLI integration tests
swift test --filter CLIIntegrationTests         # Expected: 8 tests (some may skip without full setup)

# Run daemon tests
swift test --filter DaemonControllerTests       # Expected: 7 tests (some may skip without Ollama)
```

**Expected Total**: 18+ tests pass (some may skip if Ollama unavailable)

### Phase 5: macOS-Specific Tests

Tests that require native macOS APIs:

```bash
# FSEvents tests (requires macOS)
swift test --filter FSEventsWatcherTests        # Expected: 8 tests pass
```

**Expected Total**: 8 tests pass, 0 failures

### Phase 6: Performance & Concurrency

Performance benchmarks and concurrency safety:

```bash
# Performance tests
swift test --filter PerformanceTests            # Expected: 7 tests pass (with metrics)

# Concurrency tests
swift test --filter ConcurrencyTests            # Expected: 7 tests pass
```

**Expected Total**: 14 tests pass, 0 failures

---

## 🎯 Expected Results Summary

### Without Ollama (Fast Tests)
```bash
swift test --filter Unit/Core --skip OllamaClient
swift test --filter EdgeCases
```

**Expected**: ~40 tests pass in <1 minute

### With Ollama (Full Suite)
```bash
swift test
```

**Expected**: 80 tests pass in ~5-10 minutes

### Test Breakdown
- ✅ Pass: 70-80 tests
- ⚠️ Skip: 0-10 tests (if Ollama not running)
- ❌ Fail: 0 tests (all should pass)

---

## 🔍 Troubleshooting

### Issue: "swift: command not found"
**Solution**: Install Xcode Command Line Tools
```bash
xcode-select --install
sudo xcode-select --switch /Applications/Xcode.app
```

### Issue: "Package.swift: error: ..."
**Solution**: Ensure Swift 6+ is installed
```bash
swift --version  # Should show 6.0+
```

### Issue: Tests timeout or hang
**Solution**: Check Ollama is running
```bash
ps aux | grep ollama
# If not running: ollama serve &
```

### Issue: "model not found" errors
**Solution**: Pull the model
```bash
ollama pull qwen2.5-coder:3b-instruct
ollama list  # Verify model is present
```

### Issue: FSEvents tests fail
**Solution**: Ensure running on macOS (not Linux/Docker)
```bash
uname -a  # Should show Darwin (macOS)
```

### Issue: Database tests fail
**Solution**: Check write permissions
```bash
ls -la ~/Library/Application\ Support/
mkdir -p ~/Library/Application\ Support/tinyArms
```

### Issue: "Cannot find 'MockURLProtocol' in scope"
**Solution**: Rebuild dependencies
```bash
swift package clean
swift package resolve
swift build
```

---

## 📊 Interpreting Test Output

### Success Example
```
Test Suite 'All tests' started at 2025-11-05 12:00:00.000
Test Suite 'LinterTests' passed at 2025-11-05 12:00:05.123
     Executed 8 tests, with 0 failures (0 unexpected) in 5.123 (5.125) seconds
Test Suite 'All tests' passed at 2025-11-05 12:00:10.000
     Executed 80 tests, with 0 failures (0 unexpected) in 10.000 (10.002) seconds
```

### Skip Example (Expected when Ollama not running)
```
Test Case '-[TinyArmsTests.OllamaClientTests testOllamaAvailability]' skipped.
Reason: Ollama not available
```

### Failure Example (Should NOT occur)
```
Test Case '-[TinyArmsTests.LinterTests testLintWithViolations]' failed (0.123 seconds).
XCTAssertEqual failed: ("2") is not equal to ("0")
```

**If you see failures**: Check error message, verify environment, report issue

---

## 🧪 Test-Specific Instructions

### LinterTests
**Setup**: None (uses mocks)
**Expected**: All 8 tests pass
**Note**: Tests JSON parsing, prompt construction, token budgets

### OllamaClientTests
**Setup**: Ollama running + model pulled
**Expected**: 3 tests pass
**Note**: Tests live HTTP connection to Ollama

### DatabaseManagerTests
**Setup**: Write permissions to ~/Library/Application Support
**Expected**: All 7 tests pass
**Note**: Creates temporary SQLite database

### FSEventsWatcherTests
**Setup**: macOS filesystem (not Docker/VM)
**Expected**: All 8 tests pass
**Note**: Creates temporary directories, watches for file changes

### DaemonControllerTests
**Setup**: Ollama running + macOS
**Expected**: 7 tests pass (some may skip)
**Note**: Tests daemon lifecycle, requires UserNotifications

### CLIIntegrationTests
**Setup**: CLI binary built
**Expected**: 8 tests (mostly placeholders for bash scripts)
**Note**: Some tests document expected behavior rather than execute

### EdgeCaseTests
**Setup**: None
**Expected**: All 8 tests pass
**Note**: Tests empty files, large files, Unicode

### PerformanceTests
**Setup**: Ollama running (for lint latency test)
**Expected**: All 7 tests pass with metrics
**Note**: Measures token counting, lint latency, database performance

### ConcurrencyTests
**Setup**: Ollama running (for actor tests)
**Expected**: All 7 tests pass
**Note**: Tests actor isolation, data race prevention

---

## 🔄 Continuous Testing Workflow

### During Development
```bash
# Watch mode (run tests on file save)
# Note: Swift doesn't have built-in watch, use fswatch
brew install fswatch

fswatch -o Sources Tests | xargs -n1 -I{} swift test
```

### Before Commit
```bash
# Run fast tests
swift test --filter Unit --filter EdgeCases

# If all pass, run full suite
swift test
```

### In CI/CD
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  fast-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Fast Tests
        run: |
          cd TinyArmsKit
          swift test --filter TokenCounterTests
          swift test --filter EdgeCaseTests

  integration-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Ollama
        run: brew install ollama
      - name: Start Ollama
        run: |
          ollama serve &
          sleep 5
          ollama pull qwen2.5-coder:3b-instruct
      - name: Run Full Test Suite
        run: |
          cd TinyArmsKit
          swift test
```

---

## 📈 Test Coverage Goals

### Current Implementation Status
- **Tests Created**: 80 tests ✅
- **Tests Executed**: 0 tests ⏳ (awaiting macOS)
- **Tests Passing**: TBD (run on macOS to verify)

### Target Coverage
- **Fast Tests**: 100% pass (no external dependencies)
- **Integration Tests**: 90%+ pass (with Ollama)
- **macOS Tests**: 100% pass (on macOS)
- **Overall**: 95%+ pass rate

### Known Limitations
- Some tests require OllamaClient refactoring for full mock support
- CLI integration tests are placeholders (need bash scripts)
- Performance tests are benchmarks (not pass/fail)

---

## 🎓 Learning Resources

If tests fail, refer to:
1. **TEST-SUMMARY.md** - Comprehensive test documentation
2. **Test source code** - Inline comments explain expected behavior
3. **CLAUDE.md** - Project-specific conventions
4. **Swift Testing Guide**: https://developer.apple.com/documentation/xctest

---

## 📝 Reporting Test Results

After running tests, please report:

1. **Environment**:
   - macOS version
   - Xcode version
   - Swift version
   - Ollama version (if using)

2. **Test Results**:
   - Total tests run
   - Tests passed
   - Tests failed (with error messages)
   - Tests skipped (with reason)

3. **Performance**:
   - Total execution time
   - Slowest test suite
   - Any timeouts

4. **Issues Encountered**:
   - Compilation errors
   - Runtime errors
   - Unexpected behaviors

---

## ✅ Expected Final Output

When all tests pass, you should see:

```
Test Suite 'All tests' started at 2025-11-05 12:00:00.000

Test Suite 'TokenCounterTests' passed at 2025-11-05 12:00:01.123
     Executed 5 tests, with 0 failures (0 unexpected) in 0.123 (0.125) seconds

Test Suite 'ConstitutionLoaderTests' passed at 2025-11-05 12:00:02.234
     Executed 3 tests, with 0 failures (0 unexpected) in 0.234 (0.236) seconds

Test Suite 'LinterTests' passed at 2025-11-05 12:00:03.345
     Executed 8 tests, with 0 failures (0 unexpected) in 1.345 (1.347) seconds

... (more test suites) ...

Test Suite 'All tests' passed at 2025-11-05 12:00:10.000
     Executed 80 tests, with 0 failures (0 unexpected) in 10.000 (10.002) seconds
```

---

**Ready to test on macOS!** 🚀

Run `swift test` in `/path/to/tinyArms/TinyArmsKit/` and report results.
