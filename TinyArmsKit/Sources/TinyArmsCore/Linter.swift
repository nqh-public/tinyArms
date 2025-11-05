import Foundation

/// Constitutional code linter using Ollama
public actor Linter {
    private let client: OllamaClient
    private static let defaultConfidence = 0.85
    private static let constitutionExcerptChars = 2000

    public init(client: OllamaClient) {
        self.client = client
    }

    /// Lint code against constitutional principles
    public func lint(
        code: String,
        constitution: String,
        format: ResponseFormat = .detailed
    ) async throws -> LintResult {
        let startTime = Date()

        let systemPrompt = buildSystemPrompt(constitution: constitution, format: format)
        let userPrompt = buildUserPrompt(code: code)

        let rawResponse = try await client.generate(system: systemPrompt, prompt: userPrompt)

        // Parse JSON response
        guard let data = rawResponse.data(using: .utf8) else {
            throw TinyArmsError.invalidJSONResponse("Could not convert response to UTF-8")
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        do {
            let parsed = try decoder.decode(LinterResponse.self, from: data)

            let latencyMs = Int(Date().timeIntervalSince(startTime) * 1000)
            let tokenCount = TokenCounter.count(rawResponse)

            var violations = parsed.violations
            let confidence = parsed.confidence ?? Self.defaultConfidence

            // Enforce token budget
            if TokenCounter.exceedsBudget(tokenCount, format: format) {
                let targetTokens = TokenCounter.targetTokens[format] ?? TokenCounter.maxResponseTokens
                violations = TokenCounter.truncateViolations(violations, targetTokens: targetTokens)
            }

            return LintResult(
                violations: violations,
                summary: parsed.summary,
                confidence: confidence,
                model: "qwen2.5-coder:3b-instruct",
                latencyMs: latencyMs,
                tokenCount: tokenCount,
                format: format
            )
        } catch {
            throw TinyArmsError.invalidJSONResponse(
                "Failed to parse JSON: \(error.localizedDescription)"
            )
        }
    }

    // MARK: - Prompt Construction (Exact TypeScript Logic)

    private func buildSystemPrompt(constitution: String, format: ResponseFormat) -> String {
        // Truncate constitution to fit context window
        let excerpt = String(constitution.prefix(Self.constitutionExcerptChars))

        let verbosityGuidance = format == .concise
            ? "Return minimal JSON (summary + violation count only)."
            : "Return detailed JSON with actionable fixes and constitutional references."

        return """
        You are a constitutional code linter focusing on principles NOT enforced by automated tools.

        FOCUS ON:
        1. **Principle III: Architecture-First Development**: Did developer search npm/GitHub first or invent custom solution?
        2. **Principle XVII: Pragmatic Atomic Composability (DRY)**: Same logic/pattern appears 3+ times without extraction
        3. **Principle I: Universal Reusability**: Is this code reusable by others or too app-specific?
        4. **Principle IV: Zero Invention Policy**: New patterns without approval (design tokens, conventions)

        Design principles excerpt (full version at ~/.tinyarms/principles.md):
        \(excerpt)

        IGNORE (pre-commit already handles):
        - TypeScript errors
        - ESLint import aliases
        - File size >350 LOC
        - Prettier formatting

        \(verbosityGuidance)

        Return JSON format:
        {
          "violations": [
            {
              "rule": "architecture-first" | "dry-violation" | "universal-reusability" | "zero-invention",
              "line": <line_number>,
              "message": "<specific issue>",
              "severity": "error" | "warning",
              "principle": "Principle III: Architecture-First Development",
              "constitutionalRef": "~/.tinyarms/principles.md:151-202",
              "fix": {
                "action": "<what to do>",
                "suggestions": ["<specific fix 1>", "<specific fix 2>"],
                "example": "See packages/i18n/core/detector.ts:1-298"
              }
            }
          ],
          "summary": "<1-2 sentence overview>",
          "confidence": <0.0-1.0>
        }
        """
    }

    private func buildUserPrompt(code: String) -> String {
        return """
        Analyze this code for constitutional violations:

        ```
        \(code)
        ```

        Return JSON with violations found. If no violations, return empty violations array.
        """
    }
}

// MARK: - Linter Response (Internal)

private struct LinterResponse: Codable {
    let violations: [Violation]
    let summary: String
    let confidence: Double?
}
