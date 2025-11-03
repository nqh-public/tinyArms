# iOS Platform Guide

**Status**: Implementation guide for iOS app
**Platform**: iOS 18.0+
**Tech**: SwiftUI, Share Extension, Core ML, Shortcuts

---

## Architecture

```
User Action
  ↓
┌─────────────────┬─────────────────┬──────────────────┐
│ Share Extension │ Shortcuts App   │ Main App         │
│ (images/text)   │ (Siri voice)    │ (manual trigger) │
└─────────────────┴─────────────────┴──────────────────┘
  ↓
TinyArmsKit (shared logic)
  ↓
CoreMLModelClient (on-device inference)
  ↓
SkillExecutor → Result
  ↓
┌─────────────────┬─────────────────┐
│ CloudKit Sync   │ Local Storage   │
└─────────────────┴─────────────────┘
```

---

## Share Extension

### Extension Setup

```swift
// ShareViewController.swift
import UIKit
import TinyArmsKit

class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        Task {
            // Extract shared content
            guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
                  let provider = item.attachments?.first else { return }

            // Handle image
            if provider.hasItemConformingToTypeIdentifier("public.image") {
                provider.loadItem(forTypeIdentifier: "public.image") { item, error in
                    if let url = item as? URL {
                        await self.processImage(url)
                    }
                }
            }

            // Handle text
            if provider.hasItemConformingToTypeIdentifier("public.text") {
                provider.loadItem(forTypeIdentifier: "public.text") { item, error in
                    if let text = item as? String {
                        await self.processText(text)
                    }
                }
            }
        }
    }

    func processImage(_ url: URL) async {
        let image = UIImage(contentsOfFile: url.path)!

        // Run visual-intelligence skill
        let result = await TinyArmsKit.runSkill("visual-intelligence", input: .image(image))

        // Show result
        showResultCard(result)
    }

    func showResultCard(_ result: SkillResult) {
        // SwiftUI modal
        let hostingController = UIHostingController(
            rootView: ResultCardView(result: result) {
                self.extensionContext?.completeRequest(returningItems: nil)
            }
        )
        present(hostingController, animated: true)
    }
}
```

### Info.plist Configuration

```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionAttributes</key>
    <dict>
        <key>NSExtensionActivationRule</key>
        <string>TRUEPREDICATE</string>
        <key>NSExtensionActivationSupportsImageWithMaxCount</key>
        <integer>10</integer>
        <key>NSExtensionActivationSupportsText</key>
        <true/>
        <key>NSExtensionActivationSupportsFileWithMaxCount</key>
        <integer>5</integer>
    </dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.share-services</string>
    <key>NSExtensionPrincipalClass</key>
    <string>ShareViewController</string>
</dict>
```

---

## Core ML Integration

### Model Loading

```swift
class CoreMLModelClient: ModelClient {
    private var model: VNCoreMLModel?

    init() {
        // Load from app bundle
        guard let modelURL = Bundle.main.url(forResource: "SmolLM2_360M", withExtension: "mlmodelc"),
              let compiledModel = try? MLModel(contentsOf: modelURL) else {
            fatalError("Model not found")
        }

        self.model = try? VNCoreMLModel(for: compiledModel)
    }

    func generate(prompt: String, model: String) async throws -> String {
        // Create request
        let request = VNCoreMLRequest(model: self.model!)

        // Convert prompt to MLMultiArray
        let input = try preprocessPrompt(prompt)

        // Run inference
        let handler = VNImageRequestHandler(ciImage: CIImage())
        try handler.perform([request])

        // Decode output
        guard let results = request.results as? [VNCoreMLFeatureValueObservation],
              let output = results.first?.featureValue.multiArrayValue else {
            throw ModelError.inferenceError
        }

        return decodeTokens(output)
    }
}
```

### Model Conversion (PyTorch → Core ML)

```python
# convert_model.py
import coremltools as ct
import torch

# Load PyTorch model
model = torch.load("SmolLM2-360M.pt")
model.eval()

# Trace model
example_input = torch.randint(0, 50000, (1, 512))  # Token IDs
traced_model = torch.jit.trace(model, example_input)

# Convert to Core ML
mlmodel = ct.convert(
    traced_model,
    inputs=[ct.TensorType(shape=(1, 512), dtype=np.int32)],
    outputs=[ct.TensorType(name="output")],
    minimum_deployment_target=ct.target.iOS18
)

# Save
mlmodel.save("SmolLM2_360M.mlpackage")
```

**Bundle in Xcode**: Add `SmolLM2_360M.mlmodelc` to Resources

---

## Shortcuts Integration

### Intent Definition

```swift
// RenameFileIntent.swift
import AppIntents

struct RenameFileIntent: AppIntent {
    static var title: LocalizedStringResource = "Rename File with tinyArms"

    @Parameter(title: "File")
    var file: IntentFile

    func perform() async throws -> some IntentResult {
        // Extract image from file
        let image = UIImage(data: file.data)!

        // Run visual-intelligence
        let result = await TinyArmsKit.runSkill("visual-intelligence", input: .image(image))

        // Return suggested name
        return .result(value: result.suggestedFilename)
    }
}
```

### Shortcuts App Usage

```
User creates shortcut:
1. "When I take screenshot"
2. → "Rename File with tinyArms"
3. → "Save to Photos"

Result: Every screenshot auto-renamed
```

---

## Widgets

### Recent Results Widget

```swift
// ResultsWidget.swift
import WidgetKit
import SwiftUI

struct ResultsWidget: Widget {
    let kind = "com.tinyarms.results"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ResultsProvider()) { entry in
            ResultsWidgetView(entry: entry)
        }
        .configurationDisplayName("Recent Results")
        .description("See your latest tinyArms results")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct ResultsWidgetView: View {
    let entry: ResultsEntry

    var body: some View {
        VStack(alignment: .leading) {
            Text("🦖 tinyArms")
                .font(.headline)

            ForEach(entry.results) { result in
                HStack {
                    Image(systemName: result.icon)
                    Text(result.summary)
                        .font(.caption)
                }
            }
        }
        .padding()
    }
}

struct ResultsProvider: TimelineProvider {
    func getTimeline(in context: Context, completion: @escaping (Timeline<ResultsEntry>) -> Void) {
        // Fetch from CloudKit or local storage
        let results = fetchRecentResults(limit: 3)
        let entry = ResultsEntry(date: Date(), results: results)
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(300)))
        completion(timeline)
    }
}
```

---

## Live Activities (iOS 16.1+)

### Show Skill Progress in Dynamic Island

```swift
struct SkillProgressAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var skillName: String
        var progress: Double
    }

    var startTime: Date
}

// Start activity
let attributes = SkillProgressAttributes(startTime: Date())
let initialState = SkillProgressAttributes.ContentState(
    skillName: "visual-intelligence",
    progress: 0.0
)

let activity = try Activity.request(
    attributes: attributes,
    contentState: initialState
)

// Update progress
await activity.update(
    SkillProgressAttributes.ContentState(
        skillName: "visual-intelligence",
        progress: 0.5
    )
)

// End activity
await activity.end(dismissalPolicy: .immediate)
```

**Dynamic Island shows**: 🦖 Processing... [Progress bar]

---

## CloudKit Sync

### Save Result to iCloud

```swift
func saveResult(_ result: SkillResult) async throws {
    let container = CKContainer(identifier: "iCloud.com.tinyarms")
    let database = container.publicCloudDatabase

    let record = CKRecord(recordType: "SkillResult")
    record["skillName"] = result.skillName
    record["input"] = result.input
    record["output"] = result.output
    record["timestamp"] = result.timestamp
    record["deviceType"] = "iOS"

    try await database.save(record)
}
```

### Fetch Results from iCloud

```swift
func fetchResults() async throws -> [SkillResult] {
    let container = CKContainer(identifier: "iCloud.com.tinyarms")
    let database = container.publicCloudDatabase

    let query = CKQuery(recordType: "SkillResult", predicate: NSPredicate(value: true))
    query.sortDescriptors = [NSSortDescriptor(key: "timestamp", ascending: false)]

    let (results, _) = try await database.records(matching: query)
    return results.compactMap { try? SkillResult(from: $0.1) }
}
```

---

## App Structure

```
TinyArms-iOS/
├─ TinyArms/              # Main app
│  ├─ ContentView.swift   # SwiftUI main view
│  ├─ SkillListView.swift # Browse available skills
│  └─ ResultsView.swift   # View history
├─ ShareExtension/        # Share Sheet integration
│  └─ ShareViewController.swift
├─ Shortcuts/             # Siri Shortcuts
│  └─ RenameFileIntent.swift
├─ Widgets/               # Home screen widgets
│  └─ ResultsWidget.swift
└─ TinyArmsKit/           # Shared logic (SPM package)
   ├─ Models/
   ├─ Skills/
   └─ Storage/
```

---

## User Workflows

### Workflow 1: Screenshot Renaming
```
1. Take screenshot (Side button + Volume Up)
2. Tap Share button in Photos
3. Select "tinyArms"
4. App shows: "Rename to: product-hero-mockup.png"
5. Tap "Apply"
6. Screenshot renamed in Photos library
```

### Workflow 2: Voice Command
```
1. "Hey Siri, rename this screenshot"
2. Siri: "I found: hero-section-mobile.png. Save?"
3. "Yes"
4. Done
```

### Workflow 3: Batch Processing
```
1. Select 10 screenshots in Photos
2. Share → tinyArms
3. App processes all 10 (shows progress)
4. Results: "Renamed 10 files"
5. Tap to review suggestions
```

---

## iOS-Specific Skills

### 1. camera-intelligence
- Point camera at whiteboard
- Real-time OCR + structured notes
- Save to Apple Notes

### 2. voice-to-action
- Siri: "Remind me to follow up with John"
- Extract: action, person, context
- Create Reminder with metadata

### 3. receipt-scanner
- Photo of receipt
- Extract: merchant, total, date
- Export to CSV or CloudKit

---

## Performance Considerations

### Model Size Optimization
```swift
// Use quantized models
SmolLM2-360M (FP16): 250MB
SmolLM2-360M (INT8): 125MB  // 50% smaller, <2% accuracy loss
```

### Battery Optimization
```swift
// Run inference only when plugged in (for heavy models)
if UIDevice.current.batteryState == .charging {
    await runHeavyModel()
} else {
    await runLightModel()
}
```

### Background Execution
```swift
// Share Extension has 30s limit
// For longer tasks, defer to main app
if estimatedTime > 25 {
    // Save to queue, process in main app
    queueForProcessing(input)
    showMessage("Processing in background...")
}
```

---

## Distribution

### TestFlight
1. Archive in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Add testers (max 10,000)
4. Send invite link

### App Store
1. Screenshots (6.7", 6.5", 5.5")
2. App Privacy report (no tracking)
3. Export compliance (encryption: NO)
4. Submit for review

---

## Reference Files

- **Main App**: TinyArms-iOS/TinyArms/
- **Share Extension**: TinyArms-iOS/ShareExtension/
- **Shared Kit**: TinyArmsKit/ (Swift Package)
