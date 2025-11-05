import XCTest
@testable import TinyArmsCore

final class PerformanceTests: XCTestCase {
    // MARK: - Token Counting Performance

    func testTokenCountingPerformance() {
        // Test 10K characters
        let text10K = String(repeating: "test ", count: 2000) // ~10K chars
        measure {
            _ = TokenCounter.count(text10K)
        }

        // Test 100K characters
        let text100K = String(repeating: "test ", count: 20_000) // ~100K chars
        measure {
            _ = TokenCounter.count(text100K)
        }

        // Test 1M characters
        let text1M = String(repeating: "test ", count: 200_000) // ~1M chars
        measure {
            _ = TokenCounter.count(text1M)
        }
    }

    // MARK: - Lint Latency

    func testLintLatency() async throws {
        // Measure end-to-end lint latency
        // Target: <3s with Ollama

        let testCode = """
        import Foundation

        func example() {
            let color = "#ff0000"
        }
        """

        let constitution = """
        # Principle I: Universal Reusability
        Avoid hardcoded values.
        """

        // Note: Requires Ollama running
        let client = OllamaClient(modelName: "qwen2.5-coder:3b-instruct")
        let linter = Linter(client: client)

        // Check if Ollama available
        let available = await client.isAvailable()
        guard available else {
            throw XCTSkip("Ollama not available for performance test")
        }

        let options = XCTMeasureOptions()
        options.iterationCount = 3

        measure(options: options) {
            Task {
                do {
                    let startTime = Date()
                    _ = try await linter.lint(
                        code: testCode,
                        constitution: constitution,
                        format: .concise
                    )
                    let latency = Date().timeIntervalSince(startTime)
                    print("Lint latency: \(latency)s")
                    XCTAssertLessThan(latency, 3.0, "Lint should complete in <3s")
                } catch {
                    XCTFail("Lint failed: \(error)")
                }
            }
        }
    }

    // MARK: - Database Performance

    func testDatabaseInsertLatency() async throws {
        let dbManager = try await DatabaseManager()

        let results = (0..<1000).map { i in
            LintResult(
                violations: [],
                summary: "Test \(i)",
                confidence: 0.85,
                model: "test-model",
                latencyMs: 1000,
                tokenCount: 500,
                format: .concise
            )
        }

        measure {
            Task {
                for (index, result) in results.enumerated() {
                    try? await dbManager.save(result, filePath: "/tmp/test\(index).swift")
                }
            }
        }
    }

    // MARK: - FSEvents Storm

    func testFSEventsStorm() async throws {
        // Test handling of many rapid file changes
        let tempDir = createTempDirectory()
        var eventCount = 0

        let watcher = FSEventsWatcher { event in
            eventCount += 1
        }

        try await watcher.watch(paths: [tempDir])
        try await Task.sleep(nanoseconds: 500_000_000)

        // Create 100 files rapidly
        measure {
            for i in 0..<100 {
                let file = (tempDir as NSString).appendingPathComponent("storm\(i).swift")
                try! "content".write(toFile: file, atomically: true, encoding: .utf8)
            }
        }

        // Wait for debouncing
        try await Task.sleep(nanoseconds: 2_000_000_000)

        await watcher.stop()

        print("FSEvents handled \(eventCount) events")
        XCTAssertGreaterThan(eventCount, 0)
    }

    // MARK: - Memory Usage

    func testMemoryUsage() {
        measure(metrics: [XCTMemoryMetric()]) {
            // Create many violations
            let violations = (0..<1000).map { i in
                Violation(
                    rule: "rule-\(i)",
                    line: i + 1,
                    message: "Test violation with some message content",
                    severity: .warning,
                    principle: "Test Principle",
                    constitutionalRef: "~/.tinyarms/principles.md:1-10",
                    fix: Fix(
                        action: "Fix the issue",
                        suggestions: ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
                        example: "Example code here"
                    )
                )
            }

            // Encode to JSON
            let encoder = JSONEncoder()
            _ = try! encoder.encode(violations)

            // Memory should be released after scope
        }
    }

    // MARK: - String Operations

    func testStringTruncationPerformance() {
        let longString = String(repeating: "a", count: 100_000)

        measure {
            for _ in 0..<1000 {
                _ = String(longString.prefix(2000))
            }
        }
    }

    func testJSONEncodingPerformance() {
        let violations = (0..<100).map { i in
            Violation(
                rule: "rule-\(i)",
                line: i + 1,
                message: "Test",
                severity: .warning
            )
        }

        let encoder = JSONEncoder()

        measure {
            for _ in 0..<100 {
                _ = try! encoder.encode(violations)
            }
        }
    }
}
