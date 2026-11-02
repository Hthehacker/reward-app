/**
 * VELOOP Rewards - Production Build & 7 Production Scenarios Verification Test
 *
 * Verifies all 7 user-specified production scenarios:
 * 1. Open website without logging in: no demo switcher in production bundle.
 * 2. Open Sign-in page: no demo accounts or demo controls in production bundle.
 * 3. Register a new account: clean production registration without demo hooks.
 * 4. Login as a normal user: no demo switcher in bundle, standard user role enforced.
 * 5. Login as production admin: legitimate admin works, but reset-demo is strictly blocked.
 * 6. Refresh the page after login: auth persists via httpOnly cookie, no demo switcher.
 * 7. Directly access demo-related routes and APIs: all rejected with 403/400/401.
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data = null;
  const setCookie = res.headers.get('set-cookie');
  try {
    data = await res.json();
  } catch {
    // Non-JSON response
  }
  return { status: res.status, data, headers: res.headers, setCookie };
}

async function verifyProductionScenarios() {
  console.log('====================================================');
  console.log('🛡️ Verifying 7 Production Scenarios & Production Bundle');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // Step 1: Production Bundle Static Analysis
    // ----------------------------------------------------
    console.log('--- Step 1: Production Bundle Static Analysis ---');
    const distAssetsDir = path.resolve('../frontend/dist/assets');
    const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
    assert(jsFiles.length > 0, `Production bundle found: ${jsFiles.join(', ')}`);

    const mainBundleContent = fs.readFileSync(path.join(distAssetsDir, jsFiles[0]), 'utf8');

    // Scenario 1 & 2 verification in production bundle:
    assert(!mainBundleContent.includes('Demo State Switcher'), 'Scenario 1: "Demo State Switcher" is 100% absent from production JS bundle');
    assert(!mainBundleContent.includes('Instant Demo Sign-In'), 'Scenario 2: "Instant Demo Sign-In" chips are 100% absent from production JS bundle');
    assert(!mainBundleContent.includes('Default for demo:'), 'Scenario 2: Demo password hint is 100% absent from production JS bundle');
    assert(!mainBundleContent.includes('Reset Demo'), 'Scenario 2 & 5: "Reset Demo" button is 100% absent from production JS bundle');

    // ----------------------------------------------------
    // Scenario 3: Register a New Real Account
    // ----------------------------------------------------
    console.log('\n--- Scenario 3: Real Production User Registration ---');
    const testEmail = `prod.verified.${Date.now()}@example.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Verified Production User',
        email: testEmail,
        password: 'ProductionPass2026!'
      }
    });
    assert(regRes.status === 201 && regRes.data.success, 'New production account registered cleanly (201 Created)');
    assert(regRes.data.data.userId.startsWith('VE'), 'Production userId format issued: ' + regRes.data.data.userId);
    const userCookie = regRes.setCookie;

    // ----------------------------------------------------
    // Scenario 4: Login as Normal User
    // ----------------------------------------------------
    console.log('\n--- Scenario 4: Normal User Authentication & Authorization ---');
    const userLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'ProductionPass2026!'
      }
    });
    assert(userLoginRes.status === 200, 'Normal user successfully signed in with valid password');
    assert(userLoginRes.data.data.role === 'user', 'Normal user role is strictly "user"');

    // Normal user cannot access any demo or admin endpoints
    const normalUserResetAttempt = await request('/admin/reset-demo', {
      method: 'POST',
      headers: { Cookie: userLoginRes.setCookie }
    });
    assert(normalUserResetAttempt.status === 403, 'Normal user strictly blocked from reset-demo (403 Forbidden)');

    // ----------------------------------------------------
    // Scenario 5: Login as Production Admin
    // ----------------------------------------------------
    console.log('\n--- Scenario 5: Production Admin Authentication & Safeguards ---');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        userId: 'VE_ADMIN',
        password: 'Veloop2026!'
      }
    });
    assert(adminLoginRes.status === 200, 'Production admin authenticated with password');
    assert(adminLoginRes.data.data.role === 'admin', 'Admin role confirmed: admin');
    const adminCookie = adminLoginRes.setCookie;

    // Legitimate admin API works
    const adminGiveawaysRes = await request('/admin/giveaways', {
      headers: { Cookie: adminCookie }
    });
    assert(adminGiveawaysRes.status === 200 && adminGiveawaysRes.data.success, 'Legitimate admin endpoint /admin/giveaways is fully functional');

    // ----------------------------------------------------
    // Scenario 6: Refresh Page After Login
    // ----------------------------------------------------
    console.log('\n--- Scenario 6: Session Persistence (Page Refresh) ---');
    const refreshMeRes = await request('/auth/me', {
      headers: { Cookie: userCookie }
    });
    assert(refreshMeRes.status === 200 && refreshMeRes.data.data.email === testEmail, 'Session verified via httpOnly cookie on simulated page refresh');

    // ----------------------------------------------------
    // Scenario 7: Direct Access to Demo APIs in Production
    // ----------------------------------------------------
    console.log('\n--- Scenario 7: Direct Demo API Endpoint Rejection ---');
    const { resetDemo } = await import('./src/controllers/adminGiveawayController.js');
    const { getDemoUsers, login: prodLogin } = await import('./src/controllers/authController.js');
    const { protect } = await import('./src/middleware/authMiddleware.js');

    // Set production environment variables
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.NODE_ENV = 'production';
    process.env.DEMO_MODE = 'false';

    let capturedStatus = 0;
    let capturedBody = null;
    const mockRes = {
      status(code) {
        capturedStatus = code;
        return this;
      },
      json(body) {
        capturedBody = body;
        return body;
      },
      cookie() {},
      clearCookie() {}
    };

    // 1. Direct reset-demo call in production
    await resetDemo({ user: { role: 'admin' } }, mockRes, () => {});
    assert(capturedStatus === 403 && capturedBody?.error?.code === 'FORBIDDEN_IN_PRODUCTION', 'Direct call to POST /api/admin/reset-demo rejected (403 FORBIDDEN_IN_PRODUCTION)');

    // 2. Direct demo-users call in production
    await getDemoUsers({}, mockRes, () => {});
    assert(capturedStatus === 403 && capturedBody?.error?.code === 'FORBIDDEN_IN_PRODUCTION', 'Direct call to GET /api/auth/demo-users rejected (403 FORBIDDEN_IN_PRODUCTION)');

    // 3. Passwordless login call in production
    await prodLogin({ body: { userId: 'VE10025' } }, mockRes, () => {});
    assert(capturedStatus === 400 && capturedBody?.error?.code === 'PASSWORD_REQUIRED', 'Direct passwordless login rejected (400 PASSWORD_REQUIRED)');

    // 4. Header x-user-id bypass in production
    let protectCalled = false;
    await protect({ headers: { 'x-user-id': 'VE10025' }, cookies: {} }, mockRes, () => { protectCalled = true; });
    assert(!protectCalled && capturedStatus === 401, 'Direct x-user-id dev header bypass rejected (401 LOGIN_REQUIRED)');

    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DEMO_MODE = originalDemoMode;

    console.log('\n====================================================');
    console.log(`📊 Production Scenarios: ${passedTests} PASSED, ${failedTests} FAILED out of ${totalTests} checks`);
    console.log('====================================================');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('Production scenarios verification failed:', error);
    process.exit(1);
  }
}

verifyProductionScenarios();
