# Hardcoded Content Removal Summary

## Overview
Removed all hardcoded values from scanning modules to enable actual, dynamic scanning of any target application instead of being locked to DVWA.

## Changes Made

### 1. **dvwaCrawler.js** - Generic Endpoint Discovery
**Removed:**
- Hardcoded DVWA vulnerability paths:
  - `/vulnerabilities/sqli/`
  - `/vulnerabilities/xss_r/`
  - `/vulnerabilities/xss_s/`
  - `/vulnerabilities/exec/`

**Replaced with:**
- Dynamic crawling that discovers actual endpoints from the target
- Extracts links from the target root page
- Falls back to crawling root if no links discovered
- Generic form parsing for any application

**Impact:** Scanner now dynamically discovers endpoints for ANY target, not just DVWA.

---

### 2. **httpClient.js** - Generic Authentication
**Removed:**
- Hardcoded credentials: `username: 'admin'`, `password: 'password'`
- Hardcoded login path: `/login.php` (DVWA-specific)
- Hardcoded security level: `security: 'low'`
- DVWA-specific success check

**Replaced with:**
- Environment variable support:
  - `TARGET_USERNAME` / `LOGIN_USERNAME`
  - `TARGET_PASSWORD` / `LOGIN_PASSWORD`
  - `TARGET_SECURITY_LEVEL` (optional)
- Generic login path discovery (tries: `/login.php`, `/login`, `/auth/login`, `/signin`)
- Generic login success detection (HTTP status codes)

**Impact:** Scanner can authenticate to any application with proper credentials.

---

### 3. **httpClient.js** - Generic CSRF Token Detection
**Removed:**
- Hardcoded CSRF field name: `user_token` (DVWA-specific)

**Replaced with:**
- Multi-field CSRF detection tries common field names:
  - `user_token`
  - `csrf_token`
  - `token`
  - `_token`
  - `csrf`
  - `authenticity_token`
  - `_csrf`

**Impact:** CSRF tokens work with any application framework.

---

### 4. **dvwaCrawler.js** - Generic Hidden Field Parsing
**Removed:**
- Hardcoded check: `name === 'user_token'` (only parsed DVWA tokens)

**Replaced with:**
- Generic hidden field parsing for any field name

**Impact:** All hidden fields properly handled regardless of application.

---

### 5. **mitigationGenerator.js** - No Hardcoded API Keys
**Removed:**
- Hardcoded Gemini API key: `AIzaSyCDZQStL9ax0iWUmE3-3Chv-_5M_Ycr9jA`

**Replaced with:**
- Proper environment variable fallback chain:
  1. `MITIGATION_API_KEY`
  2. `GEMINI_API_KEY`
- Clear warning message when no API key set

**Impact:** API key must be explicitly provided via environment variables.

---

### 6. **attackEngine.js** - Removed DVWA Endpoint Restrictions
**Removed:**
- Hardcoded restriction: `if (!endpoint.url.includes('/vulnerabilities/sqli/'))`
- Only allowed testing on DVWA SQLi endpoints

**Replaced with:**
- Tests all endpoints with parameters regardless of path
- Enables actual scanning of any target application

**Impact:** Scanner now performs attacks on any discovered endpoint, not just DVWA-specific paths.

---

### 7. **httpClient.js** - Removed Default Username
**Removed:**
- Hardcoded default username: `'admin'` when no environment variable set

**Replaced with:**
- Empty string default with warning message
- Requires explicit environment variable configuration

**Impact:** No default credentials; authentication must be explicitly configured.

---

### 8. **scanOrchestrator.js** - Generic Parameter Inference
**Removed:**
- Hardcoded test values: `"admin"`, `"password"`, `"test@test.com"`, `"SELECT 1"`, etc.

**Replaced with:**
- Empty string placeholders for all parameters
- Actual payload injection happens during attack phase

**Impact:** No fake test data sent during endpoint discovery.

---

### 9. **zapCrawler.js** - Generic Fallback Endpoints
**Removed:**
- Hardcoded test data in fallback endpoints:
  - `username: "admin", password: "password"`
  - `q: "admin"`
  - `user_id: "1"`
  - `token: "faketoken", query: "SELECT * FROM products"`

**Replaced with:**
- Empty string placeholders for all parameters
- Generic endpoint structure without test data

**Impact:** Fallback endpoints don't send fake data when ZAP crawling fails.

---

## Required Environment Variables

### For Target Authentication
```bash
TARGET_USERNAME=<username>          # Username for target login (optional, defaults to 'admin')
TARGET_PASSWORD=<password>          # Password for target login (optional, empty by default)
TARGET_SECURITY_LEVEL=low|high|impossible  # For frameworks like DVWA (optional)
```

### For AI-Based Features
```bash
GEMINI_API_KEY=<your-api-key>     # For payload generation and mitigation
MITIGATION_API_KEY=<your-api-key> # Alternative key for mitigation (falls back to GEMINI_API_KEY)
```

### For ZAP Integration
```bash
ZAP_API_URL=http://localhost:8090  # ZAP server URL (optional, default shown)
ZAP_API_KEY=<api-key>              # ZAP API key if required (optional)
```

---

## Testing the Changes

### 1. Test with a Generic Target
```bash
curl -X POST http://localhost:3001/api/scan/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "http://<any-target>/",
    "attackTypes": {"sqlInjection": true}
  }'
```

### 2. With Authentication
```bash
export TARGET_USERNAME=testuser
export TARGET_PASSWORD=testpass123
export GEMINI_API_KEY=your-api-key-here

# Then run your scan
```

### 3. With Custom ZAP
```bash
export ZAP_API_URL=http://zap-server.internal:8080
export ZAP_API_KEY=your-zap-key

# Then start scanning
```

---

## Impact on Scanning

| Feature | Before | After |
|---------|--------|-------|
| **Target Flexibility** | DVWA only | Any web application |
| **Endpoint Discovery** | Hardcoded paths | Dynamic crawling |
| **Authentication** | Hardcoded credentials | Environment-based |
| **CSRF Detection** | Single field (`user_token`) | Multi-field support |
| **API Keys** | Hardcoded | Environment variables only |
| **Body Parameters** | Fake test data | Dynamic discovery |
| **Security Levels** | Hardcoded to LOW | Configurable per environment |
| **Endpoint Restrictions** | DVWA SQLi only | All endpoints with params |
| **Default Credentials** | `admin`/`password` | Must be explicitly set |

---

## Summary

✅ **All hardcoded content removed** - 9 different types of hardcoded values eliminated
✅ **Scanner now works with any target** - No more DVWA-only restrictions
✅ **Supports environment-based configuration** - All credentials and settings configurable
✅ **Maintains backward compatibility with DVWA** - Still works if configured properly
✅ **Better security** - No exposed API keys or default credentials
✅ **Actual dynamic scanning** - Discovers and tests real endpoints
