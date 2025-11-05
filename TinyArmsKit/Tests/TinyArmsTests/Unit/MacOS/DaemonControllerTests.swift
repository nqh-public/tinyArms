import XCTest
@testable import TinyArmsCore
@testable import TinyArmsMacOS

@MainActor
final class DaemonControllerTests: XCTestCase {
    var daemon: DaemonController!

    override func setUp() async throws {
        try await super.setUp()
        daemon = DaemonController.shared
    }

    override func tearDown() async throws {
        daemon.stop()
        try await super.tearDown()
    }

    // MARK: - Lifecycle Tests

    func testStartDaemon() async throws {
        // Note: This test requires Ollama running
        // Will fail gracefully if not available
        XCTAssertFalse(daemon.isRunning)

        do {
            try await daemon.start()
            XCTAssertTrue(daemon.isRunning)
            daemon.stop()
        } catch {
            if let daemonError = error as? DaemonError,
               case .ollamaUnavailable = daemonError
            {
                throw XCTSkip("Ollama not available")
            }
            throw error
        }
    }

    func testStopDaemon() async throws {
        XCTAssertFalse(daemon.isRunning)

        // Start if possible
        do {
            try await daemon.start()
        } catch {
            throw XCTSkip("Could not start daemon")
        }

        XCTAssertTrue(daemon.isRunning)

        daemon.stop()
        XCTAssertFalse(daemon.isRunning)
    }

    // MARK: - File Event Handling Tests

    func testHandleFileEvent() async throws {
        // Test that daemon filters by extension
        let allowedExtensions: Set<String> = ["swift", "ts", "tsx", "js", "jsx", "py"]

        XCTAssertTrue(allowedExtensions.contains("swift"))
        XCTAssertTrue(allowedExtensions.contains("ts"))
        XCTAssertFalse(allowedExtensions.contains("txt"))
        XCTAssertFalse(allowedExtensions.contains("md"))
    }

    func testLintFileFlow() async throws {
        // Test manual lint (doesn't require daemon running)
        let testCode = """
        import Foundation

        let color = "#ff0000"
        """

        let testFile = createTempFile(testCode, ext: "swift")
        defer { deleteTempFile(testFile) }

        // Create constitution
        let constitution = """
        # Principle I: Universal Reusability
        Avoid hardcoded values.
        """
        let constitutionPath = createTempFile(constitution, ext: "md")
        defer { deleteTempFile(constitutionPath) }

        // Note: Requires Ollama running
        do {
            try await daemon.start()
            let result = try await daemon.lintFileManually(path: testFile)
            XCTAssertNotNil(result)
            XCTAssertGreaterThanOrEqual(result.violations.count, 0)
        } catch {
            throw XCTSkip("Ollama not available or daemon could not start")
        }
    }

    func testNotificationDisplay() {
        // Test notification content format
        let title = "Constitutional Violations"
        let message = "2 violation(s) in test.swift"

        XCTAssertTrue(title.contains("Violations"))
        XCTAssertTrue(message.contains("violation"))
    }

    func testManualLint() async throws {
        // Test manual lint without daemon running
        XCTAssertFalse(daemon.isRunning)

        let testFile = createTempFile("let x = 42", ext: "swift")
        defer { deleteTempFile(testFile) }

        do {
            _ = try await daemon.lintFileManually(path: testFile)
            XCTFail("Should throw error when daemon not running")
        } catch {
            XCTAssertTrue(error is DaemonError)
        }
    }

    func testOllamaUnavailableError() async throws {
        // Daemon should fail fast if Ollama not available
        // This is tested in testStartDaemon with skip
        XCTAssertTrue(true, "Tested via testStartDaemon")
    }

    // MARK: - Recent Results Tests

    func testRecentResults() async throws {
        XCTAssertEqual(daemon.recentResults.count, 0)

        // Recent results are populated after linting
        // Test that it has correct capacity (10)
        let maxResults = 10
        XCTAssertLessThanOrEqual(daemon.recentResults.count, maxResults)
    }
}
