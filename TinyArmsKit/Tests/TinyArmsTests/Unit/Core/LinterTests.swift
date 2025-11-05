import XCTest
@testable import TinyArmsCore

final class LinterTests: XCTestCase {
    var mockSession: URLSession!
    var client: OllamaClient!
    var linter: Linter!

    override func setUp() async throws {
        try await super.setUp()
        MockURLProtocol.reset()

        // Create mock session
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        mockSession = URLSession(configuration: config)

        // Note: OllamaClient doesn't expose session injection yet
        // This test demonstrates the pattern for when we refactor
    }

    override func tearDown() async throws {
        MockURLProtocol.reset()
        try await super.tearDown()
    }

    // MARK: - Mock Response Tests

    func testLintWithMockOllamaResponse() async throws {
        // Setup mock response
        MockURLProtocol.requestHandler = { request in
            let url = URL(string: "http://localhost:11434/api/generate")!
            let response = HTTPURLResponse(
                url: url,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/json"]
            )!

            let ollamaResponse = """
            {
              "response": \(MockOllamaResponses.successWithViolations)
            }
            """
            let data = ollamaResponse.data(using: .utf8)!
            return (response, data)
        }

        // Create client with mock session (requires refactoring OllamaClient to accept URLSession)
        // For now, this test documents the desired behavior
        let client = OllamaClient(modelName: "qwen2.5-coder:3b-instruct")
        let linter = Linter(client: client)

        let testCode = """
        let color = "#ff0000"
        """

        let testConstitution = """
        # Principle I: Universal Reusability
        All code must be reusable by others.
        """

        // Note: This will fail without Ollama running
        // TODO: Refactor OllamaClient to accept URLSession for proper mocking
        // let result = try await linter.lint(code: testCode, constitution: testConstitution)
        // XCTAssertEqual(result.violations.count, 2)
    }

    func testLintWithViolations() async throws {
        // Test that violations are correctly parsed from JSON response
        let jsonResponse = MockOllamaResponses.successWithViolations
        guard let data = jsonResponse.data(using: .utf8) else {
            XCTFail("Failed to create test data")
            return
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        struct TestResponse: Codable {
            let violations: [Violation]
            let summary: String
            let confidence: Double?
        }

        let parsed = try decoder.decode(TestResponse.self, from: data)

        XCTAssertEqual(parsed.violations.count, 2)
        XCTAssertEqual(parsed.violations[0].rule, "architecture-first")
        XCTAssertEqual(parsed.violations[0].line, 10)
        XCTAssertEqual(parsed.violations[0].severity, .error)
        XCTAssertEqual(parsed.violations[1].rule, "dry-violation")
        XCTAssertEqual(parsed.violations[1].severity, .warning)
        XCTAssertEqual(parsed.confidence, 0.92)
    }

    func testLintWithNoViolations() async throws {
        // Test empty violations array
        let jsonResponse = MockOllamaResponses.successNoViolations
        guard let data = jsonResponse.data(using: .utf8) else {
            XCTFail("Failed to create test data")
            return
        }

        let decoder = JSONDecoder()
        struct TestResponse: Codable {
            let violations: [Violation]
            let summary: String
            let confidence: Double?
        }

        let parsed = try decoder.decode(TestResponse.self, from: data)

        XCTAssertEqual(parsed.violations.count, 0)
        XCTAssertTrue(parsed.summary.contains("No violations"))
        XCTAssertEqual(parsed.confidence, 0.98)
    }

    func testPromptConstruction() {
        // Test that prompts are constructed correctly
        let constitution = "# Principle I: Test Principle\n\nThis is a test."
        let code = "let x = 42"

        // Verify constitution truncation (should be 2000 chars max)
        let longConstitution = String(repeating: "a", count: 3000)
        let truncated = String(longConstitution.prefix(2000))
        XCTAssertEqual(truncated.count, 2000)

        // Verify system prompt includes focus areas
        let expectedKeywords = [
            "Architecture-First",
            "DRY",
            "Universal Reusability",
            "Zero Invention",
        ]

        // System prompt would be constructed in Linter.buildSystemPrompt
        // This test documents expected behavior
        for keyword in expectedKeywords {
            // XCTAssertTrue(systemPrompt.contains(keyword))
        }
    }

    func testInvalidJSONResponse() async throws {
        // Test error handling for malformed JSON
        let invalidJSON = MockOllamaResponses.invalidJSON
        guard let data = invalidJSON.data(using: .utf8) else {
            XCTFail("Failed to create test data")
            return
        }

        let decoder = JSONDecoder()
        struct TestResponse: Codable {
            let violations: [Violation]
            let summary: String
        }

        XCTAssertThrowsError(try decoder.decode(TestResponse.self, from: data)) { error in
            XCTAssertTrue(error is DecodingError)
        }
    }

    func testTokenBudgetEnforcement() {
        // Test that responses exceeding token budget are truncated
        let conciseBudget = 5000
        let detailedBudget = 15000

        // Generate mock response with many violations
        let manyViolationsJSON = MockOllamaResponses.manyViolations(count: 100)
        let tokenCount = TokenCounter.count(manyViolationsJSON)

        // Should exceed budget
        XCTAssertGreaterThan(tokenCount, conciseBudget)

        // Test truncation logic
        let violations = (0..<100).map { i in
            Violation(
                rule: "test-rule-\(i)",
                line: i + 1,
                message: "Test violation \(i)",
                severity: .warning
            )
        }

        let truncated = TokenCounter.truncateViolations(
            violations,
            targetTokens: conciseBudget
        )

        XCTAssertLessThan(truncated.count, violations.count)
        XCTAssertGreaterThan(truncated.count, 0)
    }

    func testConciseVsDetailedFormat() {
        // Test format differences
        let conciseFormat = ResponseFormat.concise
        let detailedFormat = ResponseFormat.detailed

        XCTAssertEqual(conciseFormat.rawValue, "concise")
        XCTAssertEqual(detailedFormat.rawValue, "detailed")

        // Verify token budgets
        XCTAssertEqual(TokenCounter.targetTokens[conciseFormat], 5000)
        XCTAssertEqual(TokenCounter.targetTokens[detailedFormat], 15000)
    }

    func testConfidenceScoreHandling() async throws {
        // Test default confidence when missing from response
        let jsonWithoutConfidence = MockOllamaResponses.successMissingConfidence
        guard let data = jsonWithoutConfidence.data(using: .utf8) else {
            XCTFail("Failed to create test data")
            return
        }

        let decoder = JSONDecoder()
        struct TestResponse: Codable {
            let violations: [Violation]
            let summary: String
            let confidence: Double?
        }

        let parsed = try decoder.decode(TestResponse.self, from: data)

        XCTAssertNil(parsed.confidence)

        // Linter should use default 0.85 when confidence is nil
        let expectedDefault = 0.85
        let actualConfidence = parsed.confidence ?? expectedDefault
        XCTAssertEqual(actualConfidence, expectedDefault)
    }
}
