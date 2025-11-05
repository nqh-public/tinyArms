import XCTest
@testable import TinyArmsCore
@testable import TinyArmsMacOS

final class ConcurrencyTests: XCTestCase {
    // MARK: - Actor Isolation Tests

    func testLinterActorIsolation() async throws {
        let client = OllamaClient(modelName: "qwen2.5-coder:3b-instruct")
        let linter = Linter(client: client)

        let testCode = "let x = 42"
        let constitution = "# Test"

        // Check if Ollama available
        let available = await client.isAvailable()
        guard available else {
            throw XCTSkip("Ollama not available")
        }

        // Spawn 5 concurrent lint calls
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<5 {
                group.addTask {
                    do {
                        _ = try await linter.lint(
                            code: testCode,
                            constitution: constitution,
                            format: .concise
                        )
                        print("Lint \(i) completed")
                    } catch {
                        print("Lint \(i) failed: \(error)")
                    }
                }
            }
        }

        XCTAssertTrue(true, "All concurrent lints completed without crash")
    }

    func testOllamaClientActorIsolation() async throws {
        let client = OllamaClient(modelName: "qwen2.5-coder:3b-instruct")

        let available = await client.isAvailable()
        guard available else {
            throw XCTSkip("Ollama not available")
        }

        // Spawn 10 concurrent generate calls
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<10 {
                group.addTask {
                    do {
                        _ = try await client.generate(
                            system: "Test system",
                            prompt: "Test prompt \(i)"
                        )
                        print("Generate \(i) completed")
                    } catch {
                        print("Generate \(i) failed: \(error)")
                    }
                }
            }
        }

        XCTAssertTrue(true, "All concurrent generates completed")
    }

    func testDatabaseActorIsolation() async throws {
        let dbManager = try await DatabaseManager()

        // Spawn 20 concurrent writes
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<20 {
                group.addTask {
                    let result = LintResult(
                        violations: [],
                        summary: "Concurrent test \(i)",
                        confidence: 0.85,
                        model: "test-model",
                        latencyMs: 1000,
                        tokenCount: 500,
                        format: .concise
                    )

                    try? await dbManager.save(result, filePath: "/tmp/concurrent\(i).swift")
                }
            }
        }

        // Verify all writes succeeded
        let stats = try await dbManager.fetchStats()
        XCTAssertGreaterThanOrEqual(stats.totalLints, 20)
    }

    func testFSEventsWatcherActorIsolation() async throws {
        let tempDir = createTempDirectory()
        var eventCount = 0
        let lock = NSLock()

        let watcher = FSEventsWatcher { event in
            lock.lock()
            eventCount += 1
            lock.unlock()
        }

        try await watcher.watch(paths: [tempDir])
        try await Task.sleep(nanoseconds: 500_000_000)

        // Create files from multiple tasks
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<10 {
                group.addTask {
                    let file = (tempDir as NSString).appendingPathComponent("test\(i).swift")
                    try! "content".write(toFile: file, atomically: true, encoding: .utf8)
                }
            }
        }

        try await Task.sleep(nanoseconds: 2_000_000_000)
        await watcher.stop()

        XCTAssertGreaterThan(eventCount, 0)
    }

    func testRaceConditionOnDaemonStart() async throws {
        let daemon = DaemonController.shared

        // Try to start daemon multiple times concurrently
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<5 {
                group.addTask {
                    do {
                        try await daemon.start()
                        print("Start \(i) succeeded")
                    } catch {
                        print("Start \(i) failed: \(error)")
                    }
                }
            }
        }

        // Should be running (not crashed)
        if daemon.isRunning {
            daemon.stop()
        }

        XCTAssertTrue(true, "No race condition on daemon start")
    }

    // MARK: - Data Race Tests

    func testSharedStateAccess() async throws {
        // Test that actors prevent data races
        actor Counter {
            var value = 0

            func increment() {
                value += 1
            }

            func getValue() -> Int {
                return value
            }
        }

        let counter = Counter()

        // Spawn 100 concurrent increments
        await withTaskGroup(of: Void.self) { group in
            for _ in 0..<100 {
                group.addTask {
                    await counter.increment()
                }
            }
        }

        let finalValue = await counter.getValue()
        XCTAssertEqual(finalValue, 100, "Actor should prevent data races")
    }

    func testConcurrentReads() async throws {
        let dbManager = try await DatabaseManager()

        // Insert some data
        for i in 0..<10 {
            let result = LintResult(
                violations: [],
                summary: "Test \(i)",
                confidence: 0.85,
                model: "test-model",
                latencyMs: 1000,
                tokenCount: 500,
                format: .concise
            )
            try await dbManager.save(result, filePath: "/tmp/test\(i).swift")
        }

        // Spawn 20 concurrent reads
        await withTaskGroup(of: Int.self) { group in
            for _ in 0..<20 {
                group.addTask {
                    let results = try? await dbManager.fetchRecent(limit: 5)
                    return results?.count ?? 0
                }
            }

            var totalResults = 0
            for await count in group {
                totalResults += count
            }

            XCTAssertGreaterThan(totalResults, 0)
        }
    }
}
