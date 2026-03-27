# Google Maps API Testing Script (PowerShell)
# Quick tests for the map API endpoints

Write-Host "🗺️  Google Maps API - Quick Test" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Route Calculation
Write-Host "Test 1: Route Calculation" -ForegroundColor Yellow
Write-Host "Calculating route from San Francisco to Oakland..." -ForegroundColor Gray

$routeBody = @{
    origin = @(-122.4194, 37.7749)
    destination = @(-122.2711, 37.8044)
} | ConvertTo-Json

try {
    $routeResponse = Invoke-RestMethod -Uri "$baseUrl/api/maps/route" -Method Post -Body $routeBody -ContentType "application/json"
    Write-Host "✅ Route calculation successful" -ForegroundColor Green
    Write-Host "   Distance: $($routeResponse.distance) km" -ForegroundColor White
    Write-Host "   Duration: $($routeResponse.duration) minutes" -ForegroundColor White
    Write-Host "   Polyline: $($routeResponse.polyline.Substring(0, 50))..." -ForegroundColor White
} catch {
    Write-Host "❌ Route calculation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Geocoding
Write-Host "Test 2: Geocoding (Address to Coordinates)" -ForegroundColor Yellow
Write-Host "Converting address to coordinates..." -ForegroundColor Gray

$geocodeBody = @{
    address = "1600 Amphitheatre Parkway, Mountain View, CA"
} | ConvertTo-Json

try {
    $geocodeResponse = Invoke-RestMethod -Uri "$baseUrl/api/maps/geocode" -Method Post -Body $geocodeBody -ContentType "application/json"
    Write-Host "✅ Geocoding successful" -ForegroundColor Green
    Write-Host "   Coordinates: $($geocodeResponse.coordinates)" -ForegroundColor White
    Write-Host "   Address: $($geocodeResponse.formattedAddress)" -ForegroundColor White
} catch {
    Write-Host "❌ Geocoding failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Reverse Geocoding
Write-Host "Test 3: Reverse Geocoding (Coordinates to Address)" -ForegroundColor Yellow
Write-Host "Converting coordinates to address..." -ForegroundColor Gray

$reverseGeocodeBody = @{
    coordinates = @(-122.4194, 37.7749)
} | ConvertTo-Json

try {
    $reverseResponse = Invoke-RestMethod -Uri "$baseUrl/api/maps/reverse-geocode" -Method Post -Body $reverseGeocodeBody -ContentType "application/json"
    Write-Host "✅ Reverse geocoding successful" -ForegroundColor Green
    Write-Host "   Address: $($reverseResponse.formattedAddress)" -ForegroundColor White
} catch {
    Write-Host "❌ Reverse geocoding failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more detailed testing, see: TESTING_GUIDE.md" -ForegroundColor Gray
