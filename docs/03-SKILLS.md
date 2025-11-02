# 03 - Skills

**What each skill does (Swift/Apple ecosystem)**

---

## code-linting (macOS Only)

**Platforms**: macOS (daemon, pre-commit hooks)
**Model**: Qwen2.5-Coder-3B (Ollama)
**Speed**: 2-3s per file

**What it does**: Constitutional violations (hardcoded colors, magic numbers, file size >350 LOC)

**Structure:**
```swift
// Skills/code-linting/Sources/Executor.swift
struct CodeLintingExecutor: SkillExecutor {
    struct Input: Codable {
        let filePath: String
        let constitutionPath: String
    }

    struct Output: Codable {
        let violations: [Violation]
        let severity: Severity
    }

    func execute(_ input: Input) async throws -> Output {
        // Level 0: Swift regex rules
        let quickRules = [
            HardcodedColorRule(),
            MagicNumberRule()
        ]
        if quickRules.allMatch(input.filePath) {
            return Output(violations: [], severity: .clean)
        }

        // Level 2: Ollama Qwen
        return try await ollamaClient.lint(input)
    }
}
```

**Activation**: LaunchAgent (FSEvents on `.git/hooks/pre-commit`)

---

## visual-intelligence (macOS + iOS + iPadOS)

**Platforms**: All (Share Sheet on iOS, daemon on macOS)
**Models**:
- macOS: Qwen2-VL-2B (Ollama, 1.2GB)
- iOS: CLIP ViT-B/32 (Core ML, 340MB)

**What it does**: Screenshot OCR + semantic naming

**Structure:**
```swift
// Skills/visual-intelligence/Sources/Executor.swift
struct VisualIntelligenceExecutor: SkillExecutor {
    struct Input: Codable {
        let image: Data  // PNG/JPG bytes
    }

    struct Output: Codable {
        let ocrText: [OCRBlock]
        let suggestedName: String
        let confidence: Double
    }

    func execute(_ input: Input) async throws -> Output {
        // Level 0: File type detection
        guard isImage(input.image) else { throw .invalidInput }

        // Level 1: CLIP scene classification
        #if os(iOS)
        let embedding = try await clipEncoder.encode(input.image)
        if confidence(embedding) > 0.9 {
            return quickName(from: embedding)
        }
        #endif

        // Level 2: Full OCR + VLM
        #if os(macOS)
        return try await qwenVL.analyze(input.image)
        #else
        let ocr = try await paddleOCR.extract(input.image)
        return try await smolLM2.generateName(ocr: ocr)
        #endif
    }
}
```

**Activation**:
- macOS: FSEvents on ~/Downloads/*.png
- iOS: Share Extension (Share → tinyArms)

---

## camera-intelligence (iOS Only)

**Platforms**: iOS (live camera, no macOS equivalent)
**Model**: CLIP ViT-B/32 (Core ML, 340MB)
**Speed**: <200ms real-time

**What it does**: Point camera at whiteboard → OCR → structured notes

**Structure:**
```swift
// Skills/camera-intelligence/Sources/Executor.swift
struct CameraIntelligenceExecutor: SkillExecutor {
    struct Input: Codable {
        let livePhotoData: Data  // AVFoundation capture
    }

    struct Output: Codable {
        let extractedText: String
        let structuredNotes: [Note]
    }

    func execute(_ input: Input) async throws -> Output {
        // Vision framework (Apple native)
        let request = VNRecognizeTextRequest()
        let handler = VNImageRequestHandler(data: input.livePhotoData)
        try await handler.perform([request])

        let text = request.results?
            .compactMap { $0.topCandidates(1).first?.string }
            .joined(separator: "\n") ?? ""

        // SmolLM2 structures the text
        let notes = try await smolLM2.structure(text)
        return Output(extractedText: text, structuredNotes: notes)
    }
}
```

**Activation**: iOS app (camera button → live capture)

---

## voice-to-action (iOS Only)

**Platforms**: iOS (Shortcuts, Siri)
**Model**: SmolLM2-360M (Core ML, 250MB)
**Speed**: 1-2s

**What it does**: "Hey Siri, remind me to follow up with John" → Calendar event

**Structure:**
```swift
// Skills/voice-to-action/Sources/Executor.swift
struct VoiceToActionExecutor: SkillExecutor {
    struct Input: Codable {
        let transcript: String  // From Siri dictation
    }

    struct Output: Codable {
        let action: Action  // .reminder, .calendar, .note
        let parsedData: ActionData
    }

    func execute(_ input: Input) async throws -> Output {
        // Level 0: Keyword matching
        if input.transcript.contains("remind me") {
            return quickReminderParse(input.transcript)
        }

        // Level 2: SmolLM2 NLU
        let intent = try await smolLM2.extractIntent(input.transcript)
        return Output(
            action: intent.type,
            parsedData: intent.data
        )
    }
}
```

**Activation**: Shortcuts app (Siri → tinyArms intent)

**Intent definition:**
```swift
// VoiceToActionIntent.intentdefinition (Xcode)
intent VoiceToActionIntent {
    title: "Create Action from Voice"
    parameter transcript: String
    output action: Action
}
```

---

## privacy-redaction (macOS + iOS)

**Platforms**: All (pre-share on iOS, pre-commit on macOS)
**Model**: GLiNER-base (Core ML, 400MB)
**Speed**: <300ms

**What it does**: Auto-blur emails/API keys in screenshots before sharing

**Structure:**
```swift
// Skills/privacy-redaction/Sources/Executor.swift
struct PrivacyRedactionExecutor: SkillExecutor {
    struct Input: Codable {
        let image: Data
    }

    struct Output: Codable {
        let redactedImage: Data
        let detections: [PIIDetection]
    }

    func execute(_ input: Input) async throws -> Output {
        // Level 0: Regex patterns (emails, phones)
        let regexDetections = RegexPIIDetector.scan(input.image)

        // Level 1: GLiNER NER (names, locations)
        let nerDetections = try await gliner.detect(input.image)

        // Blur bounding boxes
        var image = UIImage(data: input.image)!
        for detection in regexDetections + nerDetections {
            image = image.blur(rect: detection.bbox)
        }

        return Output(
            redactedImage: image.pngData()!,
            detections: regexDetections + nerDetections
        )
    }
}
```

**Activation**:
- iOS: Before Share Sheet opens (intercept)
- macOS: LaunchAgent hook on screenshot command

---

## Skill Comparison: Platforms

| Skill | macOS | iOS | iPadOS | Unique Feature |
|-------|-------|-----|--------|----------------|
| **code-linting** | ✅ | ❌ | ❌ | Pre-commit hooks |
| **visual-intelligence** | ✅ | ✅ | ✅ | Cross-platform sync |
| **camera-intelligence** | ❌ | ✅ | ✅ | Live camera OCR |
| **voice-to-action** | ❌ | ✅ | ✅ | Siri integration |
| **privacy-redaction** | ✅ | ✅ | ✅ | Auto-blur PII |

---

## Configuration (Swift)

**No YAML** - Skills use Swift Codable + UserDefaults:

```swift
// TinyArmsKit/Sources/Config/SkillConfig.swift
struct SkillConfig: Codable {
    let name: String
    let model: ModelIdentifier
    let activation: ActivationMode
    let schedule: Schedule?

    enum ActivationMode: String, Codable {
        case daemon      // macOS LaunchAgent
        case shareSheet  // iOS Share Extension
        case shortcuts   // iOS Siri
        case manual      // User-triggered
    }
}

// Storage
@AppStorage("skills.code-linting.config")
var codeLintingConfig: SkillConfig = .default
```

**Platform detection:**
```swift
#if os(macOS)
config.activation = .daemon
config.model = .qwen25Coder3B  // Ollama
#elseif os(iOS)
config.activation = .shareSheet
config.model = .smolLM2_360M   // Core ML
#endif
```

---

**Next Steps**:

1. **macOS**: Build code-linting skill (Phase 1)
2. **iOS**: Build visual-intelligence Share Extension (Phase 3)
3. **Platform guide**: See 02-MACOS-DAEMON.md, 03-IOS-PLATFORM.md (Batch 4)
