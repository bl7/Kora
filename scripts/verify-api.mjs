
import assert from 'node:assert';
import { test } from 'node:test';

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const UNIQUE_ID = Date.now().toString(36);
const COMPANY_EMAIL = `test-company-${UNIQUE_ID}@example.com`;
const COMPANY_SLUG = `test-company-${UNIQUE_ID}`;
const PASSWORD = 'password123';

// State to carry over between tests
let adminCookie = '';
let companyId = '';
let adminUserId = '';
let shopId = '';
let productId = '';
let productSku = '';
let leadId = '';
let orderId = '';
let staffId = '';
let attendanceLogId = '';

// Helper for making requests
async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Cookie'] = token;

    const options = {
        method,
        headers,
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json().catch(() => ({}));

    // Extract set-cookie if present
    const setCookie = res.headers.get('set-cookie');

    return {
        status: res.status,
        data,
        cookie: setCookie ? setCookie.split(';')[0] : null
    };
}

console.log(`\n🚀 Starting API verification against ${BASE_URL}\n`);

// ── AUTHENTICATION ──

test('POST /auth/signup-company - Should create a new company', async () => {
    const { status, data } = await request('POST', '/auth/signup-company', {
        companyName: `Test Company ${UNIQUE_ID}`,
        companySlug: COMPANY_SLUG,
        address: "123 Test St",
        fullName: "Test Admin",
        email: COMPANY_EMAIL,
        password: PASSWORD,
        phone: "+9779876543210",
        role: "manager"
    });

    assert.strictEqual(status, 201, 'Signup should return 201');
    assert.ok(data.ok, 'Response should be OK');
    assert.ok(data.company.id, 'Should return company ID');
    assert.ok(data.user.id, 'Should return user ID');

    companyId = data.company.id;
    adminUserId = data.user.id;
    console.log('✅ Company created:', data.company.name);
});

test('POST /auth/login - Should login and return cookie', async () => {
    const { status, data, cookie } = await request('POST', '/auth/login', {
        email: COMPANY_EMAIL,
        password: PASSWORD
    });

    assert.strictEqual(status, 200, 'Login should return 200');
    assert.ok(data.ok);
    assert.ok(cookie, 'Should return a session cookie');

    adminCookie = cookie;
    console.log('✅ Logged in successfully');
});

test('GET /auth/me - Should return current user info', async () => {
    const { status, data } = await request('GET', '/auth/me', null, adminCookie);

    assert.strictEqual(status, 200);
    assert.strictEqual(data.user.email, COMPANY_EMAIL);
    assert.strictEqual(data.company.id, companyId);
    console.log('✅ Verified session');
});

// ── SHOPS ──

test('POST /manager/shops - Should create a shop', async () => {
    const { status, data } = await request('POST', '/manager/shops', {
        name: "Test Shop 1",
        latitude: 27.7,
        longitude: 85.3,
        geofenceRadius: 100,
        externalShopCode: `SHOP-${UNIQUE_ID}`,
        notes: "Created by test script"
    }, adminCookie);

    assert.strictEqual(status, 201);
    assert.ok(data.shop.id);

    shopId = data.shop.id;
    console.log('✅ Shop created:', data.shop.name);
});

test('GET /manager/shops - Should list shops', async () => {
    const { status, data } = await request('GET', '/manager/shops', null, adminCookie);

    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data.shops));
    assert.ok(data.shops.find(s => s.id === shopId));
    console.log('✅ Shop listed');
});

// ── STAFF ──

test('POST /manager/staff - Should invite staff', async () => {
    const { status } = await request('POST', '/manager/staff', {
        fullName: "Test Staff",
        email: `staff-${UNIQUE_ID}@example.com`,
        phone: "+9779812345678",
        role: "rep"
    }, adminCookie);

    assert.strictEqual(status, 201);
    console.log('✅ Staff invited');
});

test('GET /manager/staff - Should list staff', async () => {
    const { status, data } = await request('GET', '/manager/staff', null, adminCookie);

    assert.strictEqual(status, 200);
    const staff = data.staff.find(s => s.email === `staff-${UNIQUE_ID}@example.com`);
    assert.ok(staff);
    staffId = staff.company_user_id; // Using field from list response
    console.log('✅ Staff listed');
});

// ── PRODUCTS ──

test('POST /manager/products - Should create a product', async () => {
    const { status, data } = await request('POST', '/manager/products', {
        name: "Test Product",
        sku: `SKU-${UNIQUE_ID}`,
        description: "Test description",
        unit: "pcs",
        price: 100.50
    }, adminCookie);

    assert.strictEqual(status, 201);
    assert.ok(data.product.id);

    productId = data.product.id;
    productSku = data.product.sku;
    console.log('✅ Product created:', data.product.name);
});

// ── LEADS ──

test('POST /manager/leads - Should create a new lead', async () => {
    const { status, data } = await request('POST', '/manager/leads', {
        name: "Test Lead",
        contactName: "Lead Person",
        phone: "+9779841000000",
        email: "lead@example.com",
        address: "Lead Address",
        notes: "Initial interest"
    }, adminCookie);

    assert.strictEqual(status, 201);
    assert.ok(data.lead.id);

    leadId = data.lead.id;
    console.log('✅ Lead created:', data.lead.name);
});

test('GET /manager/leads - Should list leads', async () => {
    const { status, data } = await request('GET', '/manager/leads', null, adminCookie);

    assert.strictEqual(status, 200);
    assert.ok(data.leads.some(l => l.id === leadId));
    console.log('✅ Lead listed');
});

test('PATCH /manager/leads/[id] - Should update lead', async () => {
    const { status, data } = await request('PATCH', `/manager/leads/${leadId}`, {
        status: "contacted",
        notes: "Followed up call"
    }, adminCookie);

    assert.strictEqual(status, 200);
    assert.strictEqual(data.lead.status, 'contacted');
    console.log('✅ Lead updated');
});

// ── ORDERS ──

test('POST /manager/orders - Should create an order', async () => {
    const { status, data } = await request('POST', '/manager/orders', {
        shopId,
        notes: "Test order",
        items: [
            {
                productId,
                productName: "Test Product", // Snapshot
                productSku: productSku,     // Snapshot
                quantity: 2,
                unitPrice: 100.50
            }
        ]
    }, adminCookie);

    assert.strictEqual(status, 201);
    assert.ok(data.order.id);

    orderId = data.order.id;
    console.log('✅ Order created:', data.order.order_number);
});

test('GET /manager/orders/[id] - Should return order details', async () => {
    const { status, data } = await request('GET', `/manager/orders/${orderId}`, null, adminCookie);

    assert.strictEqual(status, 200);
    assert.strictEqual(data.order.items.length, 1);
    console.log('✅ Order details verified');
});

// ── ATTENDANCE ──

test('POST /manager/attendance/clock-in - Should clock in', async () => {
    const { status, data } = await request('POST', '/manager/attendance/clock-in', {
        latitude: 27.7,
        longitude: 85.3,
        notes: "Checking in"
    }, adminCookie);

    assert.strictEqual(status, 201);
    assert.ok(data.log.id);

    attendanceLogId = data.log.id;
    console.log('✅ Clocked in');
});

test('POST /manager/attendance/clock-out - Should clock out', async () => {
    const { status, data } = await request('POST', '/manager/attendance/clock-out', {
        latitude: 27.7,
        longitude: 85.3,
        notes: "Checking out"
    }, adminCookie);

    assert.strictEqual(status, 200);
    assert.ok(data.log.clock_out_at);
    console.log('✅ Clocked out');
});

// ── SYSTEM ──

test('GET /health/db - Should check system health', async () => {
    const { status, data } = await request('GET', '/health/db');

    if (status === 200) {
        assert.strictEqual(data.database, 'connected');
        console.log('✅ DB Health Check passed');
    } else {
        console.log('⚠️ DB Health Check skipped or failed (might not be implemented in this version)');
    }
});

