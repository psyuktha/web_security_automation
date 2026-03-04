# How to Start ZAP

## Problem
Port 8080 is being used by your Vite frontend server. ZAP needs to run on a different port.

## Solution: Use Port 8090 for ZAP

### Option 1: Docker (Easiest)

```bash
# Stop any existing ZAP containers
docker stop $(docker ps -q --filter ancestor=owasp/zap2docker-stable) 2>/dev/null || true

# Start ZAP on port 8090
docker run -d -p 8090:8090 \
  -i owasp/zap2docker-stable zap.sh -daemon \
  -host 0.0.0.0 -port 8090 \
  -config api.disablekey=true \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true
```

### Option 2: Local ZAP Installation

If you have ZAP installed locally:

```bash
# Navigate to ZAP directory (usually in Applications or where you installed it)
cd /path/to/zap

# Start ZAP in daemon mode on port 8090
./zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true
```

### Option 3: Download and Run ZAP

1. Download ZAP from: https://www.zaproxy.org/download/
2. Extract the ZIP file
3. Run:
   ```bash
   cd zap_2.x.x
   ./zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true
   ```

## Verify ZAP is Running

Test if ZAP is accessible:

```bash
curl http://localhost:8090/JSON/core/view/version/
```

You should see JSON like:
```json
{"version":"2.x.x"}
```

If you see HTML (your frontend), ZAP is not running on that port.

## Update Environment Variables

Make sure your `server/.env` file has:

```env
ZAP_API_URL=http://localhost:8090
ZAP_API_KEY=  # Leave empty if api.disablekey=true
```

## Port Summary

- **Port 8080**: Vite frontend (your React app)
- **Port 8090**: ZAP API (for crawling)
- **Port 3001**: Backend server (Express API)

All three should run simultaneously!

## Troubleshooting

### "Connection refused" error
- ZAP is not running
- Start ZAP using one of the methods above

### "Port already in use"
- Another ZAP instance is running
- Stop it: `docker stop <container-id>` or kill the Java process

### Still getting HTML instead of JSON
- ZAP is not running on that port
- Check with: `lsof -i :8090`
- Make sure you're testing port 8090, not 8080
