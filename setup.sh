#!/bin/bash

# AgriAI Assistant Setup Script
# This script sets up the complete agricultural AI system

echo "🌾 Setting up AgriAI Assistant..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8+ is required. Found: $python_version"
    exit 1
fi

# Check Node.js version
node_version=$(node --version 2>&1 | sed 's/v//')
required_node="16.0.0"

if [ "$(printf '%s\n' "$required_node" "$node_version" | sort -V | head -n1)" != "$required_node" ]; then
    echo "❌ Node.js 16+ is required. Found: $node_version"
    exit 1
fi

echo "✅ System requirements met"

# Setup Backend
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created backend .env file - please configure as needed"
fi

cd ..

# Setup Frontend
echo "🔧 Setting up frontend..."
cd frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created frontend .env file - please configure as needed"
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "1. Start backend: cd backend && source venv/bin/activate && python main.py"
echo "2. Start frontend: cd frontend && npm start"
echo ""
echo "📱 Access the application at: http://localhost:3000"
echo "📚 API documentation at: http://localhost:8000/docs"
echo ""
echo "⚠️  Important:"
echo "- Configure your .env files with API keys if needed"
echo "- Ensure all ML models are in the models/ directory"
echo "- Check that the backend is running before starting the frontend"