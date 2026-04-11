# How to Check if ZAP is Running

## Quick Check Commands

Run these commands in your terminal:

### 1. Check if ZAP is running on port 8090 (recommended port)

```bash
curl http://localhost:8090/JSON/core/view/version/
```

**Expected response (ZAP is running):**
```json
{"version":"2.14.0"}
```

**If you get:** Connection refused or HTML → ZAP is NOT running on port 8090

### 2. Check if ZAP is running on port 8080

```bash
curl http://localhost:8080/JSON/core/view/version/
```

**Note:** If you get HTML (your frontend), ZAP is NOT running on port 8080.

### 3. Check what's using the ports

```bash
lsof -i :8090
lsof -i :8080
```

This shows which processes are using these ports.

### 4. Find ZAP installation location

```bash
# Common locations on macOS:
which zap.sh
# or
find /Applications -name "zap.sh" 2>/dev/null
# or
find ~ -name "zap.sh" 2>/dev/null
```

## How to Start ZAP

Once you find where ZAP is installed, start it:

### Method 1: Daemon Mode (Recommended for API)

```bash
cd /path/to/zap
./zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true
```

### Method 2: GUI Mode (for testing)

```bash
cd /path/to/zap
./zap.sh
```

Then in the GUI:
- Go to Tools → Options → API
- Enable API
- Set port to 8090
- Disable API key

## Verify ZAP Started Successfully

After starting ZAP, test it:

```bash
curl http://localhost:8090 -9/JSON/core/view/version/
```

You should see JSON with the version number.

## Common ZAP Installation Paths on macOS

- `/Applications/OWASP ZAP.app/Contents/Java/zap.sh`
- `~/ZAP/zap.sh`
- `/usr/local/bin/zap.sh`
- `/opt/zap/zap.sh`

## Quick Start Script

Create a file `start-zap.sh`:

```bash
#!/bin/bash
# Find and start ZAP
ZAP_PATH=$(find /Applications -name "zap.sh" 2>/dev/null | head -1)

if [ -z "$ZAP_PATH" ]; then
    ZAP_PATH=$(find ~ -name "zap.sh" 2>/dev/null | head -1)
fi

if [ -z "$ZAP_PATH" ]; then
    echo "❌ ZAP not found. Please install ZAP first."
    exit 1
fi

echo "✅ Found ZAP at: $ZAP_PATH"
echo "🚀 Starting ZAP on port 8090..."

cd "$(dirname "$ZAP_PATH")"
./zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true

echo "✅ ZAP started. Test with: curl http://localhost:8090/JSON/core/view/version/"
```

Make it executable:
```bash
chmod +x start-zap.sh
./start-zap.sh
```

## Troubleshooting

### "Command not found: zap.sh"
- ZAP is not in your PATH
- Find it using the `find` commands above
- Use the full path: `/path/to/zap/zap.sh`

### "Port already in use"
- Another ZAP instance is running
- Kill it: `pkill -f zap.sh`
- Or find the process: `lsof -i :8090` then `kill <PID>`

### "Permission denied"
- Make zap.sh executable: `chmod +x zap.sh`

### Still getting HTML instead of JSON
- ZAP is not running on that port
- Check which port ZAP is actually using
- Make sure you're testing the correct port (8090, not 8080)
