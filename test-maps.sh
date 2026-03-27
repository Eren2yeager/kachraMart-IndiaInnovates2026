#!/bin/bash

# Google Maps Integration - Quick Test Script
# This script helps you quickly test the map integration

echo "🗺️  Google Maps Integration - Quick Test"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo "Please create .env.local with GOOGLE_MAP_API_KEY"
    exit 1
fi

# Check if API key is set
if ! grep -q "GOOGLE_MAP_API_KEY" .env.local; then
    echo "❌ Error: GOOGLE_MAP_API_KEY not found in .env.local"
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Check if dev server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dev server is running"
    echo ""
    echo "📍 Test URLs:"
    echo "   • Test Page:          http://localhost:3000/test-maps"
    echo "   • Collector Pickups:  http://localhost:3000/collector/pickups"
    echo "   • Citizen Pickups:    http://localhost:3000/citizen/pickups"
    echo "   • Admin Analytics:    http://localhost:3000/admin/analytics"
    echo "   • Citizen Classify:   http://localhost:3000/citizen/classify"
    echo ""
    echo "🧪 API Endpoints:"
    echo "   • Route:              POST http://localhost:3000/api/maps/route"
    echo "   • Geocode:            POST http://localhost:3000/api/maps/geocode"
    echo "   • Reverse Geocode:    POST http://localhost:3000/api/maps/reverse-geocode"
    echo ""
    echo "📖 For detailed testing instructions, see: TESTING_GUIDE.md"
else
    echo "⚠️  Dev server is not running"
    echo ""
    echo "Starting dev server..."
    npm run dev
fi
