import ArgumentParser
import Foundation
import TinyArmsCore

@main
struct TinyArmsCLI: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "tinyarms-cli",
        abstract: "Constitutional code linter using local AI models",
        version: "0.2.0"
    )

    @Argument(help: "File to lint")
    var file: String

    @Option(name: .long, help: "Path to constitution file (default: ~/.tinyarms/principles.md)")
    var constitution: String?

    @Option(name: .long, help: "Response format: concise or detailed")
    var format: String = "detailed"

    @Option(name: .long, help: "Model to use for linting")
    var model: String = "qwen2.5-coder:3b-instruct"

    @Option(name: .long, help: "Ollama base URL")
    var ollamaUrl: String = "http://localhost:11434"

    func run() async throws {
        // Validate format
        guard let responseFormat = ResponseFormat(rawValue: format) else {
            print("Error: Invalid format '\(format)'. Use 'concise' or 'detailed'.", to: &stderr)
            throw ExitCode.failure
        }

        // Expand file path
        let expandedPath = NSString(string: file).expandingTildeInPath

        // Check if file exists
        guard FileManager.default.fileExists(atPath: expandedPath) else {
            print("Error: File not found: \(expandedPath)", to: &stderr)
            throw ExitCode.failure
        }

        // Read file content
        let code: String
        do {
            code = try String(contentsOfFile: expandedPath, encoding: .utf8)
        } catch {
            print("Error: Could not read file: \(error.localizedDescription)", to: &stderr)
            throw ExitCode.failure
        }

        // Load constitution
        let constitution: String
        do {
            constitution = try ConstitutionLoader.load(customPath: self.constitution)
        } catch let error as TinyArmsError {
            print("Error: \(error.localizedDescription)", to: &stderr)
            throw ExitCode.failure
        }

        // Create Ollama client and linter
        let client = OllamaClient(modelName: model, baseURL: ollamaUrl)
        let linter = Linter(client: client)

        // Check Ollama availability
        let isAvailable = await client.isAvailable()
        if !isAvailable {
            print(
                """
                Error: Cannot connect to Ollama at \(ollamaUrl)

                Please ensure:
                1. Ollama is installed: https://ollama.com
                2. Ollama is running: ollama serve
                3. Model is pulled: ollama pull \(model)
                """,
                to: &stderr
            )
            throw ExitCode.failure
        }

        // Run linting
        print("Linting \(file) with \(model)...", to: &stderr)

        let result: LintResult
        do {
            result = try await linter.lint(
                code: code,
                constitution: constitution,
                format: responseFormat
            )
        } catch let error as TinyArmsError {
            print("Error: \(error.localizedDescription)", to: &stderr)
            throw ExitCode.failure
        }

        // Output JSON to stdout
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let jsonData = try encoder.encode(result)
        let jsonString = String(data: jsonData, encoding: .utf8)!
        print(jsonString)

        // Log summary to stderr
        print(
            """

            Summary: \(result.violations.count) violation(s) found
            Latency: \(result.latencyMs)ms
            Confidence: \(String(format: "%.2f", result.confidence))
            Tokens: \(result.tokenCount ?? 0)
            """,
            to: &stderr
        )

        // Exit with code 1 if violations found
        if !result.violations.isEmpty {
            throw ExitCode.failure
        }
    }
}

// MARK: - stderr printing

private var stderr = StandardErrorOutputStream()

struct StandardErrorOutputStream: TextOutputStream {
    mutating func write(_ string: String) {
        FileHandle.standardError.write(Data(string.utf8))
    }
}
