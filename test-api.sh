#!/bin/bash

# API Testing Script for Ohio Beer Path

BASE_URL="http://localhost:8000"
FAIL_COUNT=0

echo "==================================="
echo "Ohio Beer Path - API Test Suite"
echo "==================================="
echo ""

# Test 1: Get all breweries
echo "Test 1: GET /api/breweries.php"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test1.json "$BASE_URL/api/breweries.php")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test1.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Returned $COUNT breweries"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 2: Filter by region
echo "Test 2: GET /api/breweries.php?region=central"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test2.json "$BASE_URL/api/breweries.php?region=central")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test2.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Returned $COUNT Central Ohio breweries"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 3: Search by city
echo "Test 3: GET /api/search.php?q=Cleveland"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test3.json "$BASE_URL/api/search.php?q=Cleveland")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test3.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Found $COUNT results for Cleveland"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 4: Search by brewery name
echo "Test 4: GET /api/search.php?q=Great+Lakes"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test4.json "$BASE_URL/api/search.php?q=Great+Lakes")
if [ "$RESPONSE" -eq 200 ]; then
    COUNT=$(cat /tmp/test4.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✓ PASS - Found $COUNT results for 'Great Lakes'"
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 5: Analytics POST
echo "Test 5: POST /api/analytics.php"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/test5.json \
  -X POST "$BASE_URL/api/analytics.php" \
  -H "Content-Type: application/json" \
  -d '{"event": "test_event", "brewery_id": "test-123"}')
if [ "$RESPONSE" -eq 200 ]; then
    SUCCESS=$(cat /tmp/test5.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))")
    if [ "$SUCCESS" = "True" ]; then
        echo "✓ PASS - Analytics event recorded"
    else
        echo "✗ FAIL - Success = false"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo "✗ FAIL - HTTP $RESPONSE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Summary
echo "==================================="
if [ $FAIL_COUNT -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ $FAIL_COUNT test(s) failed"
    exit 1
fi
