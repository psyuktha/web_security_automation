# MongoDB Backend Server

This is the backend server for storing scan history data in MongoDB.

## Prerequisites

1. **Install MongoDB locally:**
   - macOS: `brew install mongodb-community`
   - Or download from: https://www.mongodb.com/try/download/community

2. **Start MongoDB:**
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community
   
   # Or manually
   mongod --dbpath /usr/local/var/mongodb
   ```

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for local MongoDB)
   ```

3. **Start the server:**
   ```bash
   npm run dev  # Development mode with auto-reload
   # or
   npm start    # Production mode
   ```

The server will start on `http://localhost:3001`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/scan-history` - Get all scan history
- `GET /api/scan-history/user/:userId` - Get scan history for a user
- `POST /api/scan-history` - Create new scan history entry
- `PUT /api/scan-history/:id` - Update scan history entry
- `DELETE /api/scan-history/:id` - Delete scan history entry

## Environment Variables

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=redteam_scanner
PORT=3001
```

## Frontend Configuration

In your frontend `.env` file (or `vite.config.ts`), set:

```env
VITE_API_URL=http://localhost:3001/api
```

