// docs/swiftui-app-ideations.md
# 🦖 TinyArms Menu Bar App - SwiftUI Ideations

## Overview

Native macOS menu bar app for managing TinyArms without touching terminal/YAML files.

**Target User:** Non-coders who want AI automation without technical complexity

---

## Design Philosophy

### 1. **Menu Bar First**

No main window cluttering the desktop. Everything accessible from menu bar icon.

```
     🦖  [Menu Bar Icon]
      │
      ├─ Run File Naming (⌘1)
      ├─ Run Code Linting (⌘2)
      ├─ Run Markdown Analysis (⌘3)
      ├─────────────────────
      ├─ Recent Activity
      │  ├─ Renamed 3 files (2m ago)
      │  ├─ Linted main.ts (5m ago) ⚠️ 2 issues
      │  └─ See all...
      ├─────────────────────
      ├─ System Status
      │  ├─ Ollama: ● Online
      │  ├─ Models: 2/3 loaded
      │  └─ Memory: 4.2GB / 16GB
      ├─────────────────────
      ├─ Settings...
      ├─ View Logs...
      ├─ About TinyArms
      └─ Quit (⌘Q)
```

### 2. **T-Rex Visual Identity**

```
Menu bar icon states:
🦖 - Idle (green)
🦖 - Processing (animated, yellow)
⚠️ - Issue needs attention (red)
💤 - Disabled (gray)

Logo design ideas:
- Minimalist T-Rex silhouette
- Emphasis on tiny arms but confident posture
- Friendly, not scary
```

### 3. **Zero Config Required**

First launch:
1. Auto-detects Ollama installation
2. Offers to download Gemma 3 4B (one click)
3. Suggests default folders to watch
4. Done! Start using immediately.

---

## Main Windows

### Window 1: Settings Panel

**Size:** 600x800px, non-resizable
**Style:** Native macOS design (Big Sur+)

```
┌───────────────────────────────────────────────────┐
│ 🦖 TinyArms Settings                        [x]   │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ [Skills] [Models] [Scheduling] [Advanced]   │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ──────────────────────────────────────────────  │
│  SKILLS TAB                                       │
│  ──────────────────────────────────────────────  │
│                                                   │
│  ┌─ File Naming ────────────────────────────┐    │
│  │  ☑ Enabled                                │    │
│  │                                            │    │
│  │  When to run:                             │    │
│  │  ○ Manual only                            │    │
│  │  ● Every 4 hours                          │    │
│  │  ○ When files appear in folders           │    │
│  │                                            │    │
│  │  Watch folders:                           │    │
│  │  📁 ~/Downloads        [Remove] [Browse]  │    │
│  │  📁 ~/Desktop          [Remove] [Browse]  │    │
│  │  [+ Add Folder]                           │    │
│  │                                            │    │
│  │  Model: Gemma 3 4B (fast) ▼              │    │
│  └────────────────────────────────────────────┘    │
│                                                   │
│  ┌─ Code Linting ───────────────────────────┐    │
│  │  ☑ Enabled                                │    │
│  │                                            │    │
│  │  Trigger: ● Manual  ○ Pre-commit          │    │
│  │                                            │    │
│  │  Constitution:                            │    │
│  │  📄 ~/.specify/memory/constitution.md     │    │
│  │  [Browse...]                              │    │
│  │                                            │    │
│  │  Model: Qwen 7B (accurate) ▼             │    │
│  └────────────────────────────────────────────┘    │
│                                                   │
│  ┌─ Markdown Analysis ──────────────────────┐    │
│  │  ☑ Enabled                                │    │
│  │  ... (collapsed)                          │    │
│  └────────────────────────────────────────────┘    │
│                                                   │
│                        [Cancel] [Save Settings]   │
└───────────────────────────────────────────────────┘
```

**Key Features:**
- Collapsible sections (accordion style)
- Live validation (red border if invalid)
- "Test" button for each skill (dry run)
- Drag & drop folder selection
- Tooltips on hover

---

### Window 2: Activity Log

**Size:** 700x500px, resizable
**Style:** Xcode-like log viewer

```
┌───────────────────────────────────────────────────┐
│ 🦖 Activity Log                  [Filter ▼] [x]  │
├───────────────────────────────────────────────────┤
│                                                   │
│  [All] [File Naming] [Code Linting] [Errors]     │
│  ──────────────────────────────────────────────   │
│                                                   │
│  ● 2:45 PM  File Naming                          │
│    Renamed 3 files in ~/Downloads                │
│    - Screenshot 2024.png → hero-mockup.png       │
│    - IMG_1234.jpg → golden-gate-sunset.jpg       │
│    - Untitled.fig → dashboard-redesign.fig       │
│    [View Details] [Undo]                         │
│                                                   │
│  ⚠️ 2:40 PM  Code Linting                        │
│    Found 2 issues in src/main.ts                 │
│    - Line 45: Use const instead of let           │
│    - Line 102: Function too complex              │
│    [View Code] [Dismiss]                         │
│                                                   │
│  ● 2:30 PM  Markdown Analysis                    │
│    Detected changes in .specify/memory/          │
│    - constitution.md: New principle added        │
│    [View Changes]                                │
│                                                   │
│  ● 2:15 PM  System                               │
│    Gemma 3 4B loaded (3.2GB RAM)                 │
│                                                   │
│  ────────────────────────────────────────────     │
│  [Export Log] [Clear Log] [Refresh]              │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Key Features:**
- Real-time updates (no refresh needed)
- Expandable log entries
- Quick actions (Undo, View Details)
- Export to CSV/JSON
- Search/filter

---

### Window 3: Quick Run Panel

**Size:** 400x300px, floating window
**Style:** Spotlight-like

```
┌───────────────────────────────────────────────────┐
│ 🦖 Run Skill                                 [x]  │
├───────────────────────────────────────────────────┤
│                                                   │
│  What do you want to do?                         │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ [ Search or select a skill...          ]   │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  📁 Rename files in Downloads                    │
│  🔍 Lint current project                         │
│  📝 Analyze markdown changes                     │
│  🎤 Process voice transcriptions                 │
│                                                   │
│  ────────────────────────────────────────────     │
│  or drop files here to process                   │
│                                                   │
│                                  [Cancel] [Run]  │
└───────────────────────────────────────────────────┘
```

**Key Features:**
- ⌘Space-like quick access
- Fuzzy search
- Drag & drop files
- Recent skills at top
- Keyboard navigation

---

## Notification System

### macOS Native Notifications

```
┌──────────────────────────────────┐
│ 🦖 TinyArms                       │
├──────────────────────────────────┤
│ Renamed 3 files in Downloads     │
│                                  │
│ Screenshot → hero-mockup         │
│ IMG_1234 → sunset-photo          │
│ Untitled → dashboard-redesign    │
│                                  │
│           [View] [Dismiss]       │
└──────────────────────────────────┘
```

**Types of Notifications:**
1. **Success** - Task completed successfully
2. **Needs Review** - AI uncertain, user input needed
3. **Error** - Something failed
4. **Info** - System status updates

**Actionable Notifications:**
- "View" button → Opens Activity Log
- "Undo" button → Reverts changes
- "Review" button → Shows preview for approval

---

## Status Bar States

### Idle State
```
🦖 (green, static)
```

### Processing State
```
🦖 (yellow, subtle pulse animation)
```

### Needs Attention
```
⚠️ (red, with badge count)
```

### Disabled
```
💤 (gray)
```

---

## SwiftUI Implementation Sketch

```swift
// ContentView.swift
import SwiftUI

@main
struct TinyArmsApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        Settings {
            SettingsView()
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var popover = NSPopover()
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create menu bar icon
        statusItem = NSStatusBar.system.statusItem(
            withLength: NSStatusItem.variableLength
        )
        
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "🦖", accessibilityDescription: "TinyArms")
            button.action = #selector(togglePopover)
        }
        
        // Create menu
        createMenu()
        
        // Start background services
        Task {
            await TinyArmsService.shared.start()
        }
    }
    
    func createMenu() {
        let menu = NSMenu()
        
        // Skills
        menu.addItem(NSMenuItem(
            title: "Run File Naming",
            action: #selector(runFileNaming),
            keyEquivalent: "1"
        ))
        menu.addItem(NSMenuItem(
            title: "Run Code Linting",
            action: #selector(runCodeLinting),
            keyEquivalent: "2"
        ))
        
        menu.addItem(NSMenuItem.separator())
        
        // Recent activity submenu
        let recentMenu = NSMenu()
        recentMenu.addItem(NSMenuItem(title: "Renamed 3 files (2m ago)", action: nil, keyEquivalent: ""))
        recentMenu.addItem(NSMenuItem(title: "Linted main.ts (5m ago)", action: nil, keyEquivalent: ""))
        let recentItem = NSMenuItem(title: "Recent Activity", action: nil, keyEquivalent: "")
        recentItem.submenu = recentMenu
        menu.addItem(recentItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Settings & Quit
        menu.addItem(NSMenuItem(
            title: "Settings...",
            action: #selector(openSettings),
            keyEquivalent: ","
        ))
        menu.addItem(NSMenuItem(
            title: "Quit",
            action: #selector(quit),
            keyEquivalent: "q"
        ))
        
        statusItem?.menu = menu
    }
    
    @objc func runFileNaming() {
        Task {
            await TinyArmsService.shared.runSkill("file-naming")
        }
    }
    
    @objc func runCodeLinting() {
        Task {
            await TinyArmsService.shared.runSkill("code-linting")
        }
    }
    
    @objc func openSettings() {
        // Open settings window
        NSApp.sendAction(Selector(("showPreferencesWindow:")), to: nil, from: nil)
    }
    
    @objc func quit() {
        NSApplication.shared.terminate(nil)
    }
}

// Settings View
struct SettingsView: View {
    @StateObject private var settings = SettingsManager.shared
    
    var body: some View {
        TabView {
            SkillsTab()
                .tabItem {
                    Label("Skills", systemImage: "wand.and.stars")
                }
            
            ModelsTab()
                .tabItem {
                    Label("Models", systemImage: "brain")
                }
            
            SchedulingTab()
                .tabItem {
                    Label("Scheduling", systemImage: "clock")
                }
            
            AdvancedTab()
                .tabItem {
                    Label("Advanced", systemImage: "gearshape")
                }
        }
        .frame(width: 600, height: 800)
    }
}

// Skills Tab
struct SkillsTab: View {
    @StateObject private var settings = SettingsManager.shared
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                SkillCard(
                    title: "File Naming",
                    enabled: $settings.fileNamingEnabled,
                    content: FileNamingSettings()
                )
                
                SkillCard(
                    title: "Code Linting",
                    enabled: $settings.codeLintingEnabled,
                    content: CodeLintingSettings()
                )
                
                SkillCard(
                    title: "Markdown Analysis",
                    enabled: $settings.markdownAnalysisEnabled,
                    content: MarkdownAnalysisSettings()
                )
            }
            .padding()
        }
    }
}

// Reusable Skill Card
struct SkillCard<Content: View>: View {
    let title: String
    @Binding var enabled: Bool
    let content: Content
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Toggle(title, isOn: $enabled)
                    .font(.headline)
                
                Spacer()
                
                Button(action: { isExpanded.toggle() }) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                }
            }
            
            if isExpanded {
                content
                    .transition(.opacity)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
    }
}

// Service Layer (calls CLI under the hood)
class TinyArmsService: ObservableObject {
    static let shared = TinyArmsService()
    
    @Published var isProcessing = false
    @Published var recentActivity: [Activity] = []
    
    func start() async {
        // Check Ollama
        // Load models
        // Start watchers
    }
    
    func runSkill(_ skillName: String) async {
        isProcessing = true
        
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/local/bin/tinyarms")
        task.arguments = ["run", skillName, "--json"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        
        try? task.run()
        task.waitUntilExit()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8) {
            parseResult(output)
        }
        
        isProcessing = false
        showNotification(skillName)
    }
    
    func parseResult(_ json: String) {
        // Parse JSON, update recentActivity
    }
    
    func showNotification(_ skill: String) {
        let notification = NSUserNotification()
        notification.title = "🦖 TinyArms"
        notification.informativeText = "Completed \(skill)"
        notification.soundName = NSUserNotificationDefaultSoundName
        NSUserNotificationCenter.default.deliver(notification)
    }
}

struct Activity: Identifiable {
    let id = UUID()
    let skill: String
    let timestamp: Date
    let status: String
    let details: String
}
```

---

## User Flows

### Flow 1: First Launch

1. User downloads TinyArms.dmg
2. Drags to Applications
3. Opens TinyArms
4. Welcome screen:
   ```
   Welcome to TinyArms! 🦖
   
   Let's set up your AI assistant in 3 steps:
   
   ✓ Ollama detected
   ⏳ Downloading Gemma 3 4B (2.3GB)...
   ⏸ Configure folders to watch
   
   [Skip] [Continue]
   ```
5. Downloads model (progress bar)
6. Asks which folders to watch
7. Done! Icon appears in menu bar

### Flow 2: Running a Skill

1. Click 🦖 menu bar icon
2. Select "Run File Naming"
3. Icon changes to processing (yellow pulse)
4. Notification appears: "Renamed 3 files"
5. Click "View" to see details

### Flow 3: Reviewing Uncertain Decisions

1. TinyArms encounters ambiguous file
2. Notification: "Need your help with 1 file"
3. User clicks "Review"
4. Modal shows:
   ```
   I'm not sure how to rename this file:
   
   Original: IMG_1234.jpg
   
   Suggested names:
   ○ golden-gate-sunset.jpg
   ○ san-francisco-bridge.jpg
   ○ sunset-photo.jpg
   
   [Skip] [Other...] [Confirm]
   ```
5. User selects, TinyArms learns pattern

---

## Polish Details

### Animations

- **Icon pulse:** Subtle sine wave during processing
- **List items:** Fade in/out smoothly
- **Settings panels:** Accordion expand/collapse
- **Notifications:** Slide in from top-right

### Sounds

- **Success:** Gentle "ding" (macOS native)
- **Error:** System error sound
- **Needs review:** Attention-getting but not annoying

### Accessibility

- Full VoiceOver support
- Keyboard shortcuts for all actions
- High contrast mode support
- Respects system font size

---

## Distribution

### Option 1: Direct Download

- .dmg file on GitHub releases
- Notarized by Apple
- Auto-update via Sparkle framework

### Option 2: Homebrew

```bash
brew install --cask tinyarms
```

### Option 3: Mac App Store (future)

- Requires Apple Developer account ($99/year)
- App Store review process
- Sandboxing restrictions

---

## Next Steps

1. **Prototype in SwiftUI** (Week 1-2)
   - Basic menu bar icon
   - Settings panel mockup
   - Test CLI integration

2. **Core Functionality** (Week 3-4)
   - Run skills from menu
   - View logs
   - Notifications

3. **Polish** (Week 5-6)
   - Animations
   - Keyboard shortcuts
   - Error handling

4. **Beta Testing** (Week 7-8)
   - TestFlight distribution
   - Gather feedback
   - Fix bugs

**Result:** Beautiful, native macOS app that makes TinyArms accessible to anyone!
