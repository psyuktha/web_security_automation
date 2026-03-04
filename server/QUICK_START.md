# Quick Start Guide - Fix "Connection Refused" Error

## The Problem
You're seeing `ERR_CONNECTION_REFUSED` because the backend server is not running.

## Solution: Start the Server

### Option 1: Using the start script (Easiest)
```bash
cd server
chmod +x start-server.sh
./start-server.sh
```

### Option 2: Manual start
```bash
cd server
npm run dev
```

## Before Starting: Make Sure MongoDB is Running

### Check if MongoDB is running:
```bash
# Check if MongoDB service is running
brew services list | grep mongodb

# Or check if mongod process is running
ps aux | grep mongod
```

### Start MongoDB if not running:
```bash
# Using Homebrew
brew services start mongodb-community

# Or manually
mongod --dbpath /usr/local/var/mongodb
```

## Verify Everything is Working

1. **Server should show:**
   ```
   ✅ Connected to MongoDB
   🚀 Server running on http://localhost:3001
   ```

2. **Test the API:**
   - Open: http://localhost:3001/api/health
   - Should show: `{"status":"ok","message":"Server is running"}`

3. **Check scan history:**
   - Open: http://localhost:3001/api/scan-history
   - Should show: `[]` (empty array if no data yet)

## Common Issues

### Issue: "Cannot find module 'express'"
**Solution:**
```bash
cd server
npm install
```

### Issue: "MongoDB connection error"
**Solution:**
1. Make sure MongoDB is installed: `brew install mongodb-community`
2. Start MongoDB: `brew services start mongodb-community`
3. Wait a few seconds, then restart the server

### Issue: "Port 3001 already in use"
**Solution:**
```bash
# Find process using port 3001
lsof -ti:3001

# Kill it (replace PID with actual process ID)
kill -9 PID

# Or use a different port
PORT=3002 npm run dev
```

## Step-by-Step Checklist

- [ ] MongoDB is installed
- [ ] MongoDB is running (`brew services start mongodb-community`)
- [ ] Navigated to `server` directory
- [ ] Installed dependencies (`npm install`)
- [ ] Started server (`npm run dev`)
- [ ] Server shows "Connected to MongoDB"
- [ ] Can access http://localhost:3001/api/health

## Need Help?

If you're still having issues:

1. Check server console for error messages
2. Verify MongoDB is actually running: `mongosh --eval "db.adminCommand('ping')"`
3. Check firewall settings (macOS might block connections)
4. Try a different port: Set `PORT=3002` in server/.env

