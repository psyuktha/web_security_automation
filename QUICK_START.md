# Quick Start Guide

## Fix the Supabase Connection Error

If you're seeing `ERR_NAME_NOT_RESOLVED` or `Failed to fetch` errors, you need to set up your Supabase credentials.

### Step 1: Create .env File

Create a file named `.env` in the root directory with this content:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_API_URL=http://localhost:3001/api
```

### Step 2: Get Your Supabase Credentials

1. **Go to Supabase**: https://supabase.com
2. **Sign up or log in**
3. **Create a new project** (or select existing):
   - Click "New Project"
   - Enter project name
   - Set a database password (save it!)
   - Choose region
   - Wait 2-3 minutes for setup
4. **Get your credentials**:
   - Go to **Project Settings** (gear icon) > **API**
   - Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy the **anon public** key (long string)

### Step 3: Update .env File

Replace the placeholder values in `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # Your actual URL
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Your actual key
VITE_API_URL=http://localhost:3001/api
```

### Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Verify

1. Open your browser console (F12)
2. You should **NOT** see Supabase connection errors
3. Try signing up or logging in

## Alternative: Use Setup Script

```bash
# Run the setup script
./setup-env.sh

# Then edit .env with your credentials
```

## Still Having Issues?

- Check that your `.env` file is in the root directory (same level as `package.json`)
- Make sure there are no extra spaces or quotes around the values
- Verify your Supabase project is active and not paused
- See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed troubleshooting

## Running the Full Stack

This project has both frontend and backend:

### Frontend (Port 8080)
```bash
npm install
npm run dev
```

### Backend Server (Port 3001)
```bash
cd server
npm install
npm start
```

Make sure MongoDB is running if you're using the backend:
```bash
# macOS
brew services start mongodb-community
```
