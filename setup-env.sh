#!/bin/bash

# Setup script for environment variables

echo "🔧 Setting up environment variables for AI Red Team Automator"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

echo "📝 Creating .env file..."
echo ""

# Create .env file
cat > .env << 'EOF'
# Supabase Configuration
# IMPORTANT: Replace these placeholder values with your actual Supabase credentials
# 
# To get your Supabase credentials:
# 1. Go to https://supabase.com and sign up/login
# 2. Create a new project (or use existing one)
# 3. Go to Project Settings > API
# 4. Copy the "Project URL" and "anon/public" key below

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Backend API URL (optional, defaults to http://localhost:3001/api)
VITE_API_URL=http://localhost:3001/api
EOF

echo "✅ Created .env file!"
echo ""
echo "📋 Next steps:"
echo "1. Open .env file in your editor"
echo "2. Replace 'your-project-id.supabase.co' with your actual Supabase URL"
echo "3. Replace 'your-anon-key-here' with your actual Supabase anon key"
echo ""
echo "📖 For detailed instructions, see SUPABASE_SETUP.md"
echo ""
