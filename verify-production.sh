#!/bin/bash

# Hoostn.com - Production Verification Script
# This script runs smoke tests on production deployment

set -e

echo "🧪 Hoostn.com - Production Verification"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Production URL
PROD_URL="${1:-https://hoostn.com}"

echo "Testing: $PROD_URL"
echo ""

# Test results
PASSED=0
FAILED=0
declare -a failed_tests=()

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected="$3"

    echo -n "Testing $test_name... "

    if eval "$test_command" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        failed_tests+=("$test_name")
    fi
}

# Test 1: Homepage accessibility
echo -e "${BLUE}Test 1: Homepage Accessibility${NC}"
run_test "Homepage HTTP status" \
    "curl -s -o /dev/null -w '%{http_code}' $PROD_URL" \
    "200"
echo ""

# Test 2: API Health endpoint
echo -e "${BLUE}Test 2: API Health Check${NC}"
run_test "Health endpoint" \
    "curl -s $PROD_URL/api/health" \
    "status"
echo ""

# Test 3: Authentication pages
echo -e "${BLUE}Test 3: Authentication${NC}"
run_test "Login page" \
    "curl -s -o /dev/null -w '%{http_code}' $PROD_URL/login" \
    "200"
run_test "Signup page" \
    "curl -s -o /dev/null -w '%{http_code}' $PROD_URL/signup" \
    "200"
echo ""

# Test 4: Dashboard (should redirect to login)
echo -e "${BLUE}Test 4: Protected Routes${NC}"
run_test "Dashboard redirect" \
    "curl -s -o /dev/null -w '%{http_code}' $PROD_URL/dashboard" \
    "307\|302"
echo ""

# Test 5: API Routes
echo -e "${BLUE}Test 5: API Endpoints${NC}"
run_test "Stripe webhook endpoint" \
    "curl -s -o /dev/null -w '%{http_code}' $PROD_URL/api/stripe/webhook" \
    "400\|405"
echo ""

# Test 6: Static assets
echo -e "${BLUE}Test 6: Static Assets${NC}"
run_test "Favicon" \
    "curl -s -o /dev/null -w '%{http_code}' $PROD_URL/favicon.ico" \
    "200\|404"
echo ""

# Test 7: Security headers
echo -e "${BLUE}Test 7: Security Headers${NC}"
HEADERS=$(curl -s -I $PROD_URL)
if echo "$HEADERS" | grep -qi "x-frame-options\|strict-transport-security"; then
    echo -e "${GREEN}✓ Security headers present${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Security headers missing (check vercel.json)${NC}"
    ((FAILED++))
    failed_tests+=("Security headers")
fi
echo ""

# Test 8: SSL Certificate
echo -e "${BLUE}Test 8: SSL Certificate${NC}"
if curl -s -I $PROD_URL | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✓ HTTPS working${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ HTTPS not working${NC}"
    ((FAILED++))
    failed_tests+=("HTTPS")
fi
echo ""

# Summary
echo "========================================"
echo -e "${BLUE}Test Summary:${NC}"
echo ""
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Production is healthy.${NC}"
    exit 0
else
    echo -e "${RED}Failed tests:${NC}"
    for test in "${failed_tests[@]}"; do
        echo "  - $test"
    done
    echo ""
    echo -e "${YELLOW}Please review failed tests and check:${NC}"
    echo "  1. Vercel deployment logs"
    echo "  2. Environment variables"
    echo "  3. Database connection"
    echo "  4. DNS configuration"
    exit 1
fi
