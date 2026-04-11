# How to Check if Data is Stored in MongoDB

Here are several ways to verify that your scan data is being stored in MongoDB:

## Method 1: Using MongoDB Compass (GUI - Recommended)

1. **Download MongoDB Compass:**
   - Visit: https://www.mongodb.com/products/compass
   - Install it on your system

2. **Connect to MongoDB:**
   - Open MongoDB Compass
   - Connection string: `mongodb://localhost:27017`
   - Click "Connect"

3. **View Data:**
   - Look for database: `redteam_scanner`
   - Click on it
   - Open collection: `scan_history`
   - You'll see all your scan data in a nice table format

## Method 2: Using MongoDB Shell (mongosh)

1. **Open terminal and connect:**
   ```bash
   mongosh
   ```

2. **Switch to your database:**
   ```javascript
   use redteam_scanner
   ```

3. **Check if collection exists and count documents:**
   ```javascript
   db.scan_history.countDocuments()
   ```

4. **View all documents:**
   ```javascript
   db.scan_history.find().pretty()
   ```

5. **View latest 5 entries:**
   ```javascript
   db.scan_history.find().sort({ created_at: -1 }).limit(5).pretty()
   ```

6. **View specific field:**
   ```javascript
   db.scan_history.find({}, { target_url: 1, created_at: 1, vulnerabilities_found: 1 }).pretty()
   ```

## Method 3: Using the Check Script

Run the provided check script:

```bash
cd server
node check-mongodb.js
```

This will show you:
- Total number of entries
- Latest 5 scan entries
- Database statistics

## Method 4: Using API Endpoints

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Check data via API:**
   ```bash
   # In another terminal
   curl http://localhost:3001/api/scan-history
   ```

   Or open in browser: `http://localhost:3001/api/scan-history`

## Method 5: Check Server Logs

When you run the server with `npm run dev`, you'll see logs in the console:
- `💾 Saving scan history to MongoDB:` - When data is saved
- `✅ Scan history saved successfully` - Confirmation
- `📊 Fetched X scan history entries` - When data is fetched

## Method 6: Check Browser Network Tab

1. Open your app in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Run a scan
5. Look for POST request to `/api/scan-history`
6. Check the response to see if it contains the saved data

## Quick Verification Steps

1. ✅ Make sure MongoDB is running: `brew services list | grep mongodb`
2. ✅ Make sure backend server is running: Check `http://localhost:3001/api/health`
3. ✅ Run a scan in your frontend app
4. ✅ Check server console for save confirmation logs
5. ✅ Use one of the methods above to verify data exists

## Troubleshooting

**If no data appears:**

1. Check if MongoDB is running:
   ```bash
   brew services list | grep mongodb
   # or
   ps aux | grep mongod
   ```

2. Check server logs for errors

3. Check browser console for API errors

4. Verify API URL is correct in `src/utils/mongodb.js`

5. Test API directly:
   ```bash
   curl http://localhost:3001/api/health
   ```

