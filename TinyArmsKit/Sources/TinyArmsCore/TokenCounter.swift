import Foundation

/// Simple token counting using 4-char heuristic (matches TypeScript)
public enum TokenCounter {
    /// Approximate tokens per character (OpenAI standard)
    private static let charsPerToken: Double = 4.0

    /// Maximum response tokens (Anthropic standard)
    public static let maxResponseTokens = 25_000

    /// Target tokens by format
    public static let targetTokens: [ResponseFormat: Int] = [
        .concise: 5_000,
        .detailed: 15_000,
    ]

    /// Count tokens in text using 4-char heuristic
    public static func count(_ text: String) -> Int {
        let charCount = text.count
        return Int(ceil(Double(charCount) / charsPerToken))
    }

    /// Check if response exceeds token budget
    public static func exceedsBudget(_ tokenCount: Int, format: ResponseFormat) -> Bool {
        guard let target = targetTokens[format] else {
            return tokenCount > maxResponseTokens
        }
        return tokenCount > target
    }

    /// Truncate violations if response too large
    public static func truncateViolations(
        _ violations: [Violation],
        targetTokens: Int
    ) -> [Violation] {
        // Keep first N violations that fit within budget
        var truncated: [Violation] = []
        var currentTokens = 0

        for violation in violations {
            let encoder = JSONEncoder()
            if let data = try? encoder.encode(violation),
               let json = String(data: data, encoding: .utf8)
            {
                let violationTokens = count(json)
                if currentTokens + violationTokens <= targetTokens {
                    truncated.append(violation)
                    currentTokens += violationTokens
                } else {
                    break
                }
            }
        }

        return truncated
    }
}
