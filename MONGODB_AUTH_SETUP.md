# MongoDB Authentication Setup

This project now uses **MongoDB for authentication** instead of Supabase. All authentication is handled through the backend server.

## Quick Start

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

This will install:
- `bcrypt` - for password hashing
- `jsonwebtoken` - for JWT tokens
- Other existing dependencies

### 2. Set Up Environment Variables

Create a `.env` file in the `server` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=redteam_scanner

# Server Configuration
PORT=3001

# JWT Secret (IMPORTANT: Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Or manually
mongod --dbpath /usr/local/var/mongodb
```

### 4. Start the Backend Server

```bash
cd server
npm start
# or for development with auto-reload
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Configure Frontend

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api
```

### 6. Start the Frontend

```bash
# From the root directory
npm install  # if not already done
npm run dev
```

The frontend will start on `http://localhost:8080`

## How It Works

### Authentication Flow

1. **Sign Up**: User creates account → Password is hashed with bcrypt → User saved to MongoDB → JWT token returned
2. **Sign In**: User provides credentials → Password verified → JWT token returned
3. **Protected Routes**: Frontend sends JWT token in `Authorization: Bearer <token>` header
4. **Token Validation**: Backend verifies JWT token on each protected request

### Database Collections

- **users**: Stores user accounts with hashed passwords
- **scan_history**: Stores scan results linked to users

### API Endpoints

#### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user (protected)

#### Scan History
- `GET /api/scan-history` - Get all scans (protected)
- `GET /api/scan-history/user/:userId` - Get user's scans (protected)
- `POST /api/scan-history` - Create scan entry (protected)
- `PUT /api/scan-history/:id` - Update scan entry (protected)
- `DELETE /api/scan-history/:id` - Delete scan entry (protected)

## Security Notes

1. **JWT Secret**: Change `JWT_SECRET` in production to a strong random string
2. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
3. **Token Expiration**: Tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
4. **CORS**: Backend allows CORS from frontend origin

## Troubleshooting

### "Failed to fetch" or Connection Errors
- Make sure the backend server is running on port 3001
- Check that `VITE_API_URL` in frontend `.env` matches the backend URL
- Verify MongoDB is running

### Authentication Errors
- Check browser console for error messages
- Verify JWT token is being stored in localStorage
- Check backend logs for authentication errors

### MongoDB Connection Errors
- Verify MongoDB is running: `brew services list` (macOS)
- Check `MONGODB_URI` in server `.env` file
- Ensure MongoDB is accessible on the specified port

## Migration from Supabase

If you were previously using Supabase:
1. The Supabase client is no longer needed
2. All authentication now goes through the MongoDB backend
3. User data is stored in MongoDB instead of Supabase
4. Scan history is stored in MongoDB

You can safely ignore Supabase-related files and environment variables.
