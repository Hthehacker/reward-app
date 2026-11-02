/**
 * VELOOP Rewards - Demo Environment & Client Handover Comprehensive Audit Test
 *
 * Verifies:
 *  1. All 8 personas represent their exact intended user states & balances.
 *  2. Participation, winner, and claim status consistency across backend models.
 *  3. Demo switcher & account switching cannot bypass auth or RBAC.
 *  4. Draw winners, reset DB, and status updates are strictly protected by adminOnly.
 *  5. Reset operations are blocked in production and on production-designated databases.
 *  6. Passwordless demo login and x-user-id header are blocked in production / when DEMO_MODE is false.
 *  7. Demo endpoints are blocked in production (demo-users, reset-demo).
 *  8. Synthetic test data preserves user privacy (masked IDs, no exposed PII).
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

async function runDemoAudit() {
  console.log('====================================================');
  console.log('🔍 Starting VELOOP Demo Environment & Handover Audit');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // Section 1: Clean Baseline Setup
    // ----------------------------------------------------
    console.log('--- Section 1: Initializing Demo State ---');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE_ADMIN', password: 'Veloop2026!' }
    });
    assert(adminLoginRes.status === 200, 'Admin authenticated for audit setup');
    const adminCookie = adminLoginRes.setCookie;

    const resetRes = await request('/admin/reset-demo', {
      method: 'POST',
      headers: { Cookie: adminCookie }
    });
    assert(resetRes.status === 200 && resetRes.data.success, 'Demo database reset and seeded with standard records');

    // Re-authenticate admin to get fresh token matching re-seeded database ID
    const freshAdminLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE_ADMIN', password: 'Veloop2026!' }
    });
    const freshAdminCookie = freshAdminLogin.setCookie;

    // Fetch active giveaway and prizes
    const gwRes = await request('/giveaways/current');
    assert(gwRes.status === 200 && gwRes.data.data.giveawayId === 'GW-2026-08', 'Active giveaway is GW-2026-08 (Summer Rewards)');
    const activeGwId = gwRes.data.data.giveawayId;

    // ----------------------------------------------------
    // Section 2: Persona State & Consistency Verification (8 Personas)
    // ----------------------------------------------------
    console.log('\n--- Section 2: Persona States & Consistency Audit ---');

    // 1. VISITOR Persona
    console.log('\n[Persona 1: VISITOR]');
    const visitorPartRes = await request(`/giveaways/${activeGwId}/my-status`);
    assert(visitorPartRes.status === 401 && visitorPartRes.data.error.code === 'LOGIN_REQUIRED', 'Visitor participation check returns 401 LOGIN_REQUIRED');
    const visitorJoinRes = await request(`/giveaways/${activeGwId}/join`, {
      method: 'POST',
      body: { prizeId: 'PRIZE-001' }
    });
    assert(visitorJoinRes.status === 401 && visitorJoinRes.data.error.code === 'LOGIN_REQUIRED', 'Visitor join attempt strictly blocked with 401 LOGIN_REQUIRED');

    // 2. AARAV (Eligible Member)
    console.log('\n[Persona 2: Aarav - Eligible]');
    const aaravLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE10025' }
    });
    assert(aaravLogin.status === 200, 'Aarav authenticated');
    assert(aaravLogin.data.data.balances.VEs === 850, 'Aarav has 850 VEs (eligible for 250 VE prize)');
    assert(aaravLogin.data.data.balances.SVEs === 1200, 'Aarav has 1200 SVEs');
    assert(aaravLogin.data.data.balances.tokens === 5000, 'Aarav has 5000 Tokens');
    const aaravPartRes = await request(`/giveaways/${activeGwId}/my-status`, {
      headers: { Cookie: aaravLogin.setCookie }
    });
    assert(aaravPartRes.data.data.isParticipating === false, 'Aarav is not yet participating (Can Join)');

    // 3. PRIYA (Insufficient Balance)
    console.log('\n[Persona 3: Priya - Insufficient Balance]');
    const priyaLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE10099' }
    });
    assert(priyaLogin.status === 200, 'Priya authenticated');
    assert(priyaLogin.data.data.balances.VEs === 120, 'Priya has 120 VEs (below 250 fee)');
    assert(priyaLogin.data.data.balances.SVEs === 100, 'Priya has 100 SVEs (below 500 fee)');
    assert(priyaLogin.data.data.balances.tokens === 350, 'Priya has 350 Tokens (below 2000 fee)');
    const priyaJoinIphone = await request(`/giveaways/${activeGwId}/join`, {
      method: 'POST',
      headers: { Cookie: priyaLogin.setCookie },
      body: { prizeId: 'PRIZE-001' }
    });
    assert(priyaJoinIphone.status === 400 && priyaJoinIphone.data.error.code === 'INSUFFICIENT_VE_BALANCE', 'Priya joining iPhone blocked with INSUFFICIENT_VE_BALANCE');
    const priyaJoinAirpods = await request(`/giveaways/${activeGwId}/join`, {
      method: 'POST',
      headers: { Cookie: priyaLogin.setCookie },
      body: { prizeId: 'PRIZE-003' }
    });
    assert(priyaJoinAirpods.status === 400 && priyaJoinAirpods.data.error.code === 'INSUFFICIENT_SVE_BALANCE', 'Priya joining AirPods blocked with INSUFFICIENT_SVE_BALANCE');
    const priyaJoinToken = await request(`/giveaways/${activeGwId}/join`, {
      method: 'POST',
      headers: { Cookie: priyaLogin.setCookie },
      body: { prizeId: 'PRIZE-006' }
    });
    assert(priyaJoinToken.status === 400 && priyaJoinToken.data.error.code === 'INSUFFICIENT_TOKEN_BALANCE', 'Priya joining Lucky Draw blocked with INSUFFICIENT_TOKEN_BALANCE');

    // 4. ROHAN (Already Participating)
    console.log('\n[Persona 4: Rohan - Already Participating]');
    const rohanLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE10042' }
    });
    assert(rohanLogin.status === 200, 'Rohan authenticated');
    assert(rohanLogin.data.data.balances.VEs === 600, 'Rohan balance reflects 250 VE entry deduction (600 VEs)');
    const rohanPartRes = await request(`/giveaways/${activeGwId}/my-status`, {
      headers: { Cookie: rohanLogin.setCookie }
    });
    assert(rohanPartRes.data.data.isParticipating === true, 'Rohan isParticipating is verified true');
    assert(rohanPartRes.data.data.participation.prizeId === 'PRIZE-001', 'Rohan is registered for iPhone 15 Pro');
    const rohanRejoin = await request(`/giveaways/${activeGwId}/join`, {
      method: 'POST',
      headers: { Cookie: rohanLogin.setCookie },
      body: { prizeId: 'PRIZE-001' }
    });
    assert((rohanRejoin.status === 409 || rohanRejoin.status === 400) && rohanRejoin.data.error.code === 'ALREADY_PARTICIPATING', 'Rohan duplicate entry rejected with ALREADY_PARTICIPATING');

    // 5. ANANYA (Physical Prize Winner)
    console.log('\n[Persona 5: Ananya - Physical Prize Winner]');
    const ananyaLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE10088' }
    });
    assert(ananyaLogin.status === 200, 'Ananya authenticated');
    const ananyaClaimStatus = await request(`/giveaways/${activeGwId}/my-claim`, {
      headers: { Cookie: ananyaLogin.setCookie }
    });
    assert(ananyaClaimStatus.data.data.isWinner === true, 'Ananya is recognized as winner in active giveaway');
    assert(ananyaClaimStatus.data.data.winnerRecord.prizeType === 'physical', 'Ananya won a physical prize (Apple Watch)');
    assert(ananyaClaimStatus.data.data.claimStatus === 'NOT_SUBMITTED', 'Claim status is initial NOT_SUBMITTED');
    // Test physical claim validation
    const ananyaIncompleteClaim = await request(`/giveaways/${activeGwId}/claim`, {
      method: 'POST',
      headers: { Cookie: ananyaLogin.setCookie },
      body: { physicalDetails: { fullName: 'Ananya Roy' } }
    });
    assert(ananyaIncompleteClaim.status === 400 && ananyaIncompleteClaim.data.error.code === 'INCOMPLETE_ADDRESS', 'Incomplete address rejected for physical prize');
    const ananyaValidClaim = await request(`/giveaways/${activeGwId}/claim`, {
      method: 'POST',
      headers: { Cookie: ananyaLogin.setCookie },
      body: {
        physicalDetails: {
          fullName: 'Ananya Roy',
          phoneNumber: '+91 98765 43210',
          completeAddress: 'Flat 402, Lotus Greens, Sector 78',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pinCode: '201301'
        }
      }
    });
    assert(ananyaValidClaim.status === 200 && ananyaValidClaim.data.success, 'Ananya successfully submitted physical delivery claim');

    // 6. KABIR (Digital Gift Card Winner)
    console.log('\n[Persona 6: Kabir - Digital Voucher Winner]');
    const kabirLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE10077' }
    });
    assert(kabirLogin.status === 200, 'Kabir authenticated');
    const kabirClaimStatus = await request(`/giveaways/${activeGwId}/my-claim`, {
      headers: { Cookie: kabirLogin.setCookie }
    });
    assert(kabirClaimStatus.data.data.isWinner === true, 'Kabir is recognized as winner in active giveaway');
    assert(kabirClaimStatus.data.data.winnerRecord.prizeType === 'gift_card', 'Kabir won a gift card prize (₹2,000 Amazon Voucher)');
    // Test digital claim validation
    const kabirNoEmailClaim = await request(`/giveaways/${activeGwId}/claim`, {
      method: 'POST',
      headers: { Cookie: kabirLogin.setCookie },
      body: { digitalDetails: {} }
    });
    assert(kabirNoEmailClaim.status === 400 && kabirNoEmailClaim.data.error.code === 'MISSING_EMAIL', 'Missing email rejected for digital voucher claim');
    const kabirValidClaim = await request(`/giveaways/${activeGwId}/claim`, {
      method: 'POST',
      headers: { Cookie: kabirLogin.setCookie },
      body: { digitalDetails: { emailAddress: 'kabir.mehta@veloop.io' } }
    });
    assert(kabirValidClaim.status === 200 && kabirValidClaim.data.success, 'Kabir successfully claimed voucher with email (no postal address required)');

    // 7. MEERA (Non-Winner in Ended Event)
    console.log('\n[Persona 7: Meera - Non-Winner (Ended Event)]');
    const meeraLogin = await request('/auth/login', {
      method: 'POST',
      body: { userId: 'VE10012' }
    });
    assert(meeraLogin.status === 200, 'Meera authenticated');
    // Check participation in active giveaway (AirPods Pro)
    const meeraPartActive = await request(`/giveaways/${activeGwId}/my-status`, {
      headers: { Cookie: meeraLogin.setCookie }
    });
    assert(meeraPartActive.data.data.isParticipating === true, 'Meera has verified participation in active giveaway');
    // Check claim status in ended giveaway GW-2026-07
    const meeraPastClaim = await request('/giveaways/GW-2026-07/my-claim', {
      headers: { Cookie: meeraLogin.setCookie }
    });
    assert(meeraPastClaim.data.data.isWinner === false, 'Meera is verified as a participant Non-Winner in ended event');

    // 8. ADMIN (Full Control)
    console.log('\n[Persona 8: Admin - Full Platform Control]');
    assert(freshAdminLogin.data.data.role === 'admin', 'Admin role is admin');
    assert(freshAdminLogin.data.data.balances === null, 'Admin balances are null (Admins do not hold coins)');
    const adminJoin = await request(`/giveaways/${activeGwId}/join`, {
      method: 'POST',
      headers: { Cookie: freshAdminCookie },
      body: { prizeId: 'PRIZE-001' }
    });
    assert(adminJoin.status === 403 && adminJoin.data.error.code === 'ADMIN_CANNOT_PARTICIPATE', 'Admin blocked from participating in giveaway draws');
    const adminEarn = await request('/auth/earn-balance', {
      method: 'POST',
      headers: { Cookie: freshAdminCookie },
      body: { currency: 'VE', amount: 100 }
    });
    assert(adminEarn.status === 403 && adminEarn.data.error.code === 'ADMIN_NO_COINS', 'Admin blocked from earning coins');

    // ----------------------------------------------------
    // Section 3: RBAC Protection & Escalation Prevention
    // ----------------------------------------------------
    console.log('\n--- Section 3: RBAC & Authorization Enforcement ---');

    // Regular users cannot call admin endpoints
    const aaravReset = await request('/admin/reset-demo', {
      method: 'POST',
      headers: { Cookie: aaravLogin.setCookie }
    });
    assert(aaravReset.status === 403 && aaravReset.data.error.code === 'FORBIDDEN', 'Standard user (Aarav) strictly blocked from /admin/reset-demo (403)');

    const aaravDraw = await request(`/admin/giveaways/${activeGwId}/select-winners`, {
      method: 'POST',
      headers: { Cookie: aaravLogin.setCookie }
    });
    assert(aaravDraw.status === 403 && aaravDraw.data.error.code === 'FORBIDDEN', 'Standard user (Aarav) strictly blocked from Draw Winners (403)');

    const aaravStatus = await request(`/admin/giveaways/${activeGwId}/status`, {
      method: 'POST',
      headers: { Cookie: aaravLogin.setCookie },
      body: { status: 'ENDED' }
    });
    assert(aaravStatus.status === 403 && aaravStatus.data.error.code === 'FORBIDDEN', 'Standard user (Aarav) strictly blocked from status change (403)');

    const aaravCoinAdjust = await request('/admin/coins/adjust', {
      method: 'POST',
      headers: { Cookie: aaravLogin.setCookie },
      body: { userId: 'VE10025', currency: 'VE', amount: 500, action: 'ADD', reason: 'Hack' }
    });
    assert(aaravCoinAdjust.status === 403 && aaravCoinAdjust.data.error.code === 'FORBIDDEN', 'Standard user strictly blocked from adjusting coins (403)');

    // Privilege escalation via dev header (x-user-id: VE_ADMIN) must be rejected
    const headerEscalation = await request('/admin/users', {
      headers: { 'x-user-id': 'VE_ADMIN' }
    });
    assert(headerEscalation.status === 401 || headerEscalation.status === 403, 'Privilege escalation via x-user-id: VE_ADMIN strictly rejected');

    // ----------------------------------------------------
    // Section 4: Production Guard Verification
    // ----------------------------------------------------
    console.log('\n--- Section 4: Production Guards & Safe Environment Verification ---');

    // Verify /api/health transparency
    const healthRes = await request('/health');
    assert(healthRes.status === 200, '/api/health is accessible');
    assert(healthRes.data.demoMode === true, 'Health reports demoMode: true in current staging/dev environment');
    assert(healthRes.data.environment === 'development', 'Health reports environment accurately');

    // Verify demo users list is available in demo mode
    const demoUsersRes = await request('/auth/demo-users');
    assert(demoUsersRes.status === 200 && demoUsersRes.data.data.length >= 7, 'Demo personas endpoint returns persona list in demo mode');

    // Verify no passwords or refresh token hashes are leaked in demo user list
    const leakedPassword = demoUsersRes.data.data.some((u) => u.password || u.refreshTokenHash);
    assert(!leakedPassword, 'Demo user list strictly excludes passwords and refreshTokenHash fields');

    // Verify all seeded emails use mock domain @veloop.io
    const allSyntheticEmails = demoUsersRes.data.data.every((u) => u.email.endsWith('@veloop.io'));
    assert(allSyntheticEmails, 'All demo user emails strictly use synthetic @veloop.io domain (zero real PII)');

    // Verify historical winners mask user IDs for privacy
    const pastWinnersRes = await request('/giveaways/GW-2026-07/winners');
    assert(pastWinnersRes.status === 200, 'Past giveaway winners retrieved');
    const winnersList = pastWinnersRes.data?.data?.winners || [];
    assert(winnersList.length > 0, 'Past giveaway winners list contains records');
    const allMasked = winnersList.every((w) => w.maskedId && w.maskedId.includes('****'));
    assert(allMasked, 'All historical winner records display privacy-masked IDs (e.g. VE****42)');

    // ----------------------------------------------------
    // Section 5: Direct Production Safety Lock Verification
    // ----------------------------------------------------
    console.log('\n--- Section 5: Direct Production Safety Lock Verification ---');
    const { resetDemo } = await import('./src/controllers/adminGiveawayController.js');
    const { getDemoUsers: prodGetDemoUsers, login: prodLogin } = await import('./src/controllers/authController.js');
    const { seedDatabase } = await import('./src/utils/seedData.js');
    const { protect } = await import('./src/middleware/authMiddleware.js');

    // Simulate Production Environment
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
      }
    };

    // 1. Production blocks resetDemo
    await resetDemo({ user: { role: 'admin' } }, mockRes, () => {});
    assert(capturedStatus === 403 && capturedBody?.error?.code === 'FORBIDDEN_IN_PRODUCTION', 'resetDemo strictly rejected in production (403 FORBIDDEN_IN_PRODUCTION)');

    // 2. Production blocks getDemoUsers
    await prodGetDemoUsers({}, mockRes, () => {});
    assert(capturedStatus === 403 && capturedBody?.error?.code === 'FORBIDDEN_IN_PRODUCTION', 'getDemoUsers strictly rejected in production (403 FORBIDDEN_IN_PRODUCTION)');

    // 3. Production blocks passwordless login
    await prodLogin({ body: { userId: 'VE10025' } }, mockRes, () => {});
    assert(capturedStatus === 400 && capturedBody?.error?.code === 'PASSWORD_REQUIRED', 'Passwordless login strictly rejected in production (400 PASSWORD_REQUIRED)');

    // 4. Production blocks seedDatabase execution
    let seedBlocked = false;
    try {
      await seedDatabase();
    } catch (err) {
      if (err.message.includes('[Safety Lock]')) seedBlocked = true;
    }
    assert(seedBlocked, 'seedDatabase() strictly aborted by Safety Lock in production');

    // 5. Inactive DEMO_MODE blocks dev header x-user-id
    let protectCalledNext = false;
    await protect({ headers: { 'x-user-id': 'VE10025' }, cookies: {} }, mockRes, () => { protectCalledNext = true; });
    assert(!protectCalledNext && capturedStatus === 401, 'x-user-id dev header strictly ignored when DEMO_MODE is not true');

    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DEMO_MODE = originalDemoMode;

    // Clean teardown reset
    console.log('\n--- Section 6: Teardown Reset ---');
    const finalReset = await request('/admin/reset-demo', {
      method: 'POST',
      headers: { Cookie: freshAdminCookie }
    });
    assert(finalReset.status === 200, 'Final demo database reset completed cleanly');

    console.log('\n====================================================');
    console.log(`📊 Audit Results: ${passedTests} PASSED, ${failedTests} FAILED out of ${totalTests} checks`);
    console.log('====================================================');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Audit execution failure:', error);
    process.exit(1);
  }
}

runDemoAudit();
