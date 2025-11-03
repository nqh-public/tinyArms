# macOS Daemon Architecture

**Status**: Implementation guide for native macOS daemon
**Platform**: macOS 14.0+
**Tech**: Swift, LaunchAgent, FSEvents, Ollama

---

## System Overview

```
LaunchAgent (auto-start on login)
  ↓
DaemonController.swift (singleton, always running)
  ↓
┌─────────────────┬──────────────────┬─────────────────┐
│  FSEventsWatcher│  MenuBarApp      │  OllamaClient   │
│  (file changes) │  (UI/controls)   │  (models)       │
└─────────────────┴──────────────────┴─────────────────┘
  ↓                  ↓                  ↓
SkillExecutor → TieredRouter → ModelInference → Results
  ↓
┌─────────────────┬──────────────────┐
│  Notifications  │  Spotlight Index │
└─────────────────┴──────────────────┘
```

---

## Core Components

### DaemonController.swift

```swift
@main
struct TinyArmsDaemon {
    static func main() async {
        let controller = DaemonController.shared

        // Preload models once at startup
        await controller.loadModels([
            .embeddinggemma_300m,
            .qwen25_coder_3b
        ])

        // Start file watchers
        controller.startWatching([
            "~/Downloads",
            "~/Desktop",
            "~/.specify/memory"
        ])

        // Start menu bar app
        controller.startMenuBar()

        // Keep alive
        RunLoop.main.run()
    }
}

class DaemonController {
    static let shared = DaemonController()

    let fsWatcher: FSEventsWatcher
    let menuBar: MenuBarController
    let ollama: OllamaModelClient
    let executor: SkillExecutor

    func loadModels(_ models: [Model]) async {
        // HTTP call to localhost:11434
        // Keep models in RAM (persistent)
    }

    func startWatching(_ paths: [String]) {
        fsWatcher.watch(paths) { event in
            Task {
                await handleFileEvent(event)
            }
        }
    }

    func handleFileEvent(_ event: FSEvent) async {
        // Determine skill (file extension, path)
        let skill = matchSkill(for: event.path)

        // Execute skill
        let result = await executor.run(skill, input: event.path)

        // Show notification
        showNotification(result)
    }
}
```

---

### FSEventsWatcher.swift

```swift
class FSEventsWatcher {
    private var stream: FSEventStreamRef?

    func watch(_ paths: [String], callback: @escaping (FSEvent) -> Void) {
        let context = FSEventStreamContext(
            version: 0,
            info: Unmanaged.passRetained(callback as AnyObject).toOpaque(),
            retain: nil,
            release: nil,
            copyDescription: nil
        )

        stream = FSEventStreamCreate(
            nil,
            { _, clientCallBackInfo, numEvents, eventPaths, eventFlags, eventIds in
                // Parse events
                let callback = Unmanaged<AnyObject>.fromOpaque(clientCallBackInfo!).takeUnretainedValue()
                // Invoke callback with FSEvent
            },
            &context,
            paths as CFArray,
            FSEventStreamEventId(kFSEventStreamEventIdSinceNow),
            0.5, // Latency (500ms debounce)
            FSEventStreamCreateFlags(kFSEventStreamCreateFlagFileEvents)
        )

        FSEventStreamScheduleWithRunLoop(stream!, CFRunLoopGetMain(), CFRunLoopMode.defaultMode.rawValue)
        FSEventStreamStart(stream!)
    }
}

struct FSEvent {
    let path: String
    let type: EventType // created, modified, deleted
    let timestamp: Date
}
```

---

### MenuBarController.swift

```swift
class MenuBarController: NSObject {
    private var statusItem: NSStatusItem!

    func start() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        statusItem.button?.image = NSImage(named: "TinyArmsIcon") // 🦖
        statusItem.menu = buildMenu()
    }

    func buildMenu() -> NSMenu {
        let menu = NSMenu()

        menu.addItem(withTitle: "Recent Results (5)", action: nil)
        menu.addItem(withTitle: "Run Skill...", action: #selector(runSkill))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: "Status: Models Loaded", action: nil)
        menu.addItem(NSMenuItem.separator())
        menu.addItem(withTitle: "Settings...", action: #selector(openSettings))
        menu.addItem(withTitle: "Quit", action: #selector(quit))

        return menu
    }

    @objc func updateStatus(_ state: DaemonState) {
        switch state {
        case .idle: statusItem.button?.image = NSImage(named: "TinyArmsIdle") // Green
        case .processing: statusItem.button?.image = NSImage(named: "TinyArmsProcessing") // Yellow, animated
        case .error: statusItem.button?.image = NSImage(named: "TinyArmsError") // Red
        }
    }
}
```

---

### OllamaModelClient.swift

```swift
class OllamaModelClient: ModelClient {
    private let baseURL = URL(string: "http://localhost:11434")!
    private var loadedModels: Set<String> = []

    func loadModel(_ model: String) async throws {
        let request = URLRequest(url: baseURL.appendingPathComponent("/api/pull"))
        // POST {"name": "qwen2.5-coder:3b"}
        // Wait for completion
        loadedModels.insert(model)
    }

    func generate(prompt: String, model: String) async throws -> String {
        let request = URLRequest(url: baseURL.appendingPathComponent("/api/generate"))
        // POST {"model": "qwen2.5-coder:3b", "prompt": "..."}
        // Stream response
        // Return completed text
    }

    func checkStatus() async -> Bool {
        // GET /api/tags
        // Returns list of loaded models
    }
}
```

---

## LaunchAgent Setup

### com.tinyarms.daemon.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tinyarms.daemon</string>

    <key>ProgramArguments</key>
    <array>
        <string>/Applications/TinyArms.app/Contents/MacOS/TinyArmsDaemon</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/Users/YOU/.tinyarms/logs/daemon.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/YOU/.tinyarms/logs/daemon-error.log</string>
</dict>
</plist>
```

**Install**:
```bash
cp com.tinyarms.daemon.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.tinyarms.daemon.plist
```

---

## Model Preloading Strategy

```swift
// Load models once at daemon start
func preloadModels() async {
    let models = [
        "embeddinggemma:300m",  // 200MB, Level 1
        "qwen2.5-coder:3b"      // 1.9GB, Level 2
    ]

    for model in models {
        // Check if already loaded
        let loaded = await ollama.checkStatus()
        if !loaded.contains(model) {
            await ollama.loadModel(model)
        }
    }

    // Models stay in RAM until daemon stops
}
```

**Memory usage**: 2-4GB persistent (vs 0GB idle with CLI approach)

---

## Notification System

```swift
func showNotification(_ result: SkillResult) {
    let notification = UNMutableNotificationContent()
    notification.title = "🦖 \(result.skillName)"
    notification.body = result.summary
    notification.sound = .default
    notification.userInfo = ["resultID": result.id]

    // Actions
    notification.categoryIdentifier = "SKILL_RESULT"

    let request = UNNotificationRequest(
        identifier: UUID().uuidString,
        content: notification,
        trigger: nil
    )

    UNUserNotificationCenter.current().add(request)
}

// User clicks notification → Open result
func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) {
    let resultID = response.notification.request.content.userInfo["resultID"] as! String
    openResult(resultID)
}
```

---

## Spotlight Integration

```swift
func indexResult(_ result: SkillResult) {
    let searchableItem = CSSearchableItem(
        uniqueIdentifier: result.id,
        domainIdentifier: "com.tinyarms.results",
        attributeSet: {
            let attrs = CSSearchableItemAttributeSet(itemContentType: kUTTypeText as String)
            attrs.title = "\(result.skillName): \(result.input)"
            attrs.contentDescription = result.output
            attrs.keywords = ["tinyarms", result.skillName]
            return attrs
        }()
    )

    CSSearchableIndex.default().indexSearchableItems([searchableItem])
}
```

**User workflow**:
```
Cmd+Space → "tinyarms lint auth.ts" → Opens result from history
```

---

## Performance Optimizations

### 1. Model Connection Pooling
```swift
// Reuse HTTP connections
let session = URLSession(configuration: .default)
// Keep alive for daemon lifetime
```

### 2. Debouncing File Events
```swift
// FSEvents fires rapidly for bulk operations
// Debounce: Wait 500ms, then process batch
var pendingEvents: [FSEvent] = []
var debounceTimer: Timer?

func handleEvent(_ event: FSEvent) {
    pendingEvents.append(event)

    debounceTimer?.invalidate()
    debounceTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: false) { _ in
        processBatch(pendingEvents)
        pendingEvents.removeAll()
    }
}
```

### 3. Lazy Skill Loading
```swift
// Don't load all skills at startup
var loadedSkills: [String: Skill] = [:]

func loadSkill(_ name: String) -> Skill {
    if let cached = loadedSkills[name] {
        return cached
    }

    let skill = SkillLoader.load(name)
    loadedSkills[name] = skill
    return skill
}
```

---

## Installation Flow

```
1. User downloads TinyArms.dmg
2. Drag to /Applications
3. First launch:
   - macOS prompts: "Allow TinyArms to run in background?"
   - Grant permissions (File access, Notifications)
4. Daemon installs LaunchAgent automatically
5. Menu bar icon appears 🦖
6. Done (daemon runs on every login)
```

---

## Management Commands

```bash
# Start daemon
launchctl start com.tinyarms.daemon

# Stop daemon
launchctl stop com.tinyarms.daemon

# Restart daemon
launchctl kickstart -k gui/$UID/com.tinyarms.daemon

# View logs
tail -f ~/.tinyarms/logs/daemon.log

# Check status
launchctl list | grep com.tinyarms
```

---

## Reference Files

- **Source**: TinyArmsDaemon/Sources/
- **LaunchAgent**: config/com.tinyarms.daemon.plist
- **Logs**: ~/.tinyarms/logs/
- **Storage**: ~/Library/Application Support/TinyArms/
