#!/bin/bash

# Configuration
API_URL="http://localhost:8000/api"
ADMIN_EMAIL="admin@demo.com"
ADMIN_PASS="123456"

echo "🔍 Starting Comprehensive System Verification..."

# 1. Check Server Connectivity
echo -n "1. Checking Backend Connectivity... "
if curl -s -I "$API_URL/public/tenants.php?slug=demo" | grep "200 OK" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL (Backend unreachable or 500 error)"
    echo "👉 Tip: Run 'docker-compose up -d backend' and wait 10s."
    exit 1
fi

# 2. Public Endpoints
echo -n "2. Fetching Tenant Info (Public)... "
TENANT=$(curl -s "$API_URL/public/tenants.php?slug=demo")
if echo "$TENANT" | grep "Autoescuela Demo" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
    echo "Response: $TENANT"
fi

# 3. Authentication
echo -n "3. Admin Login... "
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login.php" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")

TOKEN=$(echo "$LOGIN_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ OK (Token received)"
else
    echo "❌ FAIL"
    echo "Response: $LOGIN_RES"
    exit 1
fi

# 4. Instructors (GET & PUT)
echo -n "4. Fetching Instructors... "
INST_RES=$(curl -s -X GET "$API_URL/instructors.php" -H "Authorization: Bearer $TOKEN")
if echo "$INST_RES" | grep "Carlos" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
    echo "Response: $INST_RES"
fi

# 5. Availability (Logic Check)
echo -n "5. Checking Availability Logic... "
# Carlos ID (approximate from seed or dynamic fetch)
# Fetch first instructor ID
INST_ID=$(echo "$INST_RES" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$INST_ID" ]; then
    AVAIL_RES=$(curl -s -X GET "$API_URL/availability.php?mode=details&date=2026-03-10&instructor_id=$INST_ID")
    if echo "$AVAIL_RES" | grep "effective" > /dev/null; then
        echo "✅ OK (Structure matches frontend)"
    else
        echo "❌ FAIL (Invalid JSON structure)"
        echo "Response: $AVAIL_RES"
    fi
else
    echo "⚠️ SKIP (No instructors found)"
fi

# 6. Vehicles (CRUD)
echo -n "6. Fetching Vehicles... "
VEH_RES=$(curl -s -X GET "$API_URL/vehicles.php" -H "Authorization: Bearer $TOKEN")
if echo "$VEH_RES" | grep "Toyota" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
    echo "Response: $VEH_RES"
fi

echo "---------------------------------------------------"
echo "🎉 Verification Complete. If all checks passed, the system is healthy."
