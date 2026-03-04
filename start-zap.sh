#!/bin/bash

# Script to find and start ZAP on port 8090

echo "🔍 Looking for ZAP installation..."

# Common locations on macOS
ZAP_PATHS=(
    "/Applications/OWASP ZAP.app/Contents/Java/zap.sh"
    "$HOME/ZAP/zap.sh"
    "$HOME/Downloads/ZAP/zap.sh"
    "/usr/local/bin/zap.sh"
    "/opt/zap/zap.sh"
)

ZAP_PATH=""

# Check common paths first
for path in "${ZAP_PATHS[@]}"; do
    if [ -f "$path" ]; then
        ZAP_PATH="$path"
        echo "✅ Found ZAP at: $ZAP_PATH"
        break
    fi
done

# If not found, search
if [ -z "$ZAP_PATH" ]; then
    echo "🔍 Searching for ZAP..."
    ZAP_PATH=$(find /Applications -name "zap.sh" 2>/dev/null | head -1)
    
    if [ -z "$ZAP_PATH" ]; then
        ZAP_PATH=$(find "$HOME" -name "zap.sh" 2>/dev/null | head -1)
    fi
fi

if [ -z "$ZAP_PATH" ]; then
    echo "❌ ZAP not found!"
    echo ""
    echo "Please:"
    echo "1. Download ZAP from: https://www.zaproxy.org/download/"
    echo "2. Extract it"
    echo "3. Run this script again, or start ZAP manually:"
    echo "   cd /path/to/zap"
    echo "   ./zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true"
    exit 1
fi

# Check if ZAP is already running
if curl -s http://localhost:8090/JSON/core/view/version/ > /dev/null 2>&1; then
    echo "✅ ZAP is already running on port 8090"
    curl http://localhost:8090/JSON/core/view/version/
    exit 0
fi

# Get directory
ZAP_DIR=$(dirname "$ZAP_PATH")
cd "$ZAP_DIR" || exit 1

echo "🚀 Starting ZAP on port 8090..."
echo "   (This may take a few seconds)"

# Start ZAP in daemon mode
./zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true &

# Wait a bit for ZAP to start
sleep 5

# Check if it started
if curl -s http://localhost:8090/JSON/core/view/version/ > /dev/null 2>&1; then
    echo "✅ ZAP started successfully!"
    echo ""
    echo "Version:"
    curl -s http://localhost:8090/JSON/core/view/version/ | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8090/JSON/core/view/version/
    echo ""
    echo "✅ ZAP is ready to use!"
else
    echo "⚠️  ZAP may still be starting. Wait a few more seconds and test with:"
    echo "   curl http://localhost:8090/JSON/core/view/version/"
fi
