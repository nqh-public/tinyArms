import Foundation

/// Actor-based Ollama HTTP client with Swift 6 concurrency
public actor OllamaClient {
    private let modelName: String
    private let baseURL: URL
    private let session: URLSession

    public init(modelName: String, baseURL: String = "http://localhost:11434") {
        self.modelName = modelName
        self.baseURL = URL(string: baseURL)!

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.httpMaximumConnectionsPerHost = 5
        self.session = URLSession(configuration: config)
    }

    /// Generate text from prompt (non-streaming, JSON format)
    public func generate(system: String, prompt: String) async throws -> String {
        let endpoint = baseURL.appendingPathComponent("/api/generate")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = OllamaGenerateRequest(
            model: modelName,
            prompt: prompt,
            system: system,
            stream: false,
            format: "json"
        )

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw TinyArmsError.ollamaConnectionFailed
            }

            switch httpResponse.statusCode {
            case 200:
                let decoder = JSONDecoder()
                let result = try decoder.decode(OllamaGenerateResponse.self, from: data)
                return result.response

            case 404:
                throw TinyArmsError.ollamaModelNotFound(modelName)

            default:
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                throw TinyArmsError.ollamaGenerationFailed(
                    "HTTP \(httpResponse.statusCode): \(errorMessage)"
                )
            }
        } catch let error as TinyArmsError {
            throw error
        } catch {
            // Network errors (connection refused, timeout, etc.)
            throw TinyArmsError.ollamaConnectionFailed
        }
    }

    /// Check if Ollama is available
    public func isAvailable() async -> Bool {
        let endpoint = baseURL.appendingPathComponent("/api/tags")

        var request = URLRequest(url: endpoint)
        request.httpMethod = "GET"
        request.timeoutInterval = 5

        do {
            let (_, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                return false
            }
            return httpResponse.statusCode == 200
        } catch {
            return false
        }
    }
}
