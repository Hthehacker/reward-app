import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect middleware – ensures a valid access token is present.
 * Checks (in order):
 *   1. httpOnly cookie named `access_token`
 *   2. legacy cookie `token` (for backward compatibility)
 *   3. Authorization: Bearer header
 *   4. dev header `x-user-id` (non‑prod only, no admin escalation)
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check httpOnly access token cookie
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.cookies && req.cookies.token) {
      // fallback to legacy cookie name
      token = req.cookies.token;
    }

    // 2. Fallback to Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 3. Dev header for automated tests (non‑prod only, cannot give admin rights)
    const devUserId = req.headers['x-user-id'];
    if (!token && devUserId && process.env.NODE_ENV !== 'production') {
      const user = await User.findOne({ userId: devUserId });
      if (user && user.role !== 'admin') {
        req.user = user;
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'LOGIN_REQUIRED', message: 'Please login or create an account to participate in this giveaway.' }
      });
    }

    const secret = process.env.JWT_SECRET || 'veloop_super_secure_jwt_secret_2026';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User authentication could not be verified.' }
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired authentication session. Please sign in again.' }
    });
  }
};

/** Optional auth – attaches user if a valid token is present, otherwise proceeds unauthenticated */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    const devUserId = req.headers['x-user-id'];
    if (token) {
      const secret = process.env.JWT_SECRET || 'veloop_super_secure_jwt_secret_2026';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } else if (devUserId && process.env.NODE_ENV !== 'production') {
      const user = await User.findOne({ userId: devUserId });
      if (user && user.role !== 'admin') req.user = user;
    }
  } catch (e) {
    // ignore errors – remain unauthenticated
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message: 'Access restricted to authorized administrators only.' }
  });
};
