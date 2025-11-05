import Foundation

/// Catalog of mock Ollama API responses for testing
enum MockOllamaResponses {
    /// Successful response with violations
    static let successWithViolations = """
    {
      "violations": [
        {
          "rule": "architecture-first",
          "line": 10,
          "message": "Custom solution without npm search",
          "severity": "error",
          "principle": "Principle III: Architecture-First Development",
          "constitutionalRef": "~/.tinyarms/principles.md:151-202",
          "fix": {
            "action": "Search npm for existing solution",
            "suggestions": ["Use lodash.debounce", "Use use-debounce hook"],
            "example": "See packages/core/utils.ts:1-50"
          }
        },
        {
          "rule": "dry-violation",
          "line": 25,
          "message": "Duplicated logic appears 3+ times",
          "severity": "warning",
          "principle": "Principle XVII: Pragmatic Atomic Composability"
        }
      ],
      "summary": "Found 2 violations of constitutional principles",
      "confidence": 0.92
    }
    """

    /// Successful response with no violations
    static let successNoViolations = """
    {
      "violations": [],
      "summary": "No violations found. Code follows constitutional principles.",
      "confidence": 0.98
    }
    """

    /// Response with missing confidence (should use default 0.85)
    static let successMissingConfidence = """
    {
      "violations": [],
      "summary": "No violations found"
    }
    """

    /// Invalid JSON (syntax error)
    static let invalidJSON = """
    {
      "violations": [
        {
          "rule": "test",
          "line": 1,
          // INVALID: comment in JSON
        }
      ]
    }
    """

    /// Malformed structure (violations not an array)
    static let malformedStructure = """
    {
      "violations": "not an array",
      "summary": 123
    }
    """

    /// Response with many violations (for truncation testing)
    static func manyViolations(count: Int) -> String {
        let violations = (0..<count).map { i in
            """
            {
              "rule": "test-rule-\(i)",
              "line": \(i + 1),
              "message": "Test violation \(i)",
              "severity": "warning"
            }
            """
        }.joined(separator: ",\n")

        return """
        {
          "violations": [\(violations)],
          "summary": "Found \(count) violations",
          "confidence": 0.85
        }
        """
    }

    /// Ollama /api/tags response (for availability check)
    static let tagsResponse = """
    {
      "models": [
        {
          "name": "qwen2.5-coder:3b-instruct",
          "modified_at": "2025-01-01T00:00:00Z",
          "size": 1900000000
        }
      ]
    }
    """
}
