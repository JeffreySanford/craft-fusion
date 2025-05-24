#!/bin/bash

# Fix npm python configuration warning
# This script removes the deprecated python configuration from npm

echo "🔧 Fixing npm python configuration warning..."

# Check if python config exists
PYTHON_CONFIG=$(npm config get python 2>/dev/null)

if [ "$PYTHON_CONFIG" != "undefined" ] && [ ! -z "$PYTHON_CONFIG" ]; then
    echo "📝 Found python config: $PYTHON_CONFIG"
    echo "🗑️  Removing deprecated python configuration..."
    npm config delete python
    echo "✅ Python configuration removed"
else
    echo "ℹ️  No python configuration found in npm config"
fi

# Check for global python config
GLOBAL_PYTHON_CONFIG=$(npm config get python --global 2>/dev/null)

if [ "$GLOBAL_PYTHON_CONFIG" != "undefined" ] && [ ! -z "$GLOBAL_PYTHON_CONFIG" ]; then
    echo "📝 Found global python config: $GLOBAL_PYTHON_CONFIG"
    echo "🗑️  Removing deprecated global python configuration..."
    npm config delete python --global
    echo "✅ Global python configuration removed"
else
    echo "ℹ️  No global python configuration found"
fi

# Alternative: Check for .npmrc files with python config
echo "🔍 Checking for .npmrc files with python configuration..."

# Check local .npmrc
if [ -f ".npmrc" ]; then
    if grep -q "python" .npmrc; then
        echo "📁 Found python config in local .npmrc"
        echo "🔧 Removing python lines from .npmrc..."
        sed -i '/python/d' .npmrc
        echo "✅ Local .npmrc cleaned"
    fi
fi

# Check global .npmrc
GLOBAL_NPMRC="$HOME/.npmrc"
if [ -f "$GLOBAL_NPMRC" ]; then
    if grep -q "python" "$GLOBAL_NPMRC"; then
        echo "📁 Found python config in global .npmrc"
        echo "🔧 Removing python lines from global .npmrc..."
        sed -i '/python/d' "$GLOBAL_NPMRC"
        echo "✅ Global .npmrc cleaned"
    fi
fi

echo "🎉 npm python configuration cleanup complete!"
echo ""
echo "💡 The python config was deprecated because:"
echo "   - npm now uses node-gyp's built-in Python detection"
echo "   - Manual python path configuration is no longer needed"
echo "   - This will prevent warnings in future npm versions"
