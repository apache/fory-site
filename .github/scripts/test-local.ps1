# Local testing script for duplicate detection (PowerShell)
# This helps validate the script before pushing to GitHub

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Duplicate Detection Local Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if GITHUB_TOKEN is set
if (-not $env:GITHUB_TOKEN) {
    Write-Host "❌ Error: GITHUB_TOKEN environment variable is not set" -ForegroundColor Red
    Write-Host 'Please set it with: $env:GITHUB_TOKEN="your_token_here"' -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GITHUB_TOKEN is set" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
pip install -q -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Set test environment variables
if (-not $env:REPOSITORY) { $env:REPOSITORY = "apache/fory-site" }
if (-not $env:ISSUE_NUMBER) { $env:ISSUE_NUMBER = "1" }
if (-not $env:ISSUE_TITLE) { $env:ISSUE_TITLE = "Test Issue for Duplicate Detection" }
if (-not $env:ISSUE_BODY) { $env:ISSUE_BODY = "This is a test issue to verify the duplicate detection system works correctly." }

Write-Host ""
Write-Host "Test Configuration:" -ForegroundColor Cyan
Write-Host "  Repository: $env:REPOSITORY"
Write-Host "  Issue Number: $env:ISSUE_NUMBER"
Write-Host "  Issue Title: $env:ISSUE_TITLE"
Write-Host ""

# Run the script
Write-Host "Running duplicate detection..." -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
python detect-duplicates.py --type issue

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "==================================" -ForegroundColor Cyan
    exit 1
}
