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

## Installation

**See 02-INSTALLATION.md for setup steps**:
- Ollama installation: 02-INSTALLATION.md:39-48
- Model installation: 02-INSTALLATION.md:49-81
- Verification: 02-INSTALLATION.md:100-109

**Quick Install**:
```bash
cd ~/path/to/tinyarms
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Storage**: 2.1GB (core models) to 12.6GB (all models)

**See 01-MODELS.md for model details**:
- Model benchmarks: 01-MODELS.md:22-194
- Storage breakdowns: 01-MODELS.md:197-236

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

## Configuration

**See 02-CONFIGURATION.md for config options**:
- Minimal config: 02-CONFIGURATION.md:57-76
- Balanced config: 02-CONFIGURATION.md:80-136
- Complete config: 02-CONFIGURATION.md:140-213

**Quick Config**:
```bash
mkdir -p ~/.config/tinyarms
cp config/default.yaml ~/.config/tinyarms/config.yaml
nano ~/.config/tinyarms/config.yaml
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
