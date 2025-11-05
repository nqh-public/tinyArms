import Foundation
import TinyArmsCore

/// Main daemon controller (singleton)
@MainActor
public class DaemonController: ObservableObject {
    public static let shared = DaemonController()

    @Published public private(set) var isRunning = false
    @Published public private(set) var recentResults: [LintResult] = []

    private var fileWatcher: FSEventsWatcher?
    private var linter: Linter?
    private var watchedPaths: [String] = []
    private var allowedExtensions: Set<String> = []

    private init() {
        setupConfiguration()
    }

    // MARK: - Configuration

    private func setupConfiguration() {
        // Default watched paths
        watchedPaths = [
            "~/Downloads",
            "~/Desktop",
            "~/Documents",
        ]

        // Allowed file extensions
        allowedExtensions = [
            "swift",
            "ts",
            "tsx",
            "js",
            "jsx",
            "py",
            "go",
            "rs",
            "java",
        ]
    }

    // MARK: - Lifecycle

    public func start() async throws {
        guard !isRunning else { return }

        // Create Ollama client and linter
        let client = OllamaClient(modelName: "qwen2.5-coder:3b-instruct")
        linter = Linter(client: client)

        // Check Ollama availability
        let available = await client.isAvailable()
        guard available else {
            throw DaemonError.ollamaUnavailable
        }

        // Create file watcher with debounced callback
        fileWatcher = FSEventsWatcher(latency: 0.5) { [weak self] event in
            Task { @MainActor in
                await self?.handleFileEvent(event)
            }
        }

        // Start watching
        try await fileWatcher?.watch(paths: watchedPaths)

        isRunning = true
        print("tinyArms daemon started")
        print("Watching: \(watchedPaths.joined(separator: ", "))")
    }

    public func stop() {
        fileWatcher?.stop()
        fileWatcher = nil
        linter = nil
        isRunning = false
        print("tinyArms daemon stopped")
    }

    // MARK: - File Event Handling

    private func handleFileEvent(_ event: FileEvent) async {
        // Only process file modifications
        guard event.isModified, event.isFile else { return }

        // Check file extension
        let fileExtension = (event.path as NSString).pathExtension
        guard allowedExtensions.contains(fileExtension) else { return }

        print("File modified: \(event.path)")

        // Lint the file
        await lintFile(path: event.path)
    }

    private func lintFile(path: String) async {
        guard let linter = linter else { return }

        do {
            // Read file
            let code = try String(contentsOfFile: path, encoding: .utf8)

            // Load constitution
            let constitution = try ConstitutionLoader.load()

            // Lint
            let result = try await linter.lint(
                code: code,
                constitution: constitution,
                format: .concise  // Use concise for daemon (faster)
            )

            // Store result
            recentResults.insert(result, at: 0)
            if recentResults.count > 10 {
                recentResults.removeLast()
            }

            // Show notification if violations found
            if !result.violations.isEmpty {
                await showNotification(
                    title: "Constitutional Violations",
                    message: "\(result.violations.count) violation(s) in \((path as NSString).lastPathComponent)"
                )
            }

            print("Linted \(path): \(result.violations.count) violation(s)")
        } catch {
            print("Error linting \(path): \(error.localizedDescription)")
        }
    }

    // MARK: - Notifications

    private func showNotification(title: String, message: String) async {
        #if os(macOS)
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = message
            content.sound = .default

            let request = UNNotificationRequest(
                identifier: UUID().uuidString,
                content: content,
                trigger: nil
            )

            do {
                try await UNUserNotificationCenter.current().add(request)
            } catch {
                print("Failed to show notification: \(error)")
            }
        #endif
    }

    // MARK: - Manual Lint

    public func lintFileManually(path: String) async throws -> LintResult {
        guard let linter = linter else {
            throw DaemonError.notRunning
        }

        let code = try String(contentsOfFile: path, encoding: .utf8)
        let constitution = try ConstitutionLoader.load()

        let result = try await linter.lint(
            code: code,
            constitution: constitution,
            format: .detailed
        )

        recentResults.insert(result, at: 0)
        if recentResults.count > 10 {
            recentResults.removeLast()
        }

        return result
    }
}

// MARK: - DaemonError

public enum DaemonError: Error {
    case notRunning
    case ollamaUnavailable
}

extension DaemonError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .notRunning:
            return "Daemon is not running"
        case .ollamaUnavailable:
            return "Ollama is not available. Please start Ollama and try again."
        }
    }
}
