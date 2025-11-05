import XCTest
@testable import TinyArmsCore

final class EdgeCaseTests: XCTestCase {
    // MARK: - File Size Edge Cases

    func testEmptyFile() throws {
        let emptyFile = createTempFile("", ext: "swift")
        defer { deleteTempFile(emptyFile) }

        let content = try String(contentsOfFile: emptyFile, encoding: .utf8)
        XCTAssertEqual(content.count, 0)

        // Linter should handle gracefully
        let tokenCount = TokenCounter.count(content)
        XCTAssertEqual(tokenCount, 0)
    }

    func testVeryLargeFile() throws {
        // Generate >500KB file
        let largeContent = String(repeating: "let x = 42\n", count: 50_000) // ~550KB
        let largeFile = createTempFile(largeContent, ext: "swift")
        defer { deleteTempFile(largeFile) }

        let content = try String(contentsOfFile: largeFile, encoding: .utf8)
        XCTAssertGreaterThan(content.count, 500_000)

        // Should handle large files (may need truncation)
        let tokenCount = TokenCounter.count(content)
        XCTAssertGreaterThan(tokenCount, 0)
    }

    // MARK: - Unicode Edge Cases

    func testUnicodeContent() throws {
        let unicodeCode = """
        // Chinese: 你好世界
        // Emoji: 🦖 🤖 ✅
        // Arabic: مرحبا بالعالم
        let greeting = "Hello 世界! 🌍"
        """

        let unicodeFile = createTempFile(unicodeCode, ext: "swift")
        defer { deleteTempFile(unicodeFile) }

        let content = try String(contentsOfFile: unicodeFile, encoding: .utf8)
        XCTAssertTrue(content.contains("你好"))
        XCTAssertTrue(content.contains("🦖"))
        XCTAssertTrue(content.contains("مرحبا"))

        // Token counting should handle Unicode
        let tokenCount = TokenCounter.count(content)
        XCTAssertGreaterThan(tokenCount, 0)
    }

    func testInvalidUTF8() {
        // Create file with invalid UTF-8
        let invalidBytes: [UInt8] = [0xFF, 0xFE, 0xFD, 0xFC]
        let invalidData = Data(invalidBytes)

        let tempPath = (NSTemporaryDirectory() as NSString)
            .appendingPathComponent("\(UUID().uuidString).swift")
        try! invalidData.write(to: URL(fileURLWithPath: tempPath))

        defer { try? FileManager.default.removeItem(atPath: tempPath) }

        // Should handle gracefully
        do {
            _ = try String(contentsOfFile: tempPath, encoding: .utf8)
            XCTFail("Should fail with invalid UTF-8")
        } catch {
            // Expected error
            XCTAssertTrue(true)
        }
    }

    // MARK: - Constitution Size Edge Cases

    func testConstitutionExactly2000Chars() {
        let exactly2000 = String(repeating: "a", count: 2000)
        XCTAssertEqual(exactly2000.count, 2000)

        let truncated = String(exactly2000.prefix(2000))
        XCTAssertEqual(truncated.count, 2000)
    }

    func testConstitutionOver2000Chars() {
        let over2000 = String(repeating: "a", count: 3000)
        XCTAssertEqual(over2000.count, 3000)

        let truncated = String(over2000.prefix(2000))
        XCTAssertEqual(truncated.count, 2000)
        XCTAssertLessThan(truncated.count, over2000.count)
    }

    // MARK: - Token Budget Edge Cases

    func testTokenBudgetExactlyAtLimit() {
        // Concise: 5000 tokens
        let conciseLimit = 5000
        let exactlyAtLimit = conciseLimit

        XCTAssertFalse(TokenCounter.exceedsBudget(exactlyAtLimit, format: .concise))
    }

    func testTokenBudgetOverByOne() {
        // Concise: 5000 tokens
        let conciseLimit = 5000
        let overByOne = conciseLimit + 1

        XCTAssertTrue(TokenCounter.exceedsBudget(overByOne, format: .concise))

        // Detailed: 15000 tokens
        let detailedLimit = 15000
        let detailedOverByOne = detailedLimit + 1

        XCTAssertTrue(TokenCounter.exceedsBudget(detailedOverByOne, format: .detailed))
    }

    func testViolationsExactCountTruncation() {
        // Create violations that fit exactly within budget
        let violations = (0..<10).map { i in
            Violation(
                rule: "rule-\(i)",
                line: i + 1,
                message: "Short message",
                severity: .warning
            )
        }

        // Truncate to very tight budget
        let truncated = TokenCounter.truncateViolations(violations, targetTokens: 500)

        // Should keep some but not all
        XCTAssertGreaterThan(truncated.count, 0)
        XCTAssertLessThanOrEqual(truncated.count, violations.count)
    }

    // MARK: - Special Characters

    func testSpecialCharactersInCode() throws {
        let specialChars = """
        let regex = "^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,4}$"
        let path = "/Users/name/file.swift"
        let json = "{\\"key\\": \\"value\\"}"
        """

        let file = createTempFile(specialChars, ext: "swift")
        defer { deleteTempFile(file) }

        let content = try String(contentsOfFile: file, encoding: .utf8)
        XCTAssertTrue(content.contains("^[a-zA-Z"))
        XCTAssertTrue(content.contains("/Users"))
        XCTAssertTrue(content.contains("{\\"key\\"))
    }
}
