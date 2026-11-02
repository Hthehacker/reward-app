import User from '../models/User.js';
import CoinTransaction from '../models/CoinTransaction.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Get aggregate coin statistics across all normal community members.
 * (Admin accounts are excluded to prevent skewing user balance metrics)
 */
export const adminGetCoinStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $group: {
          _id: null,
          totalVEs: { $sum: { $ifNull: ['$balances.VEs', 0] } },
          totalSVEs: { $sum: { $ifNull: ['$balances.SVEs', 0] } },
          totalTokens: { $sum: { $ifNull: ['$balances.tokens', 0] } },
          totalUsersWithBalances: { $sum: 1 }
        }
      }
    ]);

    const transactionCount = await CoinTransaction.countDocuments();
    const result = stats[0] || {
      totalVEs: 0,
      totalSVEs: 0,
      totalTokens: 0,
      totalUsersWithBalances: 0
    };

    const totalDistributedCoins =
      (result.totalVEs || 0) + (result.totalSVEs || 0) + (result.totalTokens || 0);

    res.json({
      success: true,
      data: {
        totalVEs: result.totalVEs || 0,
        totalSVEs: result.totalSVEs || 0,
        totalTokens: result.totalTokens || 0,
        totalDistributedCoins,
        totalUsersWithBalances: result.totalUsersWithBalances || 0,
        totalTransactions: transactionCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get coin transaction history with optional pagination and filters.
 */
export const adminGetCoinTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const { userId, type, currency, search } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (type && ['ADD', 'DEDUCT'].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }
    if (currency && ['VE', 'SVE', 'TOKEN'].includes(currency.toUpperCase())) {
      query.currency = currency.toUpperCase();
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ userId: regex }, { adminId: regex }, { reason: regex }, { transactionId: regex }];
    }

    const [transactions, total] = await Promise.all([
      CoinTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CoinTransaction.countDocuments(query)
    ]);

    // Enhance transactions with user names if available
    const userIds = [...new Set(transactions.map((t) => t.userId))];
    const users = await User.find({ userId: { $in: userIds } })
      .select('userId name email')
      .lean();
    const userMap = users.reduce((acc, u) => {
      acc[u.userId] = { name: u.name, email: u.email };
      return acc;
    }, {});

    const enrichedTransactions = transactions.map((t) => ({
      ...t,
      userName: userMap[t.userId]?.name || t.userId,
      userEmail: userMap[t.userId]?.email || ''
    }));

    res.json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: { page, limit, total }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Adjust (Add or Deduct) coins from a user's balance.
 * Requires:
 *   - Authenticated Admin
 *   - Target User must exist and cannot be an admin
 *   - Positive adjustment amount > 0
 *   - Valid currency enum ('VE', 'SVE', 'TOKEN')
 *   - Valid action type ('ADD' or 'DEDUCT')
 *   - Mandatory audit reason
 *   - Strictly prevents negative balances on deduction
 */
export const adminAdjustCoins = async (req, res, next) => {
  try {
    const { userId, currency = 'VE', amount, type, reason } = req.body;
    const adminUser = req.user;

    // 1. Authoritative admin identity verification
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Restricted to authenticated administrators only.' }
      });
    }

    // 2. Validate target user
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_USER_ID', message: 'Target user ID is required.' }
      });
    }

    const targetUser = await User.findOne({ userId: userId.trim() });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: `User with ID "${userId}" not found.` }
      });
    }

    // Admins do not hold personal balances – cannot add/deduct coins for admin accounts
    if (targetUser.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_ADJUST_ADMIN',
          message: 'Administrators do not hold personal coin balances.'
        }
      });
    }

    // 3. Validate currency
    const normalizedCurrency = (currency || 'VE').toUpperCase();
    if (!['VE', 'SVE', 'TOKEN'].includes(normalizedCurrency)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: 'Invalid currency. Supported currencies are VE, SVE, or TOKEN.'
        }
      });
    }

    // Map currency to User balance field
    let balanceField = 'balances.VEs';
    let balanceKey = 'VEs';
    if (normalizedCurrency === 'SVE') {
      balanceField = 'balances.SVEs';
      balanceKey = 'SVEs';
    } else if (normalizedCurrency === 'TOKEN') {
      balanceField = 'balances.tokens';
      balanceKey = 'tokens';
    }

    // 4. Validate amount
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0 || !Number.isFinite(parsedAmount)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Adjustment amount must be a positive number greater than 0.'
        }
      });
    }

    const adjustmentAmount = Math.round(parsedAmount);

    // 5. Validate transaction type
    const normalizedType = (type || '').toUpperCase();
    if (!['ADD', 'DEDUCT'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSACTION_TYPE',
          message: 'Transaction type must be either ADD or DEDUCT.'
        }
      });
    }

    // 6. Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'A clear reason of at least 3 characters is required for auditing purposes.'
        }
      });
    }

    const currentBalance = targetUser.balances?.[balanceKey] || 0;

    // 7. Atomic Execution
    let updatedUser;
    if (normalizedType === 'DEDUCT') {
      // Validate sufficient balance to prevent negative balances
      if (currentBalance < adjustmentAmount) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: `Cannot deduct ${adjustmentAmount} ${normalizedCurrency}s. User currently holds only ${currentBalance} ${normalizedCurrency}s. Negative balances are prohibited.`,
            currentBalance,
            requestedDeduction: adjustmentAmount,
            deficit: adjustmentAmount - currentBalance
          }
        });
      }

      // Atomic conditional update guarantees no negative balance even under high concurrency
      updatedUser = await User.findOneAndUpdate(
        {
          userId: targetUser.userId,
          [balanceField]: { $gte: adjustmentAmount }
        },
        {
          $inc: { [balanceField]: -adjustmentAmount }
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: 'Concurrent update conflict: balance dropped below requested deduction amount.'
          }
        });
      }
    } else {
      // normalizedType === 'ADD'
      updatedUser = await User.findOneAndUpdate(
        { userId: targetUser.userId },
        {
          $inc: { [balanceField]: adjustmentAmount }
        },
        { new: true }
      );
    }

    const balanceAfter = updatedUser.balances[balanceKey];

    // 8. Record Immutable CoinTransaction
    const transactionId = `CTXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transaction = await CoinTransaction.create({
      transactionId,
      adminId: adminUser.userId || 'ADMIN',
      userId: targetUser.userId,
      currency: normalizedCurrency,
      type: normalizedType,
      amount: adjustmentAmount,
      balanceBefore: currentBalance,
      balanceAfter,
      reason: reason.trim()
    });

    // 9. Record System Audit Log
    await AuditLog.create({
      userId: adminUser.userId || 'ADMIN',
      action: 'BALANCE_UPDATE',
      currency: normalizedCurrency,
      amount: adjustmentAmount,
      result: 'SUCCESS',
      metadata: {
        targetUserId: targetUser.userId,
        type: normalizedType,
        balanceBefore: currentBalance,
        balanceAfter,
        reason: reason.trim(),
        transactionId
      }
    });

    res.json({
      success: true,
      message: `Successfully ${normalizedType === 'ADD' ? 'credited +' : 'deducted -'}${adjustmentAmount} ${normalizedCurrency}s for ${targetUser.name}.`,
      data: {
        transaction,
        user: {
          userId: updatedUser.userId,
          name: updatedUser.name,
          email: updatedUser.email,
          balances: updatedUser.balances
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
