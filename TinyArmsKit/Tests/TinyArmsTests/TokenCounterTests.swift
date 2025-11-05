import XCTest
@testable import TinyArmsCore

final class TokenCounterTests: XCTestCase {
    func testTokenCounting() {
        let text = "Hello, world!"  // 13 chars
        let tokens = TokenCounter.count(text)
        // 13 / 4 = 3.25, ceil = 4 tokens
        XCTAssertEqual(tokens, 4)
    }

    func testLargeTextTokenCount() {
        let text = String(repeating: "a", count: 1000)  // 1000 chars
        let tokens = TokenCounter.count(text)
        // 1000 / 4 = 250 tokens
        XCTAssertEqual(tokens, 250)
    }

    func testExceedsBudgetConcise() {
        let exceedsLimit = TokenCounter.exceedsBudget(6000, format: .concise)
        XCTAssertTrue(exceedsLimit)  // 6000 > 5000

        let withinLimit = TokenCounter.exceedsBudget(4000, format: .concise)
        XCTAssertFalse(withinLimit)  // 4000 <= 5000
    }

    func testExceedsBudgetDetailed() {
        let exceedsLimit = TokenCounter.exceedsBudget(16000, format: .detailed)
        XCTAssertTrue(exceedsLimit)  // 16000 > 15000

        let withinLimit = TokenCounter.exceedsBudget(14000, format: .detailed)
        XCTAssertFalse(withinLimit)  // 14000 <= 15000
    }

    func testTruncateViolations() {
        let violations = [
            Violation(
                rule: "test-rule",
                line: 1,
                message: "Test violation 1",
                severity: .error
            ),
            Violation(
                rule: "test-rule",
                line: 2,
                message: "Test violation 2",
                severity: .warning
            ),
            Violation(
                rule: "test-rule",
                line: 3,
                message: "Test violation 3",
                severity: .error
            ),
        ]

        // Truncate to very small budget (should keep at least 1)
        let truncated = TokenCounter.truncateViolations(violations, targetTokens: 50)
        XCTAssertGreaterThan(truncated.count, 0)
        XCTAssertLessThanOrEqual(truncated.count, violations.count)
    }
}
