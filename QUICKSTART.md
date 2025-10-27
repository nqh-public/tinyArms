# 🦖 TinyArms - Quick Start Guide

Get TinyArms running in 10 minutes!

## 🎯 Built For YOUR Setup

**Hardware**: M2 MacBook Air, 16GB RAM, 20GB storage available
**Goal**: Save $120-240/year (vs GitHub Copilot $10/mo or Claude Pro $20/mo)
**Strategy**: Reuse existing Cotypist model (2.3GB), optimize for storage

## Prerequisites

- macOS 12.0+ (Apple Silicon recommended)
- 16GB RAM (M2 MacBook Air confirmed compatible)
- 20GB free storage (will use ~5.9GB new)
- Node.js 18+
- **Optional**: Cotypist installed (to reuse Gemma 3 4B model)

## Installation

```bash
# Clone the repository
cd ~/path/to/tinyarms

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup script will:
1. ✓ Check prerequisites (Node.js, npm)
2. ✓ Install Ollama (if needed)
3. ✓ Create config directories
4. ✓ Install dependencies
5. ✓ Link CLI globally
6. ✓ Download embeddinggemma 300M (200MB) - semantic routing
7. ✓ Download Qwen2.5-Coder-3B-Instruct (1.9GB) - code linting

**Optional models** (install as needed):
- Qwen3-4B-Instruct (2.5GB) - general instruction-following tasks
- Gemma 3 4B (2.3GB) - file naming, markdown (can reuse from Cotypist)
- Qwen2.5-Coder 7B (4.7GB) - deep architectural analysis

### Manual Model Setup

**Core models** (required):

```bash
# Level 1: Semantic routing (200MB)
ollama pull embeddinggemma:300m

# Level 2: Code linting (1.9GB)
ollama pull qwen2.5-coder:3b
```

**Optional: General instruction-following** (install as needed):

```bash
# Level 2 Secondary: General tasks (2.5GB)
ollama pull qwen3:4b
```

**Optional: Reuse Cotypist's Gemma 3 4B** (for non-code tasks, saves 2.3GB):

```bash
# Create Modelfile pointing to Cotypist's model
cat > Modelfile << 'EOF'
FROM /Users/huy/Library/Application Support/app.cotypist.Cotypist/Models/gemma-3-4b-pt.i1-Q4_K_M.gguf
EOF

# Register with Ollama (symlink, not copy)
ollama create gemma3-4b -f Modelfile

# Verify
ollama list  # Should show gemma3-4b (2.3GB)
```

**Optional: Deep analysis** (install only if fast linting misses violations):

```bash
# Level 3: Architectural analysis (4.7GB)
ollama pull qwen2.5-coder:7b
```

**Storage breakdown**:
- **Core only**: 2.1GB (embeddinggemma 200MB + Qwen2.5-Coder-3B 1.9GB)
- **Core + Qwen3-4B**: 4.6GB (15.4GB free)
- **Core + Gemma 3 4B reused**: 2.1GB (no duplicate)
- **All models**: 9.3GB (10.7GB free)

## First Steps

### 1. Test the CLI

```bash
# Check system status
tinyarms status

# Should show:
# Ollama: ● Online
# Models: gemma3:4b
# Memory: 4.2GB / 16GB
```

### 2. Run Your First Skill

```bash
# Rename files in Downloads (dry run first)
tinyarms run file-naming ~/Downloads --dry-run

# Output:
# Would rename:
#   Screenshot 2024.png → hero-mockup-mobile.png
#   IMG_1234.jpg → golden-gate-sunset.jpg

# Apply changes
tinyarms run file-naming ~/Downloads
```

### 3. View Results

```bash
# See recent activity
tinyarms history --last 5

# View logs
tinyarms logs --skill file-naming
```

## Configuration

### Edit Config

```bash
# View current config
tinyarms config show

# Edit specific setting
tinyarms config set skills.file-naming.schedule "0 */2 * * *"

# Validate config
tinyarms config validate
```

### Configure Watch Folders (YOUR Paths)

Edit `~/.config/tinyarms/config.yaml`:

```yaml
models:
  level1: embeddinggemma:300m           # 200MB, semantic routing
  level2-code: qwen2.5-coder:3b         # 1.9GB, code linting (primary)
  level2-general: qwen3:4b              # 2.5GB, general tasks (optional)
  level2-specialist: gemma3-4b          # 2.3GB, file naming (optional)
  level3: qwen2.5-coder:7b              # 4.7GB, deep analysis (optional)

skills:
  # Fast code linting (pre-commit hooks)
  code-linting-fast:
    enabled: true
    model: level2-code                  # Qwen2.5-Coder-3B-Instruct
    constitution_path: ~/.specify/memory/constitution.md  # YOUR 17 principles
    priority: 2                         # Within seconds
    rules:
      - hardcoded-colors
      - magic-numbers
      - file-size
      - line-references
      - import-aliases

  # Deep code linting (weekly scans, optional)
  code-linting-deep:
    enabled: false                   # Enable if fast linting misses violations
    model: level3                    # Qwen2.5-Coder 7B (optional install)
    schedule: "0 2 * * 0"           # Sunday 2am
    rules:
      - architecture-first
      - complex-dry
      - component-decomposition

  # File naming (optional specialist)
  file-naming:
    enabled: true
    model: level2-specialist         # Gemma 3 4B (optional, reuse from Cotypist)
    schedule: "*/5 * * * *"          # Every 5 minutes (batch)
    watch_paths:
      - ~/Downloads/
      - ~/Desktop/

  markdown-analysis:
    enabled: true
    schedule: "0 */2 * * *"          # Every 2 hours
    watch_paths:
      - ~/.specify/memory/

  audio-actions:
    enabled: true
    model: level2-specialist         # Gemma 3 4B (optional)
    watch_paths:
      - ~/Documents/Transcriptions/  # MacWhisper exports
    extensions: [".txt"]
    debounce: 5  # Wait 5s after file created
    action_mode: suggest  # SUGGEST ACTIONS (not summary)

    # How to use:
    # 1. Transcribe audio in MacWhisper
    # 2. Click Export → Save as .txt to ~/Documents/Transcriptions/
    # 3. tinyArms auto-processes → suggests actions → notifies you
    #
    # See: docs/MACWHISPER-INTEGRATION.md for complete guide
```

## iOS Notification Setup (Pushover)

**Cost**: $5 one-time (no subscription)
**Why**: Extends notifications to iPhone/iPad, not just macOS

### Setup Pushover

1. **Purchase Pushover app** ($5 one-time)
   - iOS: https://apps.apple.com/app/pushover/id506088175
   - Android: https://play.google.com/store/apps/details?id=net.superblock.pushover

2. **Get API credentials**:
   - Sign up: https://pushover.net/signup
   - Create application: https://pushover.net/apps/build
   - Copy: **User Key** and **API Token**

3. **Configure tinyArms**:
   ```yaml
   # Edit ~/.config/tinyarms/config.yaml
   notifications:
     pushover:
       enabled: true
       user_key: YOUR_USER_KEY
       api_token: YOUR_API_TOKEN
   ```

4. **Test**:
   ```bash
   tinyarms run file-naming ~/Downloads --notify
   ```

Now you get tinyArms notifications on your iPhone/iPad!

---

## Using with AI Agents

### Claude Code Integration

Add to `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "tinyarms": {
      "command": "tinyarms",
      "args": ["mcp-server"]
    }
  }
}
```

Then in Claude Code:
```
You: "Lint all TypeScript files against our constitution"
Claude Code: [Uses TinyArms lint_code tool automatically]
```

### Aider Integration

```bash
# Aider can call TinyArms CLI directly
aider --message "Use tinyarms to rename these files properly"
```

### Cursor Integration

Add to `.cursor/mcp-servers.json`:

```json
{
  "tinyarms": {
    "command": "tinyarms mcp-server"
  }
}
```

## Automation Setup

### Enable Scheduled Tasks

LaunchAgents run tasks automatically:

```bash
# Check if agents are loaded
launchctl list | grep com.tinyarms

# Trigger manually (test)
launchctl kickstart gui/$UID/com.tinyarms.file-naming

# View logs
tail -f ~/.config/tinyarms/logs/file-naming.log
```

### Disable Automation

```bash
# Unload all agents
launchctl unload ~/Library/LaunchAgents/com.tinyarms.*.plist

# Or disable specific skill
tinyarms config set skills.file-naming.enabled false
```

## Common Tasks

### Rename Downloads Every 4 Hours

Already configured! Just ensure `file-naming` is enabled:

```bash
tinyarms skills list
# Should show: ● file-naming (scheduled)
```

### Lint Code Before Committing (Priority 2)

**Uses**: `~/.specify/memory/constitution.md` (YOUR 17 principles)
**Detects**: Hardcoded colors, magic numbers, DRY violations, file size >350 LOC

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Constitutional code linting (Priority 2: within seconds)
tinyarms run code-linting --json

if [ $? -ne 0 ]; then
  echo "❌ Constitutional violations detected. Fix or use --no-verify to bypass."
  exit 1
fi
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Analyze Markdown Changes Daily

```bash
# Enable markdown-analysis
tinyarms skills enable markdown-analysis

# It will run every 2 hours automatically
```

### Process Voice Transcriptions

```bash
# Run on-demand
tinyarms run voice-actions ~/Documents/Transcriptions/

# Or enable watching
tinyarms config set skills.voice-actions.enabled true
```

## Troubleshooting

### Ollama Not Running

```bash
# Start Ollama
ollama serve &

# Check status
tinyarms status
```

### Model Not Found

```bash
# List available models
ollama list

# Download missing model
ollama pull gemma3:4b-pt-q4_K_M
```

### LaunchAgent Not Running

```bash
# Check agent status
launchctl print gui/$UID/com.tinyarms.file-naming

# Look for errors in logs
cat ~/.config/tinyarms/logs/file-naming.error.log
```

### Low Memory

```bash
# Check memory usage
tinyarms status

# If >12GB used, unload heavy models
tinyarms models unload qwen2.5-coder:7b
```

## Performance Tips

### Speed Up Batch Operations

```bash
# Use cache for similar files
tinyarms run file-naming ~/Downloads/*.png
# First file: 3s, subsequent files: <1ms (cached)
```

### Reduce Battery Impact

```yaml
# Edit config.yaml
system:
  require_ac_power: true  # Only run scheduled tasks when plugged in
```

### Limit Memory Usage

```yaml
# Edit config.yaml
system:
  max_memory_mb: 8000  # Stop if exceeds 8GB
```

## Next Steps

1. **Customize Rules**
   - Edit `config.yaml` → `rules.file_types`
   - Add your own file type mappings
   - Test with: `tinyarms run file-naming --dry-run`

2. **Your Constitution** (for code linting)
   - Path: `~/.specify/memory/constitution.md` (YOUR 17 principles already exist!)
   - Detects: Hardcoded colors, magic numbers, DRY violations, file size >350 LOC
   - Test: `tinyarms run code-linting src/ --dry-run`
   - Use: Pre-commit hooks (Priority 2: within seconds)

3. **Build SwiftUI App** (optional)
   - Follow `docs/swiftui-app-ideations.md`
   - Beautiful native GUI for non-coders

4. **Share Your Config**
   - Export: `tinyarms config show > my-config.yaml`
   - Share with teammates
   - Import: `cp my-config.yaml ~/.config/tinyarms/config.yaml`

## Getting Help

```bash
# CLI help
tinyarms --help
tinyarms run --help

# View documentation
open docs/

# Check implementation details
open IMPLEMENTATION.md
```

## Useful Commands Cheat Sheet

```bash
# Status and monitoring
tinyarms status              # System overview
tinyarms history            # Recent tasks
tinyarms logs --tail 50     # Recent logs

# Running skills
tinyarms run <skill> [paths] --dry-run  # Preview
tinyarms run <skill> [paths] --json     # Machine readable
tinyarms run <skill> [paths] --verbose  # Debug mode

# Configuration
tinyarms config show                    # View all
tinyarms config get <key>              # Get value
tinyarms config set <key> <value>      # Set value
tinyarms config validate               # Check validity

# Skills management
tinyarms skills list                   # All skills
tinyarms skills info <name>            # Skill details
tinyarms skills enable <name>          # Enable
tinyarms skills disable <name>         # Disable

# Models management
tinyarms models list                   # Installed models
tinyarms models load <model>           # Load into memory
tinyarms models unload <model>         # Free memory

# MCP server
tinyarms mcp-server                    # Start server
tinyarms mcp-server --port 3000       # Custom port
```

## That's It!

You now have a fully functional local AI assistant. TinyArms will:

- ✓ Rename your downloads intelligently (batch every 5 mins)
- ✓ Lint code against YOUR constitution (`.specify/memory/constitution.md`)
- ✓ Analyze markdown changes (every 2 hours, `.specify/memory/`)
- ✓ Process MacWhisper transcriptions → **SUGGEST ACTIONS** (not summary)
- ✓ Work with AI coding agents (Claude Code, Aider, Cursor)
- ✓ Sync notifications to iOS (Pushover $5)
- ✓ Run automatically in the background

All 100% offline, using tiny models with helping arms! 🦖

---

## Why This Matters

**You're saving $120-240/year** compared to:
- GitHub Copilot: $10/month = $120/year
- Claude Pro: $20/month = $240/year
- TinyArms: $5 one-time (Pushover) + $0/month ongoing

**Plus**: 100% privacy (no cloud APIs), YOUR constitutional principles enforced, YOUR data stays local.

---

**Questions?** Check `IMPLEMENTATION.md` for detailed architecture info.

**Want to contribute?** The codebase is clean, well-documented, and ready for your improvements!
