#!/bin/bash
# Local testing script for duplicate detection
# This helps validate the script before pushing to GitHub

echo "=================================="
echo "Duplicate Detection Local Test"
echo "=================================="
echo ""

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable is not set"
    echo "Please set it with: export GITHUB_TOKEN='your_token_here'"
    exit 1
fi

echo "✅ GITHUB_TOKEN is set"

# Install dependencies
echo ""
echo "Installing dependencies..."
cd "$(dirname "$0")"
pip install -q -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Set test environment variables
export REPOSITORY="${REPOSITORY:-apache/fory-site}"
export ISSUE_NUMBER="${ISSUE_NUMBER:-1}"
export ISSUE_TITLE="${ISSUE_TITLE:-Test Issue for Duplicate Detection}"
export ISSUE_BODY="${ISSUE_BODY:-This is a test issue to verify the duplicate detection system works correctly.}"

echo ""
echo "Test Configuration:"
echo "  Repository: $REPOSITORY"
echo "  Issue Number: $ISSUE_NUMBER"
echo "  Issue Title: $ISSUE_TITLE"
echo ""

# Run the script
echo "Running duplicate detection..."
echo "=================================="
python detect-duplicates.py --type issue

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ Test completed successfully!"
    echo "=================================="
else
    echo ""
    echo "=================================="
    echo "❌ Test failed!"
    echo "=================================="
    exit 1
fi
