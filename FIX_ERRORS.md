# Fixing Common Errors

## Error 1: ZAP Returns HTML Instead of JSON

**Symptoms:**
```
🔍 ZAP API Response: "<!doctype html>..."
❌ ZAP did not return a valid scan ID
```

**Cause:** ZAP is not running, or `ZAP_API_URL` is pointing to the wrong port (your frontend on 8080 instead of ZAP on 8090).

**Solution:**

1. **Check if ZAP is running:**
   ```bash
   curl http://localhost:8090/JSON/core/view/version/
   ```
   
   **Expected:** JSON like `{"version":"2.x.x"}`
   
   **If you get HTML:** ZAP is not running on port 8090

2. **Start ZAP:**
   
   **Option A: Docker (Recommended)**
   ```bash
   docker run -d -p 8090:8090 \
     -i owasp/zap2docker-stable zap.sh -daemon \
     -host 0.0.0.0 -port 8090 \
     -config api.disablekey=true \
     -config api.addrs.addr.name=.* \
     -config api.addrs.addr.regex=true
   ```
   
   **Option B: Local Installation**
   ```bash
   ./zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true
   ```

3. **Check your `.env` file:**
   
   Create `server/.env` if it doesn't exist:
   ```env
   ZAP_API_URL=http://localhost:8090
   ZAP_API_KEY=
   ```
   
   **Important:** Make sure it's port **8090**, NOT 8080!

4. **Restart your backend:**
   ```bash
   cd server
   npm start
   ```

## Error 2: Gemini API 404 Error

**Symptoms:**
```
❌ Error generating payloads with Gemini: [404 Not Found] models/gemini-pro is not found
```

**Cause:** The model name `gemini-pro` is deprecated or not available.

**Solution:**

The code has been updated to automatically try:
1. `gemini-1.5-pro` (first choice)
2. `gemini-1.5-flash` (fallback)

**If you still get errors:**

1. **Check your API key:**
   - Get it from: https://makersuite.google.com/app/apikey
   - Make sure it's set in `server/.env`:
     ```env
     GEMINI_API_KEY=your-actual-api-key-here
     ```

2. **Verify the model is available:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
   ```

3. **The system will use fallback payloads if Gemini fails**, so scans will still work!

## Error 3: Port Conflicts

**Ports Used:**
- **8080:** Frontend (Vite dev server)
- **8090:** ZAP API (must be running here)
- **3001:** Backend (Express server)

**Make sure all three are running:**
```bash
# Check what's using each port
lsof -i :8080  # Should be your frontend
lsof -i :8090  # Should be ZAP
lsof -i :3001  # Should be your backend
```

## Quick Fix Checklist

- [ ] ZAP is running on port 8090
- [ ] `server/.env` has `ZAP_API_URL=http://localhost:8090`
- [ ] `server/.env` has `GEMINI_API_KEY=your-key` (optional, fallback payloads work)
- [ ] Backend restarted after changing `.env`
- [ ] All three services running (frontend:8080, ZAP:8090, backend:3001)

## Test Everything Works

```bash
# 1. Test ZAP
curl http://localhost:8090/JSON/core/view/version/
# Should return: {"version":"..."}

# 2. Test Backend
curl http://localhost:3001/api/health
# Should return: {"status":"ok"}

# 3. Test Frontend
curl http://localhost:8080
# Should return: HTML (your React app)
```

## Still Having Issues?

1. **Check server logs** for detailed error messages
2. **Verify ZAP is accessible** from your machine (not just Docker network)
3. **Check firewall** isn't blocking port 8090
4. **Try restarting everything** in order:
   - ZAP first
   - Backend second  
   - Frontend last
