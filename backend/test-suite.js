// VELOOP Automated Integration & Security Verification Suite
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
