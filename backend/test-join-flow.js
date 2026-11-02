// VELOOP Giveaway Join Flow Verification Suite
const BASE_URL = 'http://localhost:5000/api';

async function runJoinFlowTests() {
  console.log('====================================================');
  console.log('🧪 Starting VELOOP Giveaway Join Flow Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 0. Ensure fresh DB state
    console.log('--- Phase 0: Resetting DB for clean join test baseline ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'VE_ADMIN', password: 'Veloop2026!' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success && adminLoginData.data.role === 'admin', 'Admin authenticated for test setup');
    const adminCookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0];

    const resetRes = await fetch(`${BASE_URL}/admin/reset-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie
      }
    }).then((r) => r.json());
    assert(resetRes.success, 'Demo database initialized cleanly');

    // Fetch current active giveaway
    const currRes = await fetch(`${BASE_URL}/giveaways/current`).then((r) => r.json());
    assert(currRes.success && currRes.data.status === 'ACTIVE', 'Active giveaway retrieved');
    const giveawayId = currRes.data.giveawayId;
    const iphonePrize = currRes.data.prizes.find((p) => p.slug === 'iphone-15-pro');
    assert(iphonePrize && iphonePrize.entryFee === 250, 'iPhone 15 Pro prize verified (fee: 250 VEs)');

    // Phase 1: Successful Join Flow (Normal Eligible User: Aarav VE10025)
    console.log('\n--- Phase 1: Successful Join Flow (Normal User: Aarav) ---');
    const aaravStatusBefore = await fetch(`${BASE_URL}/giveaways/${giveawayId}/my-status`, {
      headers: { 'x-user-id': 'VE10025' }
    }).then((r) => r.json());
    assert(
      aaravStatusBefore.success && aaravStatusBefore.data.isParticipating === false,
      'Aarav initial status: Not yet participating'
    );

    const aaravJoinRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'VE10025'
      },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId })
    }).then((r) => r.json());

    assert(aaravJoinRes.success === true, 'Join API response succeeded (201 Created)');
    assert(
      aaravJoinRes.data && aaravJoinRes.data.transactionId && aaravJoinRes.data.transactionId.startsWith('TXN-'),
      `Valid financial transaction ID issued: ${aaravJoinRes.data?.transactionId}`
    );
    assert(
      aaravJoinRes.data.newBalance === 600,
      `Balance atomically deducted from 850 to 600 VEs (newBalance: ${aaravJoinRes.data?.newBalance})`
    );

    // Verify status update immediately reflects participation
    const aaravStatusAfter = await fetch(`${BASE_URL}/giveaways/${giveawayId}/my-status`, {
      headers: { 'x-user-id': 'VE10025' }
    }).then((r) => r.json());
    assert(
      aaravStatusAfter.success && aaravStatusAfter.data.isParticipating === true,
      'Aarav updated status: isParticipating is authoritative true'
    );
    assert(
      aaravStatusAfter.data.participation.prizeId === iphonePrize.prizeId,
      'Participation record correctly linked to iPhone 15 Pro prize'
    );

    // Phase 2: Failed Join (Insufficient Balance: Priya VE10099)
    console.log('\n--- Phase 2: Failed Join (Insufficient Balance: Priya) ---');
    const priyaStatusBefore = await fetch(`${BASE_URL}/giveaways/${giveawayId}/my-status`, {
      headers: { 'x-user-id': 'VE10099' }
    }).then((r) => r.json());
    assert(
      priyaStatusBefore.success && priyaStatusBefore.data.isParticipating === false,
      'Priya initial status: Not participating'
    );

    const priyaJoinRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'VE10099'
      },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId })
    }).then((r) => r.json());

    assert(priyaJoinRes.success === false, 'Priya join rejected due to insufficient balance');
    assert(
      priyaJoinRes.error.code.includes('INSUFFICIENT_VE_BALANCE'),
      `Error code indicates insufficient VE balance: ${priyaJoinRes.error.code}`
    );
    assert(
      priyaJoinRes.error.message.includes('Not enough VEs'),
      `Descriptive error message returned: "${priyaJoinRes.error.message}"`
    );

    const priyaStatusAfter = await fetch(`${BASE_URL}/giveaways/${giveawayId}/my-status`, {
      headers: { 'x-user-id': 'VE10099' }
    }).then((r) => r.json());
    assert(
      priyaStatusAfter.data.isParticipating === false,
      'Priya participation status remains false after failed attempt'
    );

    // Phase 3: Repeated Join Attempts Prevention
    console.log('\n--- Phase 3: Repeated Join Attempts Prevention ---');
    // 3a. Aarav attempts second join on same giveaway
    const aaravRepeatJoinRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'VE10025'
      },
      body: JSON.stringify({ prizeId: 'PRIZE-002' }) // Attempts Apple Watch
    }).then((r) => r.json());

    assert(aaravRepeatJoinRes.success === false, 'Duplicate join rejected');
    assert(
      aaravRepeatJoinRes.error.code === 'ALREADY_PARTICIPATING',
      `Duplicate rejection code is ALREADY_PARTICIPATING: ${aaravRepeatJoinRes.error.code}`
    );

    // Verify balance was NOT deducted again (still 600)
    const aaravUserRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'x-user-id': 'VE10025' }
    }).then((r) => r.json());
    assert(
      aaravUserRes.data.balances.VEs === 600,
      'Balance protected against duplicate deductions (remains 600 VEs)'
    );

    // 3b. Pre-seeded demo account Rohan (VE10042)
    const rohanStatus = await fetch(`${BASE_URL}/giveaways/${giveawayId}/my-status`, {
      headers: { 'x-user-id': 'VE10042' }
    }).then((r) => r.json());
    assert(
      rohanStatus.success && rohanStatus.data.isParticipating === true,
      'Pre-seeded demo user Rohan is verified as isParticipating: true'
    );

    const rohanJoinRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'VE10042'
      },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId })
    }).then((r) => r.json());
    assert(
      !rohanJoinRes.success && rohanJoinRes.error.code === 'ALREADY_PARTICIPATING',
      'Pre-seeded demo user Rohan join attempt blocked with ALREADY_PARTICIPATING'
    );

    // 3c. Admin account (VE_ADMIN)
    console.log('\n--- Phase 4: Admin Account Exclusion ---');
    const freshAdminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'VE_ADMIN', password: 'Veloop2026!' })
    });
    const freshAdminCookie = freshAdminLogin.headers.get('set-cookie')?.split(';')[0];

    const adminJoinRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAdminCookie
      },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId })
    }).then((r) => r.json());

    assert(adminJoinRes.success === false, 'Admin join attempt rejected');
    assert(
      adminJoinRes.error.code === 'ADMIN_CANNOT_PARTICIPATE',
      `Admin rejection code is ADMIN_CANNOT_PARTICIPATE: ${adminJoinRes.error.code}`
    );

    // Phase 5: Page Refresh / Session Persistence Simulation
    console.log('\n--- Phase 5: Page Refresh / Session Persistence ---');
    // Simulating a fresh page reload where client state is rebuilt from authoritative server endpoint
    const refreshStatusRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/my-status`, {
      headers: { 'x-user-id': 'VE10025' }
    }).then((r) => r.json());
    assert(
      refreshStatusRes.success && refreshStatusRes.data.isParticipating === true,
      'On page refresh, participation status is persistently returned as isParticipating: true'
    );
    assert(
      refreshStatusRes.data.entryCount === 1,
      'Authoritative entryCount is strictly 1'
    );

    // Phase 6: Teardown - Reset DB to preserve baseline compatibility
    console.log('\n--- Phase 6: Resetting DB for Clean Teardown ---');
    const teardownReset = await fetch(`${BASE_URL}/admin/reset-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAdminCookie
      }
    }).then((r) => r.json());
    assert(teardownReset.success, 'Database restored to clean baseline state');

    console.log('\n====================================================');
    console.log(`📊 Join Flow Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during join flow test:', err);
    process.exit(1);
  }
}

runJoinFlowTests();
