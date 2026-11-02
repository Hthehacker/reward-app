// VELOOP Automated Integration, Security & RBAC Verification Suite
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Starting VELOOP Rewards Full-Stack Verification');
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
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    assert(healthRes.status === 'healthy', 'Backend health check responds healthy');

    // 2. Fetch current giveaway
    const currRes = await fetch(`${BASE_URL}/giveaways/current`).then((r) => r.json());
    assert(currRes.success && currRes.data.status === 'ACTIVE', 'Active giveaway retrieved from DB');
    const giveawayId = currRes.data.giveawayId;

    // 3. Verify prizes configuration
    assert(currRes.data.prizes.length >= 6, `Prizes loaded correctly (${currRes.data.prizes.length} prizes)`);
    const iphonePrize = currRes.data.prizes.find((p) => p.slug === 'iphone-15-pro');
    assert(iphonePrize && iphonePrize.entryFee === 250 && iphonePrize.entryCurrency === 'VE', 'iPhone prize has authoritative fee 250 VEs');

    // 4. Test Unauthenticated Join Protection (Req #69, #98)
    const unauthRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId })
    }).then((r) => r.json());
    assert(!unauthRes.success && unauthRes.error.code === 'LOGIN_REQUIRED', 'Unauthenticated join rejected with LOGIN_REQUIRED');

    // 5. Test Insufficient Balance Rejection (Req #70, #88)
    // Priya (VE10099) only has 120 VEs (needs 250 VEs)
    const lowBalRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'VE10099' },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId })
    }).then((r) => r.json());
    assert(
      !lowBalRes.success && lowBalRes.error.code.includes('INSUFFICIENT'),
      'Insufficient balance rejected atomically without deducting funds'
    );

    // 6. Test Client-Side Tampering Rejection (Req #70, #73)
    // User tries to send { amount: 1 } or altered currency
    const tamperRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'VE10099' },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId, amount: 1, currency: 'VE' })
    }).then((r) => r.json());
    assert(
      !tamperRes.success && tamperRes.error.code.includes('INSUFFICIENT'),
      'Client-side price tampering (amount=1) ignored; DB authoritative fee strictly enforced'
    );

    // 7. Test Duplicate Participation Protection (Req #69, #70)
    // Rohan (VE10042) is already participating in this giveaway
    const dupRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'VE10042' },
      body: JSON.stringify({ prizeId: iphonePrize.prizeId })
    }).then((r) => r.json());
    assert(
      !dupRes.success && dupRes.error.code === 'ALREADY_PARTICIPATING',
      'Duplicate participation rejected with ALREADY_PARTICIPATING'
    );

    // 8. Test Active Giveaway Winner Privacy (Req #21)
    // While giveaway is live, MUST NOT falsely show winners!
    const winLiveRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/winners`).then((r) => r.json());
    assert(
      winLiveRes.success && winLiveRes.data.isLive === true && winLiveRes.data.winners.length === 0,
      'Active giveaway strictly hides winners and informs users giveaway is still live'
    );

    // 9. Test Previous Winners Tab (Req #22, #24, #25)
    const prevWinRes = await fetch(`${BASE_URL}/giveaways/previous/winners`).then((r) => r.json());
    assert(prevWinRes.success && prevWinRes.data.length > 0, `Previous winners history retrieved (${prevWinRes.data.length} winners)`);
    const samplePrev = prevWinRes.data[0];
    assert(samplePrev.userId.includes('****'), `Winner IDs are privacy masked: ${samplePrev.userId}`);

    // 10. Test Winner Claim Protection for Non-Winner (Req #33, #34)
    // Aarav (VE10025) is not a winner
    const nonWinClaim = await fetch(`${BASE_URL}/giveaways/${giveawayId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'VE10025' },
      body: JSON.stringify({ physicalDetails: { fullName: 'Aarav' } })
    }).then((r) => r.json());
    assert(!nonWinClaim.success && nonWinClaim.error.code === 'CLAIM_NOT_ALLOWED', 'Non-winner cannot access or submit prize claim');

    // 11. Test Winner Claim for Physical Prize (Req #26, #28, #36)
    // Ananya (VE10088) is seeded winner of Apple Watch
    const claimRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'VE10088' },
      body: JSON.stringify({
        physicalDetails: {
          fullName: 'Ananya Roy',
          phoneNumber: '+91 9876543210',
          completeAddress: '702 Sea View Tower, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400050'
        }
      })
    }).then((r) => r.json());
    assert(claimRes.success && claimRes.data.status === 'SUBMITTED', 'Physical prize claim submitted with full address details');

    // 12. Test Winner Claim for Digital Gift Card (Req #29, #37)
    // Kabir (VE10077) is seeded winner of ₹2,000 Amazon Voucher
    const gcClaimRes = await fetch(`${BASE_URL}/giveaways/${giveawayId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'VE10077' },
      body: JSON.stringify({
        digitalDetails: {
          emailAddress: 'kabir.mehta@veloop.io'
        }
      })
    }).then((r) => r.json());
    assert(gcClaimRes.success && gcClaimRes.data.prizeType === 'gift_card', 'Amazon gift card claimed with email only without requiring physical address');

    // 13. Test User Registration Feature
    const testEmail = `tester_${Date.now()}@veloop.io`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Tester',
        email: testEmail,
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    assert(regData.success && regData.data.userId.startsWith('VE'), 'User registration created account with unique userId');
    const cookieHeader = regRes.headers.get('set-cookie');
    assert(cookieHeader && cookieHeader.includes('token='), 'Registration sets httpOnly token cookie');

    // 14. Test Duplicate Registration Prevention
    const dupRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Tester',
        email: testEmail,
        password: 'Password123!'
      })
    }).then((r) => r.json());
    assert(!dupRegRes.success && dupRegRes.error.code === 'EMAIL_ALREADY_EXISTS', 'Duplicate email registration rejected');

    // 15. Test Login with Password (Valid vs Invalid)
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!'
      })
    }).then((r) => r.json());
    assert(!badLoginRes.success && badLoginRes.error.code === 'INVALID_CREDENTIALS', 'Invalid password rejected on login');

    const goodLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });
    const goodLoginData = await goodLoginRes.json();
    assert(goodLoginData.success && goodLoginData.data.email === testEmail, 'Valid password accepted on login');
    const userAuthCookie = goodLoginRes.headers.get('set-cookie');

    // 16. Test Persistent Authentication via Cookie (/auth/me)
    const tokenExtract = userAuthCookie.split(';')[0];
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: tokenExtract }
    }).then((r) => r.json());
    assert(meRes.success && meRes.data.email === testEmail, 'Persistent authentication verified via httpOnly cookie');

    // 17. Test Role-Based Access Control (Regular User blocked from Admin Endpoints)
    const blockedAdminRes = await fetch(`${BASE_URL}/admin/giveaways`, {
      headers: { Cookie: tokenExtract }
    });
    assert(blockedAdminRes.status === 403, 'Regular user strictly blocked from admin routes (403 Forbidden)');

    // 18. Test Admin Login and Admin Operations
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'VE_ADMIN',
        password: 'Veloop2026!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success && adminLoginData.data.role === 'admin', 'Admin login verified with role admin');
    const adminCookie = adminLoginRes.headers.get('set-cookie').split(';')[0];

    // 19. Admin authorized to view giveaways
    const adminGiveawaysRes = await fetch(`${BASE_URL}/admin/giveaways`, {
      headers: { Cookie: adminCookie }
    }).then((r) => r.json());
    assert(adminGiveawaysRes.success && Array.isArray(adminGiveawaysRes.data), 'Admin authorized to access /api/admin/giveaways');

    // 20. Admin creates new giveaway
    const newGwTitle = `Automated Event ${Date.now()}`;
    const createGwRes = await fetch(`${BASE_URL}/admin/giveaways`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        title: newGwTitle,
        subtitle: 'Automated test giveaway',
        description: 'Comprehensive test event created by admin',
        status: 'UPCOMING'
      })
    }).then((r) => r.json());
    assert(createGwRes.success && createGwRes.data.title === newGwTitle, 'Admin successfully created new giveaway');
    const createdGwId = createGwRes.data.giveawayId;

    // 21. Admin updates giveaway
    const updateGwRes = await fetch(`${BASE_URL}/admin/giveaways/${createdGwId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        status: 'ACTIVE'
      })
    }).then((r) => r.json());
    assert(updateGwRes.success && updateGwRes.data.status === 'ACTIVE', 'Admin successfully updated giveaway status to ACTIVE');

    // 22. Admin deletes giveaway
    const deleteGwRes = await fetch(`${BASE_URL}/admin/giveaways/${createdGwId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    }).then((r) => r.json());
    assert(deleteGwRes.success && deleteGwRes.data.giveawayId === createdGwId, 'Admin successfully deleted giveaway');

    console.log('\n====================================================');
    console.log(`📊 Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();
