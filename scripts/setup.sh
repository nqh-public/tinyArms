#!/bin/bash
# scripts/setup.sh
# 🦖 TinyArms Installation Script

set -e

echo "🦖 TinyArms Setup"
echo "=================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directories
TINYARMS_CONFIG="$HOME/.config/tinyarms"
LAUNCHAGENTS_DIR="$HOME/Library/LaunchAgents"
MODELS_DIR="$TINYARMS_CONFIG/models"
LOGS_DIR="$TINYARMS_CONFIG/logs"

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."

if ! check_command node; then
    print_error "Node.js not found. Please install Node.js 18+ first."
    echo "  Visit: https://nodejs.org"
    exit 1
fi
print_success "Node.js found: $(node --version)"

if ! check_command npm; then
    print_error "npm not found. Please install npm first."
    exit 1
fi
print_success "npm found: $(npm --version)"

if ! check_command ollama; then
    print_warning "Ollama not found. Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    if ! check_command ollama; then
        print_error "Failed to install Ollama"
        exit 1
    fi
    print_success "Ollama installed"
else
    print_success "Ollama found: $(ollama --version)"
fi

# Step 2: Create directories
echo ""
echo "Step 2: Creating directories..."

mkdir -p "$TINYARMS_CONFIG"
mkdir -p "$MODELS_DIR"
mkdir -p "$LOGS_DIR"
mkdir -p "$TINYARMS_CONFIG/skills"
mkdir -p "$TINYARMS_CONFIG/cache"

print_success "Created TinyArms directories"

# Step 3: Install npm dependencies
echo ""
echo "Step 3: Installing dependencies..."

npm install
npm run build

print_success "Dependencies installed"

# Step 4: Link CLI globally
echo ""
echo "Step 4: Installing CLI..."

npm link

print_success "TinyArms CLI installed globally"
print_success "Test with: tinyarms --version"

# Step 5: Create default config
echo ""
echo "Step 5: Setting up configuration..."

if [ ! -f "$TINYARMS_CONFIG/config.yaml" ]; then
    cp config/default.yaml "$TINYARMS_CONFIG/config.yaml"
    
    # Customize paths in config
    sed -i.bak "s|~|$HOME|g" "$TINYARMS_CONFIG/config.yaml"
    rm "$TINYARMS_CONFIG/config.yaml.bak"
    
    print_success "Created default config at $TINYARMS_CONFIG/config.yaml"
else
    print_warning "Config already exists, skipping"
fi

# Step 6: Check and download models
echo ""
echo "Step 6: Setting up AI models..."

# Start Ollama server if not running
if ! pgrep -x "ollama" > /dev/null; then
    print_warning "Starting Ollama server..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi

# Check for Gemma 3 4B
echo "Checking for Gemma 3 4B..."
if ! ollama list | grep -q "gemma3-4b"; then
    print_warning "Gemma 3 4B not found. Downloading (this may take a while)..."
    ollama pull gemma3:4b-pt-q4_K_M
    print_success "Gemma 3 4B downloaded"
else
    print_success "Gemma 3 4B already available"
fi

# Check for Qwen 7B (optional, only if user wants code linting)
read -p "Download Qwen2.5-Coder 7B for code linting? (4.7GB, optional) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! ollama list | grep -q "qwen2.5-coder"; then
        print_warning "Downloading Qwen2.5-Coder 7B..."
        ollama pull qwen2.5-coder:7b-instruct-q4_K_M
        print_success "Qwen2.5-Coder 7B downloaded"
    else
        print_success "Qwen2.5-Coder 7B already available"
    fi
else
    print_warning "Skipping Qwen2.5-Coder 7B (you can install it later with: ollama pull qwen2.5-coder:7b-instruct-q4_K_M)"
fi

# Step 7: Install LaunchAgents (optional)
echo ""
echo "Step 7: Setting up automation..."

read -p "Install LaunchAgents for scheduled tasks? [Y/n]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    mkdir -p "$LAUNCHAGENTS_DIR"
    
    # Generate LaunchAgent plists
    for skill in file-naming markdown-analysis; do
        plist="com.tinyarms.$skill.plist"
        
        cat > "$LAUNCHAGENTS_DIR/$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tinyarms.$skill</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which tinyarms)</string>
        <string>run</string>
        <string>$skill</string>
        <string>--json</string>
    </array>
    <key>StartInterval</key>
    <integer>14400</integer>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$LOGS_DIR/$skill.log</string>
    <key>StandardErrorPath</key>
    <string>$LOGS_DIR/$skill.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
        <key>OLLAMA_HOST</key>
        <string>http://localhost:11434</string>
    </dict>
</dict>
</plist>
EOF
        
        # Load agent
        launchctl load "$LAUNCHAGENTS_DIR/$plist" 2>/dev/null || true
        print_success "Installed LaunchAgent: $skill"
    done
    
    print_success "LaunchAgents installed"
    echo "  View status: launchctl list | grep com.tinyarms"
else
    print_warning "Skipping LaunchAgent installation"
fi

# Step 8: Test installation
echo ""
echo "Step 8: Testing installation..."

if tinyarms status --json > /dev/null 2>&1; then
    print_success "TinyArms is working!"
else
    print_error "TinyArms test failed"
    exit 1
fi

# Done!
echo ""
echo "🦖 TinyArms setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure your skills: tinyarms config show"
echo "  2. Run a skill: tinyarms run file-naming ~/Downloads"
echo "  3. Check status: tinyarms status"
echo "  4. View logs: tinyarms logs"
echo ""
echo "For more help: tinyarms --help"
echo ""
