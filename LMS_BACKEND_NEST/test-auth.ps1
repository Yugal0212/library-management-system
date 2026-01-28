# Test authentication endpoints
$baseUrl = "http://localhost:8000"

Write-Host "Testing authentication endpoints..." -ForegroundColor Green

# Test 1: Access protected route without token
Write-Host "`n1. Testing /auth/me without token:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Method GET -ErrorAction Stop
    Write-Host "Success: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

# Test 2: Check if server is responding
Write-Host "`n2. Testing base endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Server is responding"
} catch {
    Write-Host "Server might not be running on port 8000" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTo test with authentication:" -ForegroundColor Cyan
Write-Host "1. First login with: POST $baseUrl/auth/login"
Write-Host "2. Use the accessToken in Authorization header: 'Bearer <token>'"
Write-Host "3. Then call: GET $baseUrl/auth/me"
