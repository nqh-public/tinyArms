# Swift Architecture Overview

## Package Structure

```
TinyArmsKit (Swift Package)
├─ Core/ (shared)
│  ├─ Protocols/
│  │  ├─ ModelClient.swift
│  │  ├─ SkillExecutor.swift
│  │  └─ Storage.swift
│  ├─ Models/
│  │  ├─ SkillResult.swift (Codable)
│  │  └─ SkillConfig.swift
│  └─ TieredRouter.swift
├─ MacOS/ (platform-specific)
│  ├─ OllamaModelClient.swift
│  ├─ FSEventsWatcher.swift
│  └─ DaemonController.swift
└─ iOS/ (platform-specific)
   ├─ CoreMLModelClient.swift
   ├─ ShareExtension.swift
   └─ ShortcutsProvider.swift
```

---

## Protocol-Based Design

### ModelClient (Platform Abstraction)

```swift
protocol ModelClient {
    func generate(prompt: String, model: String) async throws -> String
    func embed(text: String) async throws -> [Float]
}

// macOS implementation
class OllamaModelClient: ModelClient {
    func generate(prompt: String, model: String) async throws -> String {
        // HTTP call to localhost:11434
    }
}

// iOS implementation
class CoreMLModelClient: ModelClient {
    func generate(prompt: String, model: String) async throws -> String {
        // On-device Core ML inference
    }
}
```

---

## Platform Detection

```swift
#if os(macOS)
let client = OllamaModelClient()
#elseif os(iOS)
let client = CoreMLModelClient()
#endif
```

---

## Tiered Routing (Platform-Agnostic)

```swift
class TieredRouter {
    func route(input: SkillInput) async -> SkillOutput {
        // Level 0: Deterministic rules
        if let result = level0Rules.match(input) {
            return result
        }

        // Level 1: Semantic routing (embeddings)
        let intent = await embedClient.classify(input)

        // Level 2: Model inference
        if intent.confidence > 0.85 {
            return await modelClient.generate(input)
        }

        // Level 3: Deep analysis (macOS only)
        #if os(macOS)
        return await deepModelClient.generate(input)
        #else
        return .escalationRequired
        #endif
    }
}
```

---

## Storage (GRDB + CloudKit)

```swift
// Local storage
class LocalStorage: Storage {
    let db = try Database(path: "~/Library/tinyArms/db.sqlite")

    func save(_ result: SkillResult) async throws {
        try await db.write { db in
            try result.insert(db)
        }
    }
}

// Cloud sync
class CloudKitStorage: Storage {
    let container = CKContainer(identifier: "iCloud.com.tinyarms")

    func save(_ result: SkillResult) async throws {
        let record = CKRecord(result)
        try await container.publicDatabase.save(record)
    }
}
```

---

## Skill Execution

```swift
protocol SkillExecutor {
    func execute(input: SkillInput) async throws -> SkillOutput
}

// Example: CodeLintingSkill.swift
struct CodeLintingSkill: SkillExecutor {
    let router: TieredRouter

    func execute(input: SkillInput) async throws -> SkillOutput {
        return await router.route(input)
    }
}
```

---

## Activation Modes

```swift
// macOS: Daemon (always-on)
class DaemonController {
    func start() {
        FSEventsWatcher(paths: ["~/Downloads", "~/Desktop"])
            .onChange { path in
                await executeSkill(for: path)
            }
    }
}

// iOS: Share Extension (on-demand)
class ShareViewController: UIViewController {
    override func viewDidLoad() {
        let image = extractSharedImage()
        let result = await executeSkill(input: .image(image))
        showResultCard(result)
    }
}
```

---

## Platform Matrix

| Component | macOS | iOS |
|-----------|-------|-----|
| **ModelClient** | OllamaModelClient | CoreMLModelClient |
| **Activation** | FSEvents daemon | Share Extension |
| **Storage** | GRDB + CloudKit | GRDB + CloudKit |
| **UI** | Menu bar (AppKit) | Share card (SwiftUI) |
| **Models** | Qwen 3-7B | SmolLM 360M |
