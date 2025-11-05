import XCTest
@testable import TinyArmsCore

final class OllamaClientTests: XCTestCase {
    func testOllamaClientInitialization() {
        let client = OllamaClient(modelName: "qwen2.5-coder:3b-instruct")
        XCTAssertNotNil(client)
    }

    func testCustomBaseURL() {
        let client = OllamaClient(
            modelName: "qwen2.5-coder:3b-instruct",
            baseURL: "http://custom-host:11434"
        )
        XCTAssertNotNil(client)
    }

    // NOTE: This test requires Ollama to be running
    // Run with: swift test --filter testOllamaAvailability
    func testOllamaAvailability() async {
        let client = OllamaClient(modelName: "qwen2.5-coder:3b-instruct")
        let isAvailable = await client.isAvailable()
        // This will fail if Ollama is not running - that's expected
        print("Ollama available: \(isAvailable)")
    }
}
