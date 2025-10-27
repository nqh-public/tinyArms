# 00 - Getting Started

**Get tinyArms running in 10 minutes!**

---

## Prerequisites

- **macOS 12.0+** (Apple Silicon recommended)
- **16GB RAM** (M2 MacBook Air confirmed compatible)
- **20GB free storage** (will use ~5.9GB new)
- **Node.js 18+**
- **Optional**: Cotypist installed (to reuse Gemma 3 4B model)

---

## Quick Install

```bash
# 1. Clone repository
cd ~/path/to/tinyarms

# 2. Run setup script
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

---

## Core Models (Required)

```bash
# Level 1: Semantic routing (200MB)
ollama pull embeddinggemma:300m

# Level 2: Code linting (1.9GB)
ollama pull qwen2.5-coder:3b
```

**Total**: 2.1GB (17.9GB remaining)

---

## Optional Models

### General instruction-following tasks

```bash
# Level 2 Secondary: General tasks (2.5GB)
ollama pull qwen3:4b
```

### File naming, markdown analysis (reuse from Cotypist)

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

### Deep architectural analysis (weekly scans)

```bash
# Level 3: Architectural analysis (4.7GB)
# Install ONLY if fast linting misses violations
ollama pull qwen2.5-coder:7b
```

---

## Storage Breakdown

| Configuration | Storage | Free |
|--------------|---------|------|
| **Core only** | 2.1GB | 17.9GB |
| **Core + Qwen3-4B** | 4.6GB | 15.4GB |
| **Core + Gemma 3 4B reused** | 2.1GB | 17.9GB (no duplicate) |
| **All models** | 9.3GB | 10.7GB |

---

## First Test

```bash
# Check system status
tinyarms status

# Should show:
# Ollama: ● Online
# Models: embeddinggemma:300m, qwen2.5-coder:3b
# Memory: 4.2GB / 16GB
```

---

## Test a Skill

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

---

## Minimal Configuration

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
    constitution_path: ~/.specify/memory/constitution.md
    priority: 2                         # Within seconds

  # File naming (optional specialist)
  file-naming:
    enabled: true
    model: level2-specialist            # Gemma 3 4B (optional)
    watch_paths:
      - ~/Downloads/
      - ~/Desktop/

  # Markdown detection
  markdown-analysis:
    enabled: true
    watch_paths:
      - ~/.specify/memory/

  # Voice transcriptions
  audio-actions:
    enabled: true
    model: level2-specialist            # Gemma 3 4B (optional)
    watch_paths:
      - ~/Documents/Transcriptions/
```

---

## Validation

```bash
# View recent activity
tinyarms history --last 5

# View logs
tinyarms logs --skill file-naming

# Configure a skill
tinyarms skills enable code-linting
```

---

## Next Steps

1. **Learn Architecture**: Read [01-ARCHITECTURE.md](01-ARCHITECTURE.md)
2. **Configure Skills**: Read [02-CONFIGURATION.md](02-CONFIGURATION.md)
3. **Install Additional Models**: Read [01-MODELS.md](01-MODELS.md)
4. **Troubleshooting**: Read [02-TROUBLESHOOTING.md](02-TROUBLESHOOTING.md)

---

**Note**: This is a reference implementation (0% executable code). Commands shown are for design illustration, not actual execution.
