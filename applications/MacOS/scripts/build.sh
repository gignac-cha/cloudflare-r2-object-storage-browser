#!/bin/bash
set -e  # Exit on error

CONFIGURATION="${1:-Debug}"  # Default to Debug, accept Release as argument
APP_NAME="CloudflareR2ObjectStorageBrowser"

echo "🔨 Building macOS app (Configuration: $CONFIGURATION)..."

# Build the Xcode project
xcodebuild \
  -project "${APP_NAME}.xcodeproj" \
  -scheme "$APP_NAME" \
  -configuration "$CONFIGURATION" \
  -derivedDataPath ./build \
  build

# Determine the app path based on configuration
APP_PATH="./build/Build/Products/${CONFIGURATION}/${APP_NAME}.app"

if [ ! -d "$APP_PATH" ]; then
  echo "❌ Error: App bundle not found at $APP_PATH"
  exit 1
fi

echo "✅ App built successfully"

# Create Resources directory if it doesn't exist
RESOURCES_DIR="${APP_PATH}/Contents/Resources"
mkdir -p "$RESOURCES_DIR"

# Copy server.js from API package
API_SERVER="../../packages/api/outputs/server.js"

if [ ! -f "$API_SERVER" ]; then
  echo "⚠️  Warning: server.js not found at $API_SERVER"
  echo "   Run 'pnpm build:api' first to build the API server"
  exit 1
fi

echo "📦 Copying server.js into app bundle..."
cp "$API_SERVER" "$RESOURCES_DIR/server.js"

echo "✅ server.js copied to $RESOURCES_DIR/server.js"
echo ""
echo "🎉 Build complete: $APP_PATH"
