#!/bin/bash

echo "==================================="
echo "Security Check for Ohio Beer Path"
echo "==================================="
echo ""

ISSUES=0

# Check 1: .env file not in git
echo "Check 1: Verifying .env is not tracked by git..."
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "✗ FAIL - .env file is tracked by git"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ PASS - .env file not tracked"
fi
echo ""

# Check 2: .gitignore includes sensitive files
echo "Check 2: Verifying .gitignore includes sensitive files..."
if grep -q "\.env" .gitignore && grep -q "config\.local\.php" .gitignore; then
    echo "✓ PASS - .gitignore properly configured"
else
    echo "✗ FAIL - .gitignore missing sensitive file patterns"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 3: No hardcoded credentials in PHP files
echo "Check 3: Checking for hardcoded credentials..."
HARDCODED=$(grep -r "password.*=.*['\"]" --include="*.php" . | grep -v "getenv\|ENV\|\$_ENV" | wc -l)
if [ "$HARDCODED" -eq 0 ]; then
    echo "✓ PASS - No hardcoded credentials found"
else
    echo "✗ WARNING - Found $HARDCODED potential hardcoded credentials"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# Check 4: Database file permissions (if .env exists)
if [ -f .env ]; then
    echo "Check 4: Checking .env file permissions..."
    PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
        echo "✓ PASS - .env permissions are restrictive ($PERMS)"
    else
        echo "✗ WARNING - .env permissions are $PERMS (should be 600 or 400)"
        ISSUES=$((ISSUES + 1))
    fi
    echo ""
fi

# Check 5: No debug output in production code
echo "Check 5: Checking for debug statements..."
DEBUG=$(grep -r "var_dump\|print_r\|var_export" --include="*.php" . | grep -v "^#" | wc -l)
if [ "$DEBUG" -eq 0 ]; then
    echo "✓ PASS - No debug statements found"
else
    echo "✗ WARNING - Found $DEBUG debug statements"
    echo "  (Review and remove before production deployment)"
fi
echo ""

# Summary
echo "==================================="
if [ $ISSUES -eq 0 ]; then
    echo "✓ Security check passed!"
    exit 0
else
    echo "✗ Found $ISSUES security issues"
    echo "  Please review and fix before deployment"
    exit 1
fi
