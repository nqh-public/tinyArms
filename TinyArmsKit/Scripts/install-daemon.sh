#!/bin/bash
# Install tinyArms daemon as LaunchAgent

set -e

echo "Installing tinyArms daemon..."

# Check if app exists
APP_PATH="/Applications/TinyArms.app"
if [ ! -d "$APP_PATH" ]; then
    echo "Error: TinyArms.app not found at $APP_PATH"
    echo "Please build and copy the app to /Applications first"
    exit 1
fi

# Create LaunchAgents directory if it doesn't exist
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$LAUNCH_AGENTS_DIR"

# Copy plist
PLIST_SOURCE="$(dirname "$0")/../Resources/com.tinyarms.daemon.plist"
PLIST_DEST="$LAUNCH_AGENTS_DIR/com.tinyarms.daemon.plist"

if [ -f "$PLIST_DEST" ]; then
    echo "Unloading existing daemon..."
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

echo "Copying LaunchAgent plist..."
cp "$PLIST_SOURCE" "$PLIST_DEST"

# Load daemon
echo "Loading daemon..."
launchctl load "$PLIST_DEST"

echo "✅ tinyArms daemon installed successfully!"
echo ""
echo "The daemon will:"
echo "  - Auto-start on login"
echo "  - Watch ~/Downloads, ~/Desktop, ~/Documents for file changes"
echo "  - Show menu bar icon"
echo ""
echo "To uninstall, run: ./Scripts/uninstall-daemon.sh"
