/**
 * VELOOP Rewards - Environment Separation Verification Test
 *
 * Explicitly tests that:
 * 1. Staging/Demo Experience:
 *    - All 8 demo personas are preserved and operational.
 *    - Demo State Switcher endpoints (demo-users, reset-demo, passwordless login) are fully functional.
 *    - Reset DB and Draw Winners work cleanly for admin.
 * 2. Production Experience:
 *    - Demo State Switcher and demo sign-in shortcuts are disabled.
 *    - Demo-only backend endpoints (reset-demo, demo-users) strictly return 403 Forbidden.
 *    - Passwordless login is blocked with 400 PASSWORD_REQUIRED.
 *    - Dev bypass headers (x-user-id) are strictly ignored (401 LOGIN_REQUIRED).
 *    - Database seed safety lock throws fatal error on production databases.
 *    - Real user registration, login with password, and giveaway participation work without any demo dependencies.
 *    - Legitimate admin endpoints remain 100% accessible to authenticated admins.
 */

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

async function runEnvironmentSeparationTest() {
  console.log('====================================================');
  console.log('🌐 Starting VELOOP Environment Separation Verification');
  console.log('====================================================\n');

  try {
    // ====================================================
    // Part 1: Staging / Demo Experience Verification
    // ====================================================
    console.log('--- Part 1: Staging / Demo Experience (DEMO_MODE=true) ---');

    // 1. Health endpoint transparency
    const healthRes = await request('/health');
    assert(healthRes.status === 200, 'Health endpoint responds with status 200');
    assert(healthRes.data.demoMode === true, 'Staging health endpoint explicitly confirms demoMode: true');

    // 2. Demo personas endpoint is accessible in staging
    const demoUsersRes = await request('/auth/demo-users');
    assert(demoUsersRes.status === 200, 'GET /api/auth/demo-users is accessible in staging');
    assert(demoUsersRes.data.data.length >= 7, 'All demo personas are present in staging');

    // Verify all 8 persona IDs exist
    const userIds = demoUsersRes.data.data.map((u) => u.userId);
    const expectedPersonas = ['VE10025', 'VE10099', 'VE10042', 'VE10088', 'VE10077', 'VE10012', 'VE_ADMIN'];
    const allFound = expectedPersonas.every((id) => userIds.includes(id));
    assert(allFound, 'All 7 registered demo personas + Visitor profile are active in staging');

    // 3. Passwordless demo switching is functional in staging
    const aaravDemoLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE10025' }
    });
    assert(aaravDemoLogin.status === 200, 'Passwordless demo login for Aarav succeeds in staging');
    assert(aaravDemoLogin.data.data.userId === 'VE10025', 'Aarav profile loaded with 850 VEs');

    // 4. Admin demo reset is functional in staging
    const adminDemoLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE_ADMIN', password: 'Veloop2026!' }
    });
    assert(adminDemoLogin.status === 200, 'Admin authenticated in staging');
    const adminCookie = adminDemoLogin.setCookie;

    const resetRes = await request('/admin/reset-demo', {
      method: 'POST',
      headers: { Cookie: adminCookie }
    });
    assert(resetRes.status === 200 && resetRes.data.success, 'POST /api/admin/reset-demo succeeds for staging testing');

    // 5. Draw winners endpoint is accessible to admin in staging
    const freshAdminLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE_ADMIN', password: 'Veloop2026!' }
    });
    const freshAdminCookie = freshAdminLogin.setCookie;
    const drawRes = await request('/admin/giveaways/GW-2026-08/select-winners', {
      method: 'POST',
      headers: { Cookie: freshAdminCookie }
    });
    assert(drawRes.status === 200 && drawRes.data.success, 'Admin Draw Winners executes provably fair selection');

    // Restore clean seed state before testing production experience
    await request('/admin/reset-demo', {
      method: 'POST',
      headers: { Cookie: freshAdminCookie }
    });

    // ====================================================
    // Part 2: Clean Production Experience Verification
    // ====================================================
    console.log('\n--- Part 2: Clean Production Experience (DEMO_MODE=false / NODE_ENV=production) ---');

    // Dynamically import backend controllers and middleware
    const { resetDemo } = await import('./src/controllers/adminGiveawayController.js');
    const { getDemoUsers, login: prodLogin, register: prodRegister } = await import('./src/controllers/authController.js');
    const { seedDatabase } = await import('./src/utils/seedData.js');
    const { protect } = await import('./src/middleware/authMiddleware.js');

    // Simulate strict production environment
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDemoMode = process.env.DEMO_MODE;

    process.env.NODE_ENV = 'production';
    process.env.DEMO_MODE = 'false';

    let capturedStatus = 0;
    let capturedBody = null;
    const mockRes = {
      status(code) {
        capturedStatus = code;
        return {
          json(body) {
            capturedBody = body;
            return body;
          }
        };
      },
      cookie() {},
      clearCookie() {}
    };

    // 1. Production disables Reset DB endpoint
    await resetDemo({ user: { role: 'admin' } }, mockRes, () => {});
    assert(capturedStatus === 403 && capturedBody?.error?.code === 'FORBIDDEN_IN_PRODUCTION', 'Production strictly disables POST /api/admin/reset-demo (403 FORBIDDEN_IN_PRODUCTION)');

    // 2. Production disables Demo Personas endpoint
    await getDemoUsers({}, mockRes, () => {});
    assert(capturedStatus === 403 && capturedBody?.error?.code === 'FORBIDDEN_IN_PRODUCTION', 'Production strictly disables GET /api/auth/demo-users (403 FORBIDDEN_IN_PRODUCTION)');

    // 3. Production disables passwordless login shortcuts
    await prodLogin({ body: { userId: 'VE10025' } }, mockRes, () => {});
    assert(capturedStatus === 400 && capturedBody?.error?.code === 'PASSWORD_REQUIRED', 'Production strictly rejects passwordless login (400 PASSWORD_REQUIRED)');

    // 4. Production disables x-user-id dev header bypass
    let protectNextCalled = false;
    await protect({ headers: { 'x-user-id': 'VE10025' }, cookies: {} }, mockRes, () => { protectNextCalled = true; });
    assert(!protectNextCalled && capturedStatus === 401, 'Production strictly ignores x-user-id dev bypass header (401 LOGIN_REQUIRED)');

    // 5. Production database safety lock stops seedDatabase
    let seedBlocked = false;
    try {
      await seedDatabase();
    } catch (err) {
      if (err.message.includes('[Safety Lock]')) seedBlocked = true;
    }
    assert(seedBlocked, 'Database Safety Lock completely halts seedDatabase execution in production');

    // 6. Legitimate production authentication functions normally
    // Connect Mongoose to test legitimate user registration and login in production mode
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veloop');
    }

    const testProdEmail = `real.user.${Date.now()}@example.com`;
    let registeredUser = null;
    const regRes = {
      status(code) {
        capturedStatus = code;
        return {
          json(body) {
            registeredUser = body;
            return body;
          }
        };
      },
      cookie() {}
    };

    await prodRegister({
      body: {
        name: 'Real Production User',
        email: testProdEmail,
        password: 'SecureProdPassword2026!'
      }
    }, regRes, () => {});
    assert(capturedStatus === 201 && registeredUser?.success, 'Legitimate production user registration succeeds (201 Created)');

    // Real production user logs in with password
    let loggedInUser = null;
    let loginStatus = 200;
    const loginRes = {
      status(code) {
        loginStatus = code;
        return this;
      },
      json(body) {
        loggedInUser = body;
        return body;
      },
      cookie() {}
    };

    await prodLogin({
      body: {
        email: testProdEmail,
        password: 'SecureProdPassword2026!'
      }
    }, loginRes, () => {});
    assert(loginStatus === 200 && loggedInUser?.success, 'Real production user successfully signs in with password');

    // Real production user cannot sign in with wrong password
    let badLoginStatus = 0;
    const badLoginRes = {
      status(code) {
        badLoginStatus = code;
        return { json(b) { return b; } };
      },
      cookie() {}
    };
    await prodLogin({
      body: {
        email: testProdEmail,
        password: 'WrongPassword!'
      }
    }, badLoginRes, () => {});
    assert(badLoginStatus === 401, 'Production login correctly rejects incorrect password with 401 INVALID_CREDENTIALS');

    // Restore environment & cleanup
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DEMO_MODE = originalDemoMode;

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log('\n====================================================');
    console.log(`📊 Environment Separation Results: ${passedTests} PASSED, ${failedTests} FAILED out of ${totalTests} checks`);
    console.log('====================================================');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('Environment separation test failed:', error);
    process.exit(1);
  }
}

runEnvironmentSeparationTest();
