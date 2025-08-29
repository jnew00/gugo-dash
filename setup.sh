#!/bin/bash

# GUGO Reply Hub Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up GUGO Reply Hub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20 or later is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Create storage directories
echo "📁 Creating storage directories..."
mkdir -p storage/base_images
mkdir -p storage/generated_images
echo "✅ Storage directories created"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment file..."
    cp .env.example .env
    echo "✅ Environment file created (.env)"
    echo "⚠️  Please edit .env file with your API keys and configuration"
else
    echo "✅ Environment file exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Start a PostgreSQL database (or use Docker Compose)"
echo "3. Run database migrations: npm run db:push"
echo "4. Start development server: npm run dev"
echo ""
echo "For Docker deployment:"
echo "docker-compose up -d"
echo ""
echo "For more information, see DEPLOYMENT.md"