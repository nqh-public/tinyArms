import Foundation
import XCTest

/// Helper utilities for testing
extension XCTestCase {
    /// Create a temporary file with content
    func createTempFile(_ content: String, ext: String = "swift") -> String {
        let tempDir = NSTemporaryDirectory()
        let filename = "\(UUID().uuidString).\(ext)"
        let path = (tempDir as NSString).appendingPathComponent(filename)
        try! content.write(toFile: path, atomically: true, encoding: .utf8)
        addTeardownBlock {
            try? FileManager.default.removeItem(atPath: path)
        }
        return path
    }

    /// Create a temporary directory
    func createTempDirectory() -> String {
        let tempDir = NSTemporaryDirectory()
        let dirname = UUID().uuidString
        let path = (tempDir as NSString).appendingPathComponent(dirname)
        try! FileManager.default.createDirectory(atPath: path, withIntermediateDirectories: true)
        addTeardownBlock {
            try? FileManager.default.removeItem(atPath: path)
        }
        return path
    }

    /// Delete a temporary file (if not using addTeardownBlock)
    func deleteTempFile(_ path: String) {
        try? FileManager.default.removeItem(atPath: path)
    }

    /// Create a mock URLSession with custom request handler
    func createMockSession(
        handler: @escaping (URLRequest) throws -> (HTTPURLResponse, Data)
    ) -> URLSession {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        MockURLProtocol.requestHandler = handler
        return URLSession(configuration: config)
    }

    /// Create a mock HTTPURLResponse
    func createMockHTTPResponse(
        url: URL,
        statusCode: Int,
        headers: [String: String]? = nil
    ) -> HTTPURLResponse {
        HTTPURLResponse(
            url: url,
            statusCode: statusCode,
            httpVersion: "HTTP/1.1",
            headerFields: headers
        )!
    }

    /// Wait for async operation with timeout
    func waitForAsync<T>(
        _ operation: @escaping () async throws -> T,
        timeout: TimeInterval = 5,
        file: StaticString = #file,
        line: UInt = #line
    ) async throws -> T {
        return try await withThrowingTaskGroup(of: T.self) { group in
            group.addTask {
                try await operation()
            }

            group.addTask {
                try await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                throw TimeoutError()
            }

            guard let result = try await group.next() else {
                throw TimeoutError()
            }

            group.cancelAll()
            return result
        }
    }
}

/// Timeout error for async operations
struct TimeoutError: Error, LocalizedError {
    var errorDescription: String? {
        return "Operation timed out"
    }
}
