#!/bin/bash

echo "🏖️  Starting SamudraSetu Project..."
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Start backend in background
echo "🚀 Starting Django Backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/bin/python" ]; then
    echo "📥 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Start Django server in background
echo "🌐 Starting Django server on http://localhost:8000"
python manage.py runserver > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for server to start
sleep 3

# Go back to root
cd ..

# Start Expo
echo ""
echo "📱 Starting Expo..."
echo "Backend is running in background (PID: $BACKEND_PID)"
echo "Backend logs: tail -f backend.log"
echo ""
echo "To stop backend: kill $BACKEND_PID"
echo ""

npm start
