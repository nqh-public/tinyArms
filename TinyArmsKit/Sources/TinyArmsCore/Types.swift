import Foundation

// MARK: - Response Format

public enum ResponseFormat: String, Codable, Sendable {
    case concise
    case detailed
}

// MARK: - Lint Result

public struct LintResult: Codable, Sendable {
    public let violations: [Violation]
    public let summary: String
    public let confidence: Double
    public let model: String
    public let latencyMs: Int
    public let tokenCount: Int?
    public let format: ResponseFormat

    public init(
        violations: [Violation],
        summary: String,
        confidence: Double,
        model: String,
        latencyMs: Int,
        tokenCount: Int?,
        format: ResponseFormat
    ) {
        self.violations = violations
        self.summary = summary
        self.confidence = confidence
        self.model = model
        self.latencyMs = latencyMs
        self.tokenCount = tokenCount
        self.format = format
    }
}

// MARK: - Violation

public struct Violation: Codable, Sendable, Identifiable {
    public let id: UUID
    public let rule: String
    public let line: Int
    public let message: String
    public let severity: Severity
    public let principle: String?
    public let constitutionalRef: String?
    public let fix: Fix?

    public init(
        id: UUID = UUID(),
        rule: String,
        line: Int,
        message: String,
        severity: Severity,
        principle: String? = nil,
        constitutionalRef: String? = nil,
        fix: Fix? = nil
    ) {
        self.id = id
        self.rule = rule
        self.line = line
        self.message = message
        self.severity = severity
        self.principle = principle
        self.constitutionalRef = constitutionalRef
        self.fix = fix
    }
}

// MARK: - Severity

public enum Severity: String, Codable, Sendable {
    case error
    case warning
}

// MARK: - Fix

public struct Fix: Codable, Sendable {
    public let action: String
    public let suggestions: [String]
    public let example: String?

    public init(action: String, suggestions: [String], example: String? = nil) {
        self.action = action
        self.suggestions = suggestions
        self.example = example
    }
}

// MARK: - Ollama Request/Response

struct OllamaGenerateRequest: Codable, Sendable {
    let model: String
    let prompt: String
    let system: String
    let stream: Bool
    let format: String
}

struct OllamaGenerateResponse: Codable, Sendable {
    let response: String
}

// MARK: - Errors

public enum TinyArmsError: Error, Sendable {
    case ollamaConnectionFailed
    case ollamaModelNotFound(String)
    case ollamaGenerationFailed(String)
    case constitutionNotFound(String)
    case invalidJSONResponse(String)
    case fileNotFound(String)
    case fileReadError(String)
}

extension TinyArmsError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .ollamaConnectionFailed:
            return "Failed to connect to Ollama. Is it running on localhost:11434?"
        case .ollamaModelNotFound(let model):
            return "Model '\(model)' not found. Run: ollama pull \(model)"
        case .ollamaGenerationFailed(let message):
            return "Ollama generation failed: \(message)"
        case .constitutionNotFound(let path):
            return "Constitution file not found: \(path)"
        case .invalidJSONResponse(let message):
            return "Invalid JSON response: \(message)"
        case .fileNotFound(let path):
            return "File not found: \(path)"
        case .fileReadError(let message):
            return "File read error: \(message)"
        }
    }
}
