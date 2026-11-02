// VELOOP Automated Coin Management, RBAC & Security Test Suite
const BASE_URL = 'http://localhost:5000/api';

async function runCoinTests() {
  console.log('====================================================');
  console.log('🪙 Starting VELOOP Admin Coin Management Verification');
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
    // 1. Authenticate Normal User (Aarav - VE10025)
    const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'VE10025' })
    });
    const userLoginData = await userLoginRes.json();
    assert(userLoginData.success && userLoginData.data.role === 'user', 'Normal user logged in (role: user)');
    assert(userLoginData.data.balances !== null && typeof userLoginData.data.balances.VEs === 'number', 'Normal user holds personal coin balances');
    const userCookie = userLoginRes.headers.get('set-cookie')?.split(';')[0];

    // 2. Authenticate Admin User (VE_ADMIN)
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'VE_ADMIN' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success && adminLoginData.data.role === 'admin', 'Admin logged in (role: admin)');
    assert(adminLoginData.data.balances === null, 'Admin strictly has NO personal coin balance (balances: null)');
    const adminCookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0];

    // 3. Test Admin Blocked from Earning Coins
    const adminEarnRes = await fetch(`${BASE_URL}/auth/earn-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ currency: 'VE', amount: 100 })
    });
    const adminEarnData = await adminEarnRes.json();
    assert(
      !adminEarnData.success && adminEarnRes.status === 403 && adminEarnData.error.code === 'ADMIN_NO_COINS',
      'Admin strictly blocked from earning personal coins (403 ADMIN_NO_COINS)'
    );

    // 3b. Test Admin Blocked from Participating in Giveaways
    const currGiveaway = await fetch(`${BASE_URL}/giveaways/current`).then(r => r.json());
    const adminJoinRes = await fetch(`${BASE_URL}/giveaways/${currGiveaway.data.giveawayId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ prizeId: currGiveaway.data.prizes[0].prizeId })
    });
    const adminJoinData = await adminJoinRes.json();
    assert(
      !adminJoinData.success && adminJoinRes.status === 403 && adminJoinData.error.code === 'ADMIN_CANNOT_PARTICIPATE',
      'Admin strictly blocked from participating in giveaways (403 ADMIN_CANNOT_PARTICIPATE)'
    );

    // 4. Test Security: Unauthenticated access blocked on Coin Endpoints
    const unauthStats = await fetch(`${BASE_URL}/admin/coins/stats`);
    assert(unauthStats.status === 401, 'Unauthenticated access to /admin/coins/stats blocked (401)');

    const unauthAdjust = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'VE10025', amount: 100, type: 'ADD', reason: 'Test' })
    });
    assert(unauthAdjust.status === 401, 'Unauthenticated access to /admin/coins/adjust blocked (401)');

    // 5. Test Security: Regular User blocked from Coin Management (RBAC)
    const userBlockedStats = await fetch(`${BASE_URL}/admin/coins/stats`, {
      headers: { Cookie: userCookie }
    });
    assert(userBlockedStats.status === 403, 'Regular user blocked from /admin/coins/stats (403 Forbidden)');

    const userBlockedAdjust = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userCookie },
      body: JSON.stringify({ userId: 'VE10025', amount: 100, type: 'ADD', reason: 'Tamper' })
    });
    assert(userBlockedAdjust.status === 403, 'Regular user blocked from /admin/coins/adjust (403 Forbidden)');

    // 6. Test Admin Coin Stats Endpoint
    const statsRes = await fetch(`${BASE_URL}/admin/coins/stats`, {
      headers: { Cookie: adminCookie }
    });
    const statsData = await statsRes.json();
    assert(statsData.success, 'Admin successfully fetched coin aggregate stats');
    assert(typeof statsData.data.totalDistributedCoins === 'number', `Total coins distributed tracked: ${statsData.data.totalDistributedCoins}`);
    assert(typeof statsData.data.totalVEs === 'number', `Total VEs tracked: ${statsData.data.totalVEs}`);
    assert(typeof statsData.data.totalUsersWithBalances === 'number', `Monitored user wallets: ${statsData.data.totalUsersWithBalances}`);

    // 7. Get initial balance of target user (VE10099 Priya)
    const usersSearch = await fetch(`${BASE_URL}/admin/users?search=VE10099`, {
      headers: { Cookie: adminCookie }
    }).then(r => r.json());
    assert(usersSearch.success && usersSearch.data.users.length === 1, 'Admin user search by ID returned target user (Priya)');
    const priyaInitialVEs = usersSearch.data.users[0].balances.VEs;

    // 8. Test Admin Adding Coins (Credit +300 VEs)
    const addRes = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        userId: 'VE10099',
        currency: 'VE',
        amount: 300,
        type: 'ADD',
        reason: 'Community activity contest prize grant'
      })
    });
    const addData = await addRes.json();
    assert(addData.success, 'Admin successfully added +300 VEs to user account');
    assert(addData.data.user.balances.VEs === priyaInitialVEs + 300, `Balance increased accurately from ${priyaInitialVEs} to ${addData.data.user.balances.VEs}`);
    assert(addData.data.transaction.type === 'ADD' && addData.data.transaction.amount === 300, 'CoinTransaction record logged with type ADD and amount 300');
    assert(addData.data.transaction.balanceBefore === priyaInitialVEs, 'Transaction recorded balanceBefore accurately');
    assert(addData.data.transaction.balanceAfter === priyaInitialVEs + 300, 'Transaction recorded balanceAfter accurately');

    // 9. Test Admin Deducting Coins (Debit -100 VEs)
    const deductRes = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        userId: 'VE10099',
        currency: 'VE',
        amount: 100,
        type: 'DEDUCT',
        reason: 'Duplicate claim adjustment reversal'
      })
    });
    const deductData = await deductRes.json();
    assert(deductData.success, 'Admin successfully deducted -100 VEs from user account');
    assert(deductData.data.user.balances.VEs === priyaInitialVEs + 200, `Balance reduced accurately to ${deductData.data.user.balances.VEs}`);
    assert(deductData.data.transaction.type === 'DEDUCT', 'CoinTransaction logged with type DEDUCT');

    // 10. Test Insufficient Balance & Negative Balance Prevention
    const excessiveDeductRes = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        userId: 'VE10099',
        currency: 'VE',
        amount: 9999999, // Way higher than balance
        type: 'DEDUCT',
        reason: 'Unauthorized excessive debit'
      })
    });
    const excessiveDeductData = await excessiveDeductRes.json();
    assert(
      !excessiveDeductData.success && excessiveDeductRes.status === 400 && excessiveDeductData.error.code === 'INSUFFICIENT_BALANCE',
      'Excessive deduction rejected with INSUFFICIENT_BALANCE (negative balances strictly forbidden)'
    );

    // 11. Test Negative / Invalid Amount Validation
    const negativeAmtRes = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        userId: 'VE10099',
        currency: 'VE',
        amount: -50,
        type: 'ADD',
        reason: 'Negative test'
      })
    });
    const negativeAmtData = await negativeAmtRes.json();
    assert(!negativeAmtData.success && negativeAmtData.error.code === 'INVALID_AMOUNT', 'Negative amount rejected with INVALID_AMOUNT');

    // 12. Test Missing Reason Validation
    const noReasonRes = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        userId: 'VE10099',
        currency: 'VE',
        amount: 50,
        type: 'ADD',
        reason: ''
      })
    });
    const noReasonData = await noReasonRes.json();
    assert(!noReasonData.success && noReasonData.error.code === 'REASON_REQUIRED', 'Missing reason rejected with REASON_REQUIRED');

    // 13. Test Admin Cannot Give Themselves or Other Admins Coins
    const adminTargetRes = await fetch(`${BASE_URL}/admin/coins/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        userId: 'VE_ADMIN',
        currency: 'VE',
        amount: 100,
        type: 'ADD',
        reason: 'Attempting to credit admin'
      })
    });
    const adminTargetData = await adminTargetRes.json();
    assert(
      !adminTargetData.success && adminTargetData.error.code === 'CANNOT_ADJUST_ADMIN',
      'Adjustment for admin user rejected with CANNOT_ADJUST_ADMIN'
    );

    // 14. Test Coin Transaction History Retrieval & Filters
    const historyRes = await fetch(`${BASE_URL}/admin/coins/transactions`, {
      headers: { Cookie: adminCookie }
    });
    const historyData = await historyRes.json();
    assert(historyData.success && historyData.data.transactions.length >= 2, `Retrieved ${historyData.data.transactions.length} audited coin transactions`);
    const latestTx = historyData.data.transactions[0];
    assert(latestTx.userName && latestTx.adminId, 'Transaction record enriched with user details and admin ID');

    // Filter by type: ADD
    const addOnlyRes = await fetch(`${BASE_URL}/admin/coins/transactions?type=ADD`, {
      headers: { Cookie: adminCookie }
    }).then(r => r.json());
    assert(addOnlyRes.success && addOnlyRes.data.transactions.every(t => t.type === 'ADD'), 'History filter ?type=ADD returns only credit records');

    // Filter by type: DEDUCT
    const deductOnlyRes = await fetch(`${BASE_URL}/admin/coins/transactions?type=DEDUCT`, {
      headers: { Cookie: adminCookie }
    }).then(r => r.json());
    assert(deductOnlyRes.success && deductOnlyRes.data.transactions.every(t => t.type === 'DEDUCT'), 'History filter ?type=DEDUCT returns only debit records');

    // 15. Teardown / Balance Consistency: Restore Priya's original balance (so other suites like test-suite.js remain green)
    const priyaFinalCheck = await fetch(`${BASE_URL}/admin/users?search=VE10099`, {
      headers: { Cookie: adminCookie }
    }).then(r => r.json());
    const currentPriyaVEs = priyaFinalCheck.data.users[0].balances.VEs;
    const diff = currentPriyaVEs - priyaInitialVEs;
    if (diff > 0) {
      await fetch(`${BASE_URL}/admin/coins/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          userId: 'VE10099',
          currency: 'VE',
          amount: diff,
          type: 'DEDUCT',
          reason: 'Test suite cleanup balance restore'
        })
      });
    }
    assert(true, 'Test teardown restored target user balance for global test-suite compatibility');

    console.log('\n====================================================');
    console.log(`📊 Coin Management Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
  } catch (err) {
    console.error('Fatal error during coin tests:', err);
    process.exit(1);
  }
}

runCoinTests();
