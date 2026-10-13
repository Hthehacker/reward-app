import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Support simulated/dev header for rapid testing if token isn't provided
    const devUserId = req.headers['x-user-id'];

    if (!token && devUserId) {
      const user = await User.findOne({ userId: devUserId });
      if (user) {
        req.user = user;
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_REQUIRED',
          message: 'Please login or create an account to participate in this giveaway.'
        }
      });
    }

    const secret = process.env.JWT_SECRET || 'veloop_super_secure_jwt_secret_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User authentication could not be verified.'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication session. Please sign in again.'
      }
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    const devUserId = req.headers['x-user-id'];

    if (token) {
      const secret = process.env.JWT_SECRET || 'veloop_super_secure_jwt_secret_2026';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } else if (devUserId) {
      const user = await User.findOne({ userId: devUserId });
      if (user) req.user = user;
    }
  } catch (e) {
    // Continue unauthenticated
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access restricted to authorized administrators only.'
    }
  });
};
