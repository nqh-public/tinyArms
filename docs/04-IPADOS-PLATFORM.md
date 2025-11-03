# iPadOS Platform Guide

**Status**: Implementation guide for iPadOS app
**Platform**: iPadOS 18.0+
**Tech**: SwiftUI, Split View, Drag & Drop, Pointer support

---

## Architecture (Inherits iOS + Extensions)

```
iOS Base App
  +
┌─────────────────┬─────────────────┬──────────────────┐
│ Split View      │ Drag & Drop     │ Keyboard Shortcuts│
│ (multi-window)  │ (batch files)   │ (Cmd+K picker)   │
└─────────────────┴─────────────────┴──────────────────┘
  =
iPadOS App
```

---

## Split View Support

### Multi-Window Scenes

```swift
// SceneDelegate.swift
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Configure window for split view
        windowScene.sizeRestrictions?.minimumSize = CGSize(width: 400, height: 600)
        windowScene.sizeRestrictions?.maximumSize = CGSize(width: 1200, height: 1600)
    }

    // Support multiple windows
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
```

### Side-by-Side Layout

```swift
struct iPadOSRootView: View {
    @State private var selectedSkill: Skill?

    var body: some View {
        NavigationSplitView {
            // Sidebar (skills list)
            SkillListView(selection: $selectedSkill)
                .navigationTitle("Skills")
                .frame(minWidth: 250, idealWidth: 300)
        } detail: {
            // Main content (results/processing)
            if let skill = selectedSkill {
                SkillDetailView(skill: skill)
                    .frame(minWidth: 500)
            } else {
                EmptyStateView()
            }
        }
    }
}
```

---

## Drag & Drop

### Drop Zone for Files

```swift
struct DropZoneView: View {
    @State private var droppedFiles: [URL] = []

    var body: some View {
        VStack {
            Text("Drop files here")
                .font(.title)

            if !droppedFiles.isEmpty {
                Text("\(droppedFiles.count) files ready")
                Button("Process All") {
                    processFiles(droppedFiles)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.gray.opacity(0.2))
        .onDrop(of: [.fileURL, .image], isTargeted: nil) { providers in
            handleDrop(providers)
            return true
        }
    }

    func handleDrop(_ providers: [NSItemProvider]) {
        for provider in providers {
            provider.loadFileRepresentation(forTypeIdentifier: "public.file-url") { url, error in
                if let url = url {
                    droppedFiles.append(url)
                }
            }
        }
    }

    func processFiles(_ files: [URL]) {
        Task {
            for file in files {
                let result = await TinyArmsKit.runSkill("file-naming", input: .file(file))
                // Show result
            }
        }
    }
}
```

### Drag from Finder (Files App)

```swift
// Enable drag from Files app sidebar
struct FileItem: Transferable {
    let url: URL

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .fileURL) { item in
            SentTransferredFile(item.url)
        } importing: { received in
            let copy = URL.temporaryDirectory.appendingPathComponent(received.file.lastPathComponent)
            try FileManager.default.copyItem(at: received.file, to: copy)
            return Self(url: copy)
        }
    }
}
```

---

## Keyboard Shortcuts

### Global Shortcuts

```swift
struct ContentView: View {
    var body: some View {
        MainView()
            .keyboardShortcut("K", modifiers: [.command]) // Cmd+K: Skill picker
            .keyboardShortcut("R", modifiers: [.command, .shift]) // Cmd+Shift+R: Run last
            .keyboardShortcut("L", modifiers: [.command]) // Cmd+L: View logs
    }
}

// Skill picker
struct SkillPickerView: View {
    @State private var searchText = ""
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack {
            TextField("Search skills...", text: $searchText)
                .focused($isFocused)
                .onAppear { isFocused = true }

            List(filteredSkills) { skill in
                SkillRow(skill: skill)
                    .onTapGesture {
                        runSkill(skill)
                    }
            }
        }
        .frame(width: 500, height: 400)
    }
}
```

### Keyboard Navigation

```swift
// Arrow keys navigate results
struct ResultsListView: View {
    @State private var selectedIndex = 0
    let results: [SkillResult]

    var body: some View {
        List(results.indices, id: \.self, selection: $selectedIndex) { index in
            ResultRow(result: results[index])
        }
        .onKeyPress(.upArrow) {
            selectedIndex = max(0, selectedIndex - 1)
            return .handled
        }
        .onKeyPress(.downArrow) {
            selectedIndex = min(results.count - 1, selectedIndex + 1)
            return .handled
        }
        .onKeyPress(.return) {
            openResult(results[selectedIndex])
            return .handled
        }
    }
}
```

---

## Pointer Interactions

### Hover Effects

```swift
struct SkillCardView: View {
    @State private var isHovered = false

    var body: some View {
        VStack {
            Text(skill.name)
            Text(skill.description)
                .font(.caption)
        }
        .padding()
        .background(isHovered ? Color.blue.opacity(0.1) : Color.clear)
        .cornerRadius(8)
        .onHover { hovering in
            withAnimation {
                isHovered = hovering
            }
        }
        .hoverEffect(.lift) // Card lifts when hovered
    }
}
```

### Context Menus

```swift
struct ResultRow: View {
    let result: SkillResult

    var body: some View {
        HStack {
            Image(systemName: result.icon)
            Text(result.summary)
        }
        .contextMenu {
            Button("View Details") {
                openDetails(result)
            }
            Button("Copy Output") {
                UIPasteboard.general.string = result.output
            }
            Button("Delete") {
                deleteResult(result)
            }
        }
    }
}
```

---

## Pencil Support (Apple Pencil)

### Scribble for Text Input

```swift
// Automatic - SwiftUI text fields support Pencil Scribble
TextField("Skill name", text: $skillName)
    // User can write with Pencil, converts to text
```

### Drawing Annotations (Future)

```swift
import PencilKit

struct AnnotatedImageView: View {
    @State private var canvasView = PKCanvasView()

    var body: some View {
        VStack {
            Image(uiImage: originalImage)
                .overlay(
                    PKCanvasViewRepresentable(canvasView: $canvasView)
                )

            Button("Analyze with Annotations") {
                let annotatedImage = canvasView.drawing.image(from: canvasView.bounds, scale: 2.0)
                processAnnotatedImage(annotatedImage)
            }
        }
    }
}
```

---

## Stage Manager Support (iPadOS 16+)

### Window Sizing

```swift
// Info.plist
<key>UIApplicationSceneManifest</key>
<dict>
    <key>UISceneConfigurations</key>
    <dict>
        <key>UIWindowSceneSessionRoleApplication</key>
        <array>
            <dict>
                <key>UISceneConfigurationName</key>
                <string>Default</string>
                <key>UISceneDelegateClassName</key>
                <string>SceneDelegate</string>
            </dict>
        </array>
    </dict>
    <key>UIApplicationSupportsMultipleScenes</key>
    <true/>
</dict>
```

### Resizable Windows

```swift
// SceneDelegate.swift
windowScene.sizeRestrictions?.minimumSize = CGSize(width: 400, height: 600)
windowScene.sizeRestrictions?.maximumSize = CGSize(width: 1400, height: 1800)

// Preferred size
windowScene.requestGeometryUpdate(.iOS(interfaceOrientations: .portrait)) { error in
    // Handle error
}
```

---

## Batch Processing UI

### Progress View

```swift
struct BatchProcessView: View {
    @State private var files: [URL] = []
    @State private var progress: [UUID: Double] = [:]

    var body: some View {
        VStack {
            Text("Processing \(files.count) files")

            ForEach(files.indices, id: \.self) { index in
                HStack {
                    Text(files[index].lastPathComponent)
                    ProgressView(value: progress[files[index].id] ?? 0.0)
                }
            }
        }
        .onAppear {
            processBatch(files)
        }
    }

    func processBatch(_ files: [URL]) {
        Task {
            for file in files {
                // Process with progress updates
                for await progressValue in processFile(file) {
                    progress[file.id] = progressValue
                }
            }
        }
    }
}
```

---

## iPad-Specific Layouts

### Compact vs Regular Size Classes

```swift
struct AdaptiveView: View {
    @Environment(\.horizontalSizeClass) var sizeClass

    var body: some View {
        if sizeClass == .regular {
            // iPad landscape: 3-column layout
            ThreeColumnLayout()
        } else {
            // iPad portrait or split view: 2-column
            TwoColumnLayout()
        }
    }
}
```

### Toolbar Customization

```swift
struct MainView: View {
    var body: some View {
        NavigationView {
            ContentView()
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button("Run") { runSkill() }
                Button("Clear") { clearResults() }
            }

            ToolbarItemGroup(placement: .secondaryAction) {
                Button("Settings") { openSettings() }
                Button("Help") { openHelp() }
            }
        }
    }
}
```

---

## External Display Support

### Mirror vs Extended Display

```swift
// Detect external display
NotificationCenter.default.addObserver(
    forName: UIScreen.didConnectNotification,
    object: nil,
    queue: .main
) { notification in
    if let screen = notification.object as? UIScreen {
        // Create new window for external display
        let externalWindow = UIWindow(windowScene: createExternalScene(screen))
        externalWindow.rootViewController = ResultsViewController()
        externalWindow.isHidden = false
    }
}
```

---

## iPadOS-Specific Skills

### 1. presentation-analysis
- Drag PowerPoint/Keynote slides
- Extract text, structure, action items
- Export to markdown

### 2. code-review-split
- Code file in left panel
- tinyArms analysis in right panel
- Real-time linting as you edit

### 3. document-comparison
- Drag 2 PDFs side-by-side
- Highlight differences
- Summarize changes

---

## User Workflows

### Workflow 1: Batch Screenshot Renaming
```
1. Open Files app + tinyArms in Split View
2. Select 20 screenshots in Files
3. Drag to tinyArms drop zone
4. App processes all 20 (2-3 min)
5. Review suggestions, bulk apply
6. Drag renamed files back to Files app
```

### Workflow 2: Code Review with Keyboard
```
1. Open tinyArms, press Cmd+K
2. Type "lint" → Select code-linting
3. Drag file.ts from Finder
4. Arrow keys navigate violations
5. Press Enter to open in external editor
6. Fix → Re-lint (Cmd+Shift+R)
```

### Workflow 3: Presentation Mode
```
1. Connect iPad to external display
2. Main screen: tinyArms control panel
3. External display: Full-screen results
4. Use Apple Pencil to annotate results
5. Export annotated version
```

---

## Performance Considerations

### Split View Resource Management
```swift
// Reduce model inference when in background
func sceneDidEnterBackground(_ scene: UIScene) {
    pauseModelInference()
}

func sceneWillEnterForeground(_ scene: UIScene) {
    resumeModelInference()
}
```

### Memory Pressure Handling
```swift
// Unload heavy models when memory warning
func didReceiveMemoryWarning() {
    CoreMLModelClient.shared.unloadModels()
}
```

---

## Testing on iPad

### Simulator
```bash
xcrun simctl list | grep iPad
xcodebuild -workspace TinyArms.xcworkspace -scheme TinyArms-iPadOS -destination 'platform=iOS Simulator,name=iPad Pro (12.9-inch)'
```

### Physical Device
- USB-C connection
- Xcode → Window → Devices and Simulators
- Select iPad → Run

---

## Distribution

Same as iOS (shared binary):
- One app bundle supports iPhone + iPad
- iPad-specific features auto-enable on iPad
- No separate submission needed

---

## Reference Files

- **Shared with iOS**: TinyArms-iOS/ (same codebase)
- **iPad layouts**: Views marked `@available(iPadOS 18, *)`
- **Split View**: Uses NavigationSplitView (auto-adapts)
