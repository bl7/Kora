#!/bin/bash
# Quick route tests. Requires dev server running (npm run dev).
# For full auth tests, set TEST_EMAIL and TEST_PASSWORD with valid company user credentials.

BASE="http://localhost:3000"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }

echo "=== Testing API routes ==="

# Health (no auth)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health/db")
[ "$code" = "200" ] && pass "GET /api/health/db ($code)" || fail "GET /api/health/db ($code)"

# Login with invalid creds (should 401)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrongpass"}')
[ "$code" = "401" ] && pass "POST /api/auth/login invalid ($code)" || fail "POST /api/auth/login invalid ($code)"

# Unauthenticated requests (should 401)
for path in "/api/auth/me" "/api/manager/leads" "/api/manager/shops" "/api/manager/orders" \
  "/api/manager/products" "/api/manager/visits" "/api/manager/tasks"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  [ "$code" = "401" ] && pass "GET $path no auth ($code)" || fail "GET $path no auth ($code)"
done

# Auth with garbage Bearer (should 401)
code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid" "$BASE/api/auth/me")
[ "$code" = "401" ] && pass "GET /api/auth/me bad token ($code)" || fail "GET /api/auth/me bad token ($code)"

echo ""
echo "=== Testing with valid login (if TEST_EMAIL and TEST_PASSWORD set) ==="

if [ -n "$TEST_EMAIL" ] && [ -n "$TEST_PASSWORD" ]; then
  login=$(curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
  token=$(echo "$login" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$token" ]; then
    pass "Login succeeded, got token"
    AUTH="Authorization: Bearer $token"

    # GET routes
    code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE/api/auth/me")
    [ "$code" = "200" ] && pass "GET /api/auth/me ($code)" || fail "GET /api/auth/me ($code)"
    code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE/api/manager/visits")
    [ "$code" = "200" ] && pass "GET /api/manager/visits ($code)" || fail "GET /api/manager/visits ($code)"
    code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE/api/manager/tasks")
    [ "$code" = "200" ] && pass "GET /api/manager/tasks ($code)" || fail "GET /api/manager/tasks ($code)"
    code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE/api/manager/leads")
    [ "$code" = "200" ] && pass "GET /api/manager/leads ($code)" || fail "GET /api/manager/leads ($code)"

    # GET shops to obtain shopId for visit
    shops_resp=$(curl -s -H "$AUTH" "$BASE/api/manager/shops")
    shop_id=$(echo "$shops_resp" | grep -o '"id":"[a-f0-9-]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$shop_id" ]; then
      # POST start visit
      visit_resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/manager/visits" -H "$AUTH" -H "Content-Type: application/json" -d "{\"shopId\":\"$shop_id\"}")
      visit_code=$(echo "$visit_resp" | tail -1)
      visit_body=$(echo "$visit_resp" | sed '$d')
      visit_id=$(echo "$visit_body" | grep -o '"id":"[a-f0-9-]*"' | head -1 | cut -d'"' -f4)
      [ "$visit_code" = "201" ] && pass "POST /api/manager/visits start ($visit_code)" || fail "POST /api/manager/visits start ($visit_code)"
      if [ -n "$visit_id" ]; then
        # PATCH end visit
        end_code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/manager/visits/$visit_id" -H "$AUTH" -H "Content-Type: application/json" -d '{"end":true}')
        [ "$end_code" = "200" ] && pass "PATCH /api/manager/visits/:id end ($end_code)" || fail "PATCH /api/manager/visits/:id end ($end_code)"
      fi
    else
      echo "  (No shops - skip POST visit test)"
    fi

    # POST create task (boss/manager only; rep gets 403)
    me_resp=$(curl -s -H "$AUTH" "$BASE/api/auth/me")
    company_user_id=$(echo "$me_resp" | grep -o '"companyUserId":"[a-f0-9-]*"' | cut -d'"' -f4)
    if [ -n "$company_user_id" ]; then
      task_resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/manager/tasks" -H "$AUTH" -H "Content-Type: application/json" -d "{\"repCompanyUserId\":\"$company_user_id\",\"title\":\"Test task from script\"}")
      task_code=$(echo "$task_resp" | tail -1)
      task_body=$(echo "$task_resp" | sed '$d')
      task_id=$(echo "$task_body" | grep -o '"id":"[a-f0-9-]*"' | head -1 | cut -d'"' -f4)
      [ "$task_code" = "201" ] && pass "POST /api/manager/tasks ($task_code)" || fail "POST /api/manager/tasks ($task_code)"
      if [ -n "$task_id" ] && [ "$task_code" = "201" ]; then
        # PATCH complete task
        patch_code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/manager/tasks/$task_id" -H "$AUTH" -H "Content-Type: application/json" -d '{"status":"completed"}')
        [ "$patch_code" = "200" ] && pass "PATCH /api/manager/tasks/:id ($patch_code)" || fail "PATCH /api/manager/tasks/:id ($patch_code)"
      fi
    fi

    # POST create lead
    lead_resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/manager/leads" -H "$AUTH" -H "Content-Type: application/json" -d '{"name":"Test Lead from script","contactName":"Test"}')
    lead_code=$(echo "$lead_resp" | tail -1)
    [ "$lead_code" = "201" ] && pass "POST /api/manager/leads ($lead_code)" || fail "POST /api/manager/leads ($lead_code)"
  else
    echo "Login failed - check TEST_EMAIL and TEST_PASSWORD"
  fi
else
  echo "Skip auth tests: set TEST_EMAIL and TEST_PASSWORD for full test"
fi

echo ""
echo "Done."
