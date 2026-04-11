# Supabase Setup Guide

This project uses Supabase for authentication and database. Follow these steps to set it up:

## Quick Setup

### Option 1: Use Existing Supabase Project

If you already have a Supabase project:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** > **API**
4. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (the long string under "Project API keys")

5. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

6. Edit `.env` and replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

### Option 2: Create New Supabase Project

1. **Sign up/Login to Supabase**
   - Go to https://supabase.com
   - Sign up or log in

2. **Create a New Project**
   - Click "New Project"
   - Choose an organization
   - Enter project name (e.g., "redteam-automator")
   - Enter a database password (save it securely!)
   - Choose a region close to you
   - Click "Create new project"
   - Wait for the project to be set up (2-3 minutes)

3. **Get Your API Credentials**
   - Once the project is ready, go to **Project Settings** > **API**
   - Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy the **anon/public** key

4. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

5. **Run Database Migrations**
   The project includes migrations in `supabase/migrations/`. If you're using Supabase CLI:
   ```bash
   # Install Supabase CLI (if not already installed)
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```
   
   Or manually run the SQL files from `supabase/migrations/` in your Supabase SQL Editor.

## Verify Setup

1. **Restart your development server** (if running):
   ```bash
   npm run dev
   ```

2. **Check the browser console** - you should no longer see Supabase connection errors

3. **Test authentication** - try signing up or logging in

## Troubleshooting

### Error: `ERR_NAME_NOT_RESOLVED`
- **Cause**: Missing or incorrect `VITE_SUPABASE_URL`
- **Solution**: Check your `.env` file and ensure the URL is correct

### Error: `Failed to fetch`
- **Cause**: Invalid API key or network issue
- **Solution**: 
  - Verify your `VITE_SUPABASE_PUBLISHABLE_KEY` is correct
  - Check your internet connection
  - Ensure your Supabase project is active

### Error: `Invalid API key`
- **Cause**: Wrong key or key doesn't have proper permissions
- **Solution**: Use the **anon/public** key from Project Settings > API

## Local Development with Supabase CLI (Optional)

If you want to run Supabase locally:

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Start local Supabase**:
   ```bash
   supabase start
   ```

3. **Use local credentials** in `.env`:
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (The CLI will show you the exact values after running `supabase start`)

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check the browser console for detailed error messages
