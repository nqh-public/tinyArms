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

### Window 1: Settings Panel (600x800px, native macOS)

**Key Sections**:
- **Skills Tab**: Enable/disable file-naming, code-linting, markdown-analysis
  - Each skill: Toggle, schedule, watch folders, model selection
- **Models Tab**: Download/manage models
- **Scheduling Tab**: Configure intervals, power awareness
- **Advanced Tab**: Logs, cache, performance

**Key Features**: Accordion UI, live validation, drag & drop folders, test buttons

---

### Window 2: Activity Log (700x500px, Xcode-style)

**Displays**:
- Recent tasks with timestamps (File Naming, Code Linting, etc.)
- Status indicators (● success, ⚠️ needs review)
- Quick actions: [Undo] [View Details] [Dismiss]

**Features**: Real-time updates, expandable entries, export (CSV/JSON), search/filter

---

### Window 3: Quick Run Panel (400x300px, Spotlight-style)

**Interface**: Search bar + skill list + drag & drop zone

**Features**: Fuzzy search, keyboard navigation, recent skills prioritized

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

## SwiftUI Implementation (High-Level)

**Architecture**:
1. Menu bar app (NSStatusItem)
2. Settings window (TabView: Skills, Models, Scheduling, Advanced)
3. Service layer calls CLI: `Process("/usr/local/bin/tinyarms run <skill> --json")`
4. Notifications via NSUserNotificationCenter

**Key Components**:
- `AppDelegate`: Menu bar + launch services
- `SettingsView`: Tabbed UI for configuration
- `SkillCard`: Reusable accordion component
- `TinyArmsService`: CLI wrapper + state management

**Full 251-line implementation deleted** (lines 275-524). See Git history if needed.

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
