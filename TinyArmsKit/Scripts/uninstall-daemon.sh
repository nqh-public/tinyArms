#!/bin/bash
# Uninstall tinyArms daemon

set -e

echo "Uninstalling tinyArms daemon..."

PLIST_PATH="$HOME/Library/LaunchAgents/com.tinyarms.daemon.plist"

if [ -f "$PLIST_PATH" ]; then
    echo "Unloading daemon..."
    launchctl unload "$PLIST_PATH" 2>/dev/null || true

    echo "Removing plist..."
    rm "$PLIST_PATH"

    echo "✅ tinyArms daemon uninstalled successfully!"
else
    echo "ℹ️  Daemon not installed (plist not found)"
fi

echo ""
echo "Note: The app bundle at /Applications/TinyArms.app was not removed."
echo "Delete manually if you want to completely remove tinyArms."
