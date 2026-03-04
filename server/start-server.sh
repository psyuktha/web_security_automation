#!/bin/bash

echo "🚀 Starting MongoDB Backend Server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB might not be running"
        echo "   Start it with: brew services start mongodb-community"
        echo ""
    fi
else
    echo "⚠️  mongosh not found. Make sure MongoDB is installed."
fi

echo ""
echo "📡 Starting server on port 3001..."
echo "   Access API at: http://localhost:3001/api"
echo ""

# Start the server
npm run dev

