# Troubleshooting Guide

## Issue: Cannot see webpage after login

If you're experiencing issues where the page doesn't load after logging in, follow these steps:

### 1. Check Backend Server is Running

Make sure the backend server is running on port 3001:

```bash
cd server
npm start
```

You should see:
```
🚀 Server running on http://localhost:3001
✅ Connected to MongoDB
```

### 2. Check MongoDB is Running

```bash
# macOS
brew services list | grep mongodb

# Or check if MongoDB is accessible
mongosh --eval "db.adminCommand('ping')"
```

### 3. Check Environment Variables

**Frontend `.env` file (root directory):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend `.env` file (server directory):**
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=redteam_scanner
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 4. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for errors or logs
- **Network tab**: Check if API calls are failing
  - Look for `/api/auth/signin` or `/api/auth/signup` requests
  - Check if they return 200 status or errors

### 5. Common Issues

#### Issue: "Failed to fetch" error
**Solution**: 
- Backend server is not running
- CORS issue (should be handled, but check server logs)
- Wrong API URL in frontend `.env`

#### Issue: Blank page after login
**Solution**:
- Check browser console for errors
- Verify token is saved: `localStorage.getItem("auth_token")` in console
- Check if `/api/auth/me` endpoint is working

#### Issue: Redirects back to /auth immediately
**Solution**:
- Token might be invalid
- Backend `/api/auth/me` endpoint might be failing
- Check backend logs for authentication errors

### 6. Debug Steps

1. **Check localStorage**:
   ```javascript
   // In browser console
   localStorage.getItem("auth_token")
   ```

2. **Test API endpoints manually**:
   ```bash
   # Test health endpoint
   curl http://localhost:3001/api/health
   
   # Test signin (replace with your credentials)
   curl -X POST http://localhost:3001/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

3. **Check backend logs**:
   Look for:
   - `✅ User signed in: email@example.com`
   - `❌ Signin error: ...`
   - `❌ MongoDB connection error: ...`

4. **Clear browser cache and localStorage**:
   ```javascript
   // In browser console
   localStorage.clear()
   // Then refresh the page
   ```

### 7. Verify Routes

Make sure your routes are set up correctly in `src/App.tsx`:
- `/` should render `<Index />`
- `/auth` should render `<Auth />`
- `AuthProvider` should wrap all routes

### 8. Still Not Working?

1. **Restart everything**:
   ```bash
   # Stop frontend (Ctrl+C)
   # Stop backend (Ctrl+C)
   # Restart backend
   cd server
   npm start
   
   # In another terminal, restart frontend
   npm run dev
   ```

2. **Check for TypeScript/JavaScript conflicts**:
   - Make sure you're using the correct file (`.tsx` vs `.jsx`)
   - Check `src/main.tsx` imports `App.tsx` (not `App.jsx`)

3. **Check browser console logs**:
   - Look for the debug logs we added:
     - `🔐 Attempting signin to: ...`
     - `✅ Signin successful, setting user: ...`
     - `📊 Index component - Auth state: ...`

### 9. Network Issues

If you're running frontend and backend on different ports:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3001`
- Make sure `VITE_API_URL` points to the correct backend URL

### 10. MongoDB Connection

If MongoDB connection fails:
```bash
# Check MongoDB status
brew services list | grep mongodb

# Start MongoDB if not running
brew services start mongodb-community

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

## Getting Help

If none of these solutions work:
1. Check browser console for specific error messages
2. Check backend terminal for error logs
3. Verify all environment variables are set correctly
4. Make sure all dependencies are installed (`npm install` in both root and server directories)
