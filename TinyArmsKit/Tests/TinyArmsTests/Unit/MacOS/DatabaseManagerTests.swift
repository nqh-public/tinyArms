import XCTest
import GRDB
@testable import TinyArmsCore
@testable import TinyArmsMacOS

final class DatabaseManagerTests: XCTestCase {
    var dbManager: DatabaseManager!
    var tempDBPath: String!

    override func setUp() async throws {
        try await super.setUp()

        // Create temp database
        let tempDir = NSTemporaryDirectory()
        tempDBPath = (tempDir as NSString).appendingPathComponent("\(UUID().uuidString).sqlite")

        dbManager = try await DatabaseManager()
    }

    override func tearDown() async throws {
        dbManager = nil
        if let path = tempDBPath {
            try? FileManager.default.removeItem(atPath: path)
        }
        try await super.tearDown()
    }

    // MARK: - Schema Tests

    func testSchemaCreation() async throws {
        // Verify tables exist
        let stats = try await dbManager.fetchStats()
        XCTAssertNotNil(stats)
        XCTAssertEqual(stats.totalLints, 0)
    }

    // MARK: - Insert Tests

    func testSaveLintResult() async throws {
        let result = LintResult(
            violations: [
                Violation(
                    rule: "test-rule",
                    line: 10,
                    message: "Test violation",
                    severity: .error
                )
            ],
            summary: "Test summary",
            confidence: 0.92,
            model: "qwen2.5-coder:3b-instruct",
            latencyMs: 2500,
            tokenCount: 1234,
            format: .detailed
        )

        try await dbManager.save(result, filePath: "/tmp/test.swift")

        let recent = try await dbManager.fetchRecent(limit: 1)
        XCTAssertEqual(recent.count, 1)
        XCTAssertEqual(recent[0].violationsCount, 1)
        XCTAssertEqual(recent[0].filePath, "/tmp/test.swift")
        XCTAssertEqual(recent[0].model, "qwen2.5-coder:3b-instruct")
        XCTAssertEqual(recent[0].latencyMs, 2500)
        XCTAssertEqual(recent[0].exitCode, 1) // Has violations
    }

    // MARK: - Query Tests

    func testFetchRecent() async throws {
        // Insert multiple results
        for i in 0..<15 {
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

        // Fetch last 10
        let recent = try await dbManager.fetchRecent(limit: 10)
        XCTAssertEqual(recent.count, 10)

        // Should be ordered by timestamp descending (most recent first)
        // The last inserted (test14) should be first
        XCTAssertTrue(recent[0].filePath.contains("test14"))
    }

    func testFetchByFilePath() async throws {
        let testPath = "/tmp/specific-file.swift"

        // Insert results for different files
        for i in 0..<5 {
            let result = LintResult(
                violations: [],
                summary: "Test",
                confidence: 0.85,
                model: "test-model",
                latencyMs: 1000,
                tokenCount: 500,
                format: .concise
            )
            try await dbManager.save(result, filePath: testPath)
        }

        // Insert results for other files
        for i in 0..<3 {
            let result = LintResult(
                violations: [],
                summary: "Other",
                confidence: 0.85,
                model: "test-model",
                latencyMs: 1000,
                tokenCount: 500,
                format: .concise
            )
            try await dbManager.save(result, filePath: "/tmp/other\(i).swift")
        }

        // Fetch by specific path
        let results = try await dbManager.fetchByFilePath(testPath, limit: 10)
        XCTAssertEqual(results.count, 5)
        for record in results {
            XCTAssertEqual(record.filePath, testPath)
        }
    }

    func testFetchStats() async throws {
        // Insert results with violations
        for i in 0..<5 {
            let violationCount = i + 1
            let violations = (0..<violationCount).map { j in
                Violation(
                    rule: "rule-\(j)",
                    line: j + 1,
                    message: "Violation \(j)",
                    severity: .warning
                )
            }

            let result = LintResult(
                violations: violations,
                summary: "Test \(i)",
                confidence: 0.85,
                model: "test-model",
                latencyMs: 1000 + (i * 100),
                tokenCount: 500,
                format: .concise
            )
            try await dbManager.save(result, filePath: "/tmp/test\(i).swift")
        }

        let stats = try await dbManager.fetchStats()
        XCTAssertEqual(stats.totalLints, 5)
        XCTAssertEqual(stats.totalViolations, 1 + 2 + 3 + 4 + 5) // 15
        XCTAssertGreaterThan(stats.avgLatencyMs, 0)
        XCTAssertLessThan(stats.avgLatencyMs, 2000)
    }

    // MARK: - JSON Encoding/Decoding Tests

    func testJSONEncodingDecoding() async throws {
        let violations = [
            Violation(
                rule: "test-rule",
                line: 10,
                message: "Test message",
                severity: .error,
                principle: "Test Principle",
                constitutionalRef: "~/.tinyarms/principles.md:1-10",
                fix: Fix(
                    action: "Fix it",
                    suggestions: ["Suggestion 1", "Suggestion 2"],
                    example: "Example code"
                )
            )
        ]

        let result = LintResult(
            violations: violations,
            summary: "Test",
            confidence: 0.95,
            model: "test-model",
            latencyMs: 2000,
            tokenCount: 1000,
            format: .detailed
        )

        try await dbManager.save(result, filePath: "/tmp/test.swift")

        let fetched = try await dbManager.fetchRecent(limit: 1)
        XCTAssertEqual(fetched.count, 1)

        // Decode violations JSON
        let violationsJSON = fetched[0].violationsJSON
        let data = violationsJSON.data(using: .utf8)!
        let decoder = JSONDecoder()
        let decodedViolations = try decoder.decode([Violation].self, from: data)

        XCTAssertEqual(decodedViolations.count, 1)
        XCTAssertEqual(decodedViolations[0].rule, "test-rule")
        XCTAssertEqual(decodedViolations[0].line, 10)
        XCTAssertEqual(decodedViolations[0].message, "Test message")
        XCTAssertEqual(decodedViolations[0].severity, .error)
        XCTAssertNotNil(decodedViolations[0].fix)
        XCTAssertEqual(decodedViolations[0].fix?.suggestions.count, 2)
    }

    // MARK: - Concurrency Tests

    func testConcurrentWrites() async throws {
        // Spawn 10 concurrent writes
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<10 {
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

                    try? await self.dbManager.save(result, filePath: "/tmp/concurrent\(i).swift")
                }
            }
        }

        // Verify all writes succeeded
        let stats = try await dbManager.fetchStats()
        XCTAssertEqual(stats.totalLints, 10)
    }
}
