import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { generateAccessToken, generateRefreshToken, hashRefreshToken, compareRefreshToken } from '../utils/token.js';

// Cookie options for access and refresh tokens
const getAccessCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000 // 15 minutes
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Issue new access & refresh tokens, store hashed refresh token, set cookies
const issueTokens = async (res, user) => {
  const payload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const hashedRefresh = await hashRefreshToken(refreshToken);
  await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashedRefresh });
  res.cookie('access_token', accessToken, getAccessCookieOptions());
  res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());
  return { accessToken, refreshToken };
};

/** Register a new user **/
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_NAME', message: 'Please provide a valid full name.' } });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' } });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' } });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists.' } });
    }
    // Generate unique userId
    let generatedUserId = '';
    let isUnique = false;
    while (!isUnique) {
      generatedUserId = `VE${Math.floor(10000 + Math.random() * 90000)}`;
      const found = await User.findOne({ userId: generatedUserId });
      if (!found) isUnique = true;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      userId: generatedUserId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      balances: { VEs: 500, SVEs: 500, tokens: 2000 },
      deviceHash: `dev_fp_${generatedUserId.toLowerCase()}`
    });
    const tokens = await issueTokens(res, newUser);
    await AuditLog.create({ userId: newUser.userId, action: 'USER_REGISTERED', result: 'SUCCESS', metadata: { email: newUser.email } });
    res.status(201).json({
      success: true,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      message: 'Account created successfully! Welcome to VELOOP Rewards.',
      data: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        balances: newUser.balances,
        deviceHash: newUser.deviceHash
      }
    });
  } catch (error) {
    next(error);
  }
};

/** Login existing user **/
export const login = async (req, res, next) => {
  try {
    const { userId, email, password } = req.body;
    const isDemoMode = process.env.DEMO_MODE !== 'false';

    let query = {};
    if (userId) {
      query.userId = userId.trim();
    } else if (email) {
      query.email = email.toLowerCase().trim();
    } else {
      if (!isDemoMode) {
        return res.status(400).json({
          success: false,
          error: { code: 'CREDENTIALS_REQUIRED', message: 'Email address or User ID is required to sign in.' }
        });
      }
      query.userId = 'VE10025'; // non-production demo fallback
    }

    // Strict Password Validation:
    // In production or when demo mode is inactive, password is unconditionally required for every account.
    // In demo mode (staging/dev only), passwordless login is allowed for instant persona switching.
    if (!isDemoMode && !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'PASSWORD_REQUIRED', message: 'Password is required to sign in.' }
      });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Account not found with the provided credentials.' }
      });
    }

    if (password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password.' }
        });
      }
    }

    const tokens = await issueTokens(res, user);
    res.json({
      success: true,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        balances: user.role === 'admin' ? null : user.balances,
        deviceHash: user.deviceHash
      }
    });
  } catch (error) {
    next(error);
  }
};

/** Logout current session **/
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('access_token', getAccessCookieOptions());
    res.clearCookie('refresh_token', getRefreshCookieOptions());
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });
    }
    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (error) {
    next(error);
  }
};

/** Return current authenticated user **/
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'No authenticated session found' } });
    }
    res.json({
      success: true,
      data: {
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        balances: req.user.role === 'admin' ? null : req.user.balances,
        deviceHash: req.user.deviceHash
      }
    });
  } catch (error) {
    next(error);
  }
};

/** Refresh access token using stored refresh token **/
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token missing.' } });
    }
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'veloop_refresh_secret_2026');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }
    const match = await compareRefreshToken(token, user.refreshTokenHash);
    if (!match) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_REFRESH', message: 'Refresh token mismatch.' } });
    }
    const tokens = await issueTokens(res, user);
    res.json({ success: true, token: tokens.accessToken, accessToken: tokens.accessToken, message: 'Token refreshed.' });
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_REFRESH', message: 'Refresh token invalid or expired.' } });
  }
};

/** Demo users list (non-production and demo mode only) **/
export const getDemoUsers = async (req, res, next) => {
  try {
    if (process.env.DEMO_MODE === 'false') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_IN_PRODUCTION', message: 'Demo persona list is disabled in production or when demo mode is inactive.' }
      });
    }
    const users = await User.find().select('-password -refreshTokenHash').sort({ userId: 1 });
    res.json({ success: true, data: users });
  } catch (e) {
    next(e);
  }
};

/** Earn balance (protected) – real balance update **/
export const earnBalance = async (req, res, next) => {
  try {
    const { currency = 'VE', amount = 100, activity = 'Activity Reward' } = req.body;
    const earnAmount = Math.max(1, Math.min(Number(amount) || 100, 1000)); // Cap between 1 and 1000 per claim

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'You must be logged in to earn balances.' }
      });
    }

    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'ADMIN_NO_COINS', message: 'Admins do not hold personal coin balances.' }
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account not found.' }
      });
    }

    if (!user.balances) {
      user.balances = { VEs: 0, SVEs: 0, tokens: 0 };
    }

    // Map currency key accurately
    if (currency === 'VE' || currency === 'VEs') {
      user.balances.VEs = (user.balances.VEs || 0) + earnAmount;
    } else if (currency === 'SVE' || currency === 'SVEs') {
      user.balances.SVEs = (user.balances.SVEs || 0) + earnAmount;
    } else if (currency === 'TOKEN' || currency === 'tokens') {
      user.balances.tokens = (user.balances.tokens || 0) + earnAmount;
    } else {
      user.balances.VEs = (user.balances.VEs || 0) + earnAmount;
    }

    await user.save();

    await AuditLog.create({
      userId: user.userId,
      action: 'BALANCE_UPDATE',
      result: 'SUCCESS',
      amount: earnAmount,
      currency,
      metadata: { activity }
    });

    res.json({
      success: true,
      message: `Successfully earned +${earnAmount} ${currency}s via ${activity}!`,
      data: {
        balances: user.balances,
        earnedAmount: earnAmount,
        currency
      }
    });
  } catch (error) {
    next(error);
  }
};
