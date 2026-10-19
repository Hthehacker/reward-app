import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'veloop_super_secure_jwt_secret_2026';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

export const login = async (req, res, next) => {
  try {
    const { userId, email } = req.body;

    let query = {};
    if (userId) query.userId = userId;
    else if (email) query.email = email.toLowerCase();
    else {
      // Default to primary demo user
      query.userId = 'VE10025';
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        balances: user.balances,
        deviceHash: user.deviceHash,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'No authenticated session found' }
      });
    }

    res.json({
      success: true,
      data: {
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        balances: req.user.balances,
        deviceHash: req.user.deviceHash
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDemoUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ userId: 1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};


export const earnBalance = async (req, res, next) => {
  try {
    const user = req.user;
    const { currency = 'VE', amount = 150, activity = 'Daily Login Bonus' } = req.body;

    let balanceField = 'balances.VEs';
    if (currency === 'SVE') balanceField = 'balances.SVEs';
    if (currency === 'TOKEN') balanceField = 'balances.tokens';

    const updatedUser = await User.findOneAndUpdate(
      { userId: user.userId },
      { $inc: { [balanceField]: amount } },
      { new: true }
    );

    await AuditLog.create({
      userId: user.userId,
      action: 'BALANCE_UPDATE',
      amount,
      currency,
      result: 'SUCCESS',
      metadata: { reason: activity }
    });

    res.json({
      success: true,
      message: `Successfully earned ${amount} ${currency}s via ${activity}!`,
      data: {
        balances: updatedUser.balances
      }
    });
  } catch (error) {
    next(error);
  }
};
