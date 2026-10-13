import User from '../models/User.js';

export const verifyAndDeductBalance = async ({ userId, currency, requiredAmount }) => {
  // Map currency enum to User schema field
  let balanceField = 'balances.VEs';
  if (currency === 'VE') balanceField = 'balances.VEs';
  else if (currency === 'SVE') balanceField = 'balances.SVEs';
  else if (currency === 'TOKEN') balanceField = 'balances.tokens';

  // 1. Fetch current balance before mutation
  const userBefore = await User.findOne({ userId });
  if (!userBefore) {
    throw new Error('USER_NOT_FOUND');
  }

  const currentBalance =
    currency === 'VE'
      ? userBefore.balances.VEs
      : currency === 'SVE'
      ? userBefore.balances.SVEs
      : userBefore.balances.tokens;

  if (currentBalance < requiredAmount) {
    const error = new Error(`INSUFFICIENT_${currency}_BALANCE`);
    error.currentBalance = currentBalance;
    error.requiredAmount = requiredAmount;
    error.deficit = requiredAmount - currentBalance;
    throw error;
  }

  // 2. Atomic atomic deduction with condition that balance is >= requiredAmount
  // Guarantees race-condition prevention across simultaneous concurrent requests
  const updatedUser = await User.findOneAndUpdate(
    {
      userId,
      [balanceField]: { $gte: requiredAmount }
    },
    {
      $inc: { [balanceField]: -requiredAmount }
    },
    {
      new: true
    }
  );

  if (!updatedUser) {
    // If update failed, it was a race condition where balance dropped below requiredAmount
    const error = new Error(`INSUFFICIENT_${currency}_BALANCE`);
    throw error;
  }

  const balanceAfter =
    currency === 'VE'
      ? updatedUser.balances.VEs
      : currency === 'SVE'
      ? updatedUser.balances.SVEs
      : updatedUser.balances.tokens;

  return {
    success: true,
    balanceBefore: currentBalance,
    balanceAfter
  };
};

export const refundBalance = async ({ userId, currency, amount }) => {
  let balanceField = 'balances.VEs';
  if (currency === 'VE') balanceField = 'balances.VEs';
  else if (currency === 'SVE') balanceField = 'balances.SVEs';
  else if (currency === 'TOKEN') balanceField = 'balances.tokens';

  await User.findOneAndUpdate(
    { userId },
    { $inc: { [balanceField]: amount } }
  );
};
