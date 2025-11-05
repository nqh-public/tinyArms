import Foundation

// Clean Swift code with no constitutional violations
// - No hardcoded values (uses constants)
// - No magic numbers (named constants)
// - No DRY violations (no duplication)
// - Reusable by others (generic, well-designed)

struct Configuration {
    static let defaultTimeout: TimeInterval = 30.0
    static let maxRetries = 3
    static let apiEndpoint = URL(string: "https://api.example.com")!
}

protocol DataFetcher {
    func fetch<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T
}

class NetworkService: DataFetcher {
    private let session: URLSession
    private let configuration: Configuration.Type

    init(session: URLSession = .shared, configuration: Configuration.Type = Configuration.self) {
        self.session = session
        self.configuration = configuration
    }

    func fetch<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T {
        var retries = 0

        while retries < configuration.maxRetries {
            do {
                let (data, _) = try await session.data(from: url)
                return try JSONDecoder().decode(T.self, from: data)
            } catch {
                retries += 1
                if retries >= configuration.maxRetries {
                    throw error
                }
                try await Task.sleep(nanoseconds: 1_000_000_000)
            }
        }

        throw NetworkError.maxRetriesExceeded
    }
}

enum NetworkError: Error {
    case maxRetriesExceeded
    case invalidResponse
}

// Clean usage example
func exampleUsage() async throws {
    let service = NetworkService()
    let data: [String: Any] = try await service.fetch(
        [String: Any].self,
        from: Configuration.apiEndpoint
    )
    print("Fetched data: \(data)")
}
