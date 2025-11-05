import XCTest
@testable import TinyArmsCore

final class ConstitutionLoaderTests: XCTestCase {
    func testLoadNonExistentFile() {
        XCTAssertThrowsError(
            try ConstitutionLoader.load(customPath: "/tmp/nonexistent-file.md")
        ) { error in
            XCTAssertTrue(error is TinyArmsError)
            if case .constitutionNotFound = error as? TinyArmsError {
                // Expected error
            } else {
                XCTFail("Wrong error type: \(error)")
            }
        }
    }

    func testLoadTruncated() throws {
        // Create temp constitution file
        let tempFile = "/tmp/test-constitution.md"
        let content = String(repeating: "Test principle\n", count: 200)  // ~2800 chars
        try content.write(toFile: tempFile, atomically: true, encoding: .utf8)

        // Load truncated (should be max 2000 chars)
        let truncated = try ConstitutionLoader.loadTruncated(customPath: tempFile)
        XCTAssertLessThanOrEqual(truncated.count, 2000)

        // Cleanup
        try? FileManager.default.removeItem(atPath: tempFile)
    }

    func testLoadFullContent() throws {
        // Create temp constitution file
        let tempFile = "/tmp/test-constitution-full.md"
        let content = "# Test Constitution\n\nPrinciple 1: Test"
        try content.write(toFile: tempFile, atomically: true, encoding: .utf8)

        // Load full content
        let loaded = try ConstitutionLoader.load(customPath: tempFile)
        XCTAssertEqual(loaded, content)

        // Cleanup
        try? FileManager.default.removeItem(atPath: tempFile)
    }
}
