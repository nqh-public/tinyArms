# 02 - Installation

**Complete installation guide for all configurations**

---

## Prerequisites

**See 00-GETTING-STARTED.md:8-13** for prerequisites checklist (macOS 12.0+, 8GB RAM, Node.js 18+, Ollama).

---

## Quick Install (Recommended)

\`\`\`bash
# 1. Clone repository
cd ~/path/to/tinyarms

# 2. Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
\`\`\`

The setup script will:
1. ✓ Check prerequisites (Node.js, npm, Ollama)
2. ✓ Install Ollama (if needed)
3. ✓ Create config directories
4. ✓ Install Node dependencies
5. ✓ Link CLI globally
6. ✓ Download core models

---

## Manual Installation

### 1. Install Ollama

\`\`\`bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
ollama --version
\`\`\`

### 2. Install Core Models

\`\`\`bash
# Level 1: Semantic routing (200MB)
ollama pull embeddinggemma:300m

# Level 2: Code linting (1.9GB)
ollama pull qwen2.5-coder:3b
\`\`\`

**Total**: 2.1GB (17.9GB remaining)

### 3. Install Optional Models

**General instruction-following:**
\`\`\`bash
ollama pull qwen3:4b  # 2.5GB
\`\`\`

**File naming (reuse from Cotypist):**
\`\`\`bash
cat > Modelfile << 'GEMMA_EOF'
FROM /Users/huy/Library/Application Support/app.cotypist.Cotypist/Models/gemma-3-4b-pt.i1-Q4_K_M.gguf
GEMMA_EOF

ollama create gemma3-4b -f Modelfile
rm Modelfile
\`\`\`

**Deep analysis:**
\`\`\`bash
ollama pull qwen2.5-coder:7b  # 4.7GB
\`\`\`

### 4. Setup tinyArms

\`\`\`bash
# Install dependencies
npm install

# Link CLI globally
npm link

# Verify installation
tinyarms --version
\`\`\`

---

## Post-Installation

### Verify Models

\`\`\`bash
ollama list

# Should show:
# embeddinggemma:300m     200MB
# qwen2.5-coder:3b        1.9GB
# (+ optional models)
\`\`\`

### Test CLI

\`\`\`bash
tinyarms status

# Should show:
# Ollama: ● Online
# Models: embeddinggemma:300m, qwen2.5-coder:3b
# Memory: 4.2GB / 16GB
\`\`\`

### Configure

\`\`\`bash
# Copy default config
mkdir -p ~/.config/tinyarms
cp config/default.yaml ~/.config/tinyarms/config.yaml

# Edit with your paths
nano ~/.config/tinyarms/config.yaml
\`\`\`

---

## LaunchAgent Installation

\`\`\`bash
# Install LaunchAgents (automated scheduling)
./scripts/install-launchagents.sh

# Verify
launchctl list | grep com.tinyarms
\`\`\`

---

## Troubleshooting

**See 02-TROUBLESHOOTING.md for common issues**
