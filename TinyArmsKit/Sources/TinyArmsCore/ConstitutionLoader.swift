import Foundation

/// Loads constitutional principles from markdown files
public enum ConstitutionLoader {
    /// Default constitution path
    private static let defaultPath = "~/.tinyarms/principles.md"

    /// Load constitution from file (custom or default path)
    public static func load(customPath: String? = nil) throws -> String {
        let path = customPath ?? defaultPath
        let expandedPath = NSString(string: path).expandingTildeInPath

        guard FileManager.default.fileExists(atPath: expandedPath) else {
            throw TinyArmsError.constitutionNotFound(expandedPath)
        }

        do {
            return try String(contentsOfFile: expandedPath, encoding: .utf8)
        } catch {
            throw TinyArmsError.fileReadError(error.localizedDescription)
        }
    }

    /// Load and truncate constitution to fit context window (2000 chars = ~500 tokens)
    public static func loadTruncated(
        customPath: String? = nil,
        maxChars: Int = 2000
    ) throws -> String {
        let content = try load(customPath: customPath)
        return String(content.prefix(maxChars))
    }
}
