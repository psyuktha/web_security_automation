# Security Scan System Setup Guide

This guide will help you set up the complete security scanning system with ZAP crawling, Gemini AI payload generation, and SQL injection testing.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (running locally or remote)
3. **OWASP ZAP** (for website crawling)
4. **Google Gemini API Key** (for AI-powered payload generation)

## Step 1: Install Dependencies

```bash
cd server
npm install
```

This will install:
- `@google/generative-ai` - Gemini AI SDK
- `axios` - HTTP client for API calls
- `zaproxy` - ZAP API client (if available, otherwise we use direct HTTP)

## Step 2: Set Up OWASP ZAP

### Option A: Docker (Recommended)

```bash
# Run ZAP in daemon mode on port 8090 (8080 is used by frontend)
docker run -d -p 8090:8090 \
  -i owasp/zap2docker-stable zap.sh -daemon \
  -host 0.0.0.0 -port 8090 \
  -config api.disablekey=true \
  -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true
```

### Option B: Local Installation

1. Download ZAP from: https://www.zaproxy.org/download/
2. Start ZAP in daemon mode on port 8090:
   ```bash
   zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true
   ```

### Verify ZAP is Running

```bash
curl http://localhost:8090/JSON/core/view/version/
```

**Note:** Port 8080 is used by your Vite frontend. ZAP must run on port 8090.

You should see a JSON response with ZAP version.

## Step 3: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 4: Configure Environment Variables

Create or update `server/.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=redteam_scanner

# Server Configuration
PORT=3001

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# ZAP Configuration (use 8090, not 8080 - frontend uses 8080)
ZAP_API_URL=http://localhost:8090
ZAP_API_KEY=  # Leave empty if api.disablekey=true

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

## Step 5: Start the System

### Terminal 1: Start MongoDB
```bash
brew services start mongodb-community
# or
mongod --dbpath /usr/local/var/mongodb
```

### Terminal 2: Start ZAP (if not using Docker)
```bash
zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true
```

### Terminal 3: Start Backend Server
```bash
cd server
npm start
```

### Terminal 4: Start Frontend
```bash
npm run dev
```

## Step 6: Test the System

1. Open http://localhost:8080 (frontend)
2. Log in or sign up
3. Enter a target URL (e.g., `http://testphp.vulnweb.com`)
4. Select "SQL Injection" attack type
5. Click "Start Scan"

The system will:
1. ✅ Crawl the website using ZAP
2. ✅ Discover endpoints and parameters
3. ✅ Generate SQL injection payloads using Gemini AI
4. ✅ Perform attacks on discovered endpoints
5. ✅ Generate a comprehensive report

## How It Works

### 1. Crawling Phase (ZAP)
- ZAP spider crawls the target website
- Discovers all URLs and endpoints
- Extracts parameters from URLs and forms
- Returns list of endpoints with parameters

### 2. Payload Generation (Gemini AI)
- For each endpoint with parameters
- Gemini AI generates context-aware SQL injection payloads
- Includes various attack techniques (UNION, time-based, error-based, etc.)
- Returns optimized payload list

### 3. Attack Phase
- Tests each endpoint with each payload
- Monitors responses for SQL error patterns
- Detects vulnerabilities based on error messages
- Records evidence and response details

### 4. Report Generation
- Compiles all findings
- Categorizes by severity
- Provides recommendations
- Saves to MongoDB

## Troubleshooting

### ZAP Connection Issues

**Error: "Failed to initialize ZAP"**
- Check if ZAP is running: `curl http://localhost:8090/JSON/core/view/version/`
- Verify ZAP_API_URL in `.env` is set to `http://localhost:8090` (NOT 8080)
- If using Docker, check container logs: `docker logs <container-id>`
- Make sure port 8090 is not blocked by firewall

**Error: "Spider scan timeout"**
- Increase `maxWaitTime` in `zapCrawler.js`
- Check if target website is accessible
- Some websites block automated crawlers

### Gemini API Issues

**Error: "GEMINI_API_KEY not set"**
- Add your Gemini API key to `server/.env`
- Restart the backend server after adding the key

**Error: "Failed to generate payloads"**
- Check your API key is valid
- Verify you have API quota remaining
- System will fallback to standard payloads if Gemini fails

### Scan Timeout

- Large websites may take 10+ minutes to scan
- Check scan history for completed scans
- Increase timeout in frontend if needed

## Security Notes

⚠️ **Important:**
- Only scan websites you own or have permission to test
- Unauthorized scanning is illegal
- Use responsibly and ethically
- This tool is for educational and authorized security testing only

## Next Steps

- Add support for other attack types (XSS, Command Injection, etc.)
- Implement time-based SQL injection detection
- Add baseline comparison for boolean-based detection
- Enhance report generation with PDF export
- Add scan scheduling and automation

## Support

If you encounter issues:
1. Check server logs in terminal
2. Check browser console for frontend errors
3. Verify all services are running (MongoDB, ZAP, Backend)
4. Review environment variables
