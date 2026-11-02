import express from 'express';
import { register, login, logout, getMe, getDemoUsers, earnBalance, refresh } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Registration & Sign-Up routes (supports POST /register and POST /signup)
router.post('/register', authRateLimiter, register);
router.post('/signup', authRateLimiter, register);
router.get(['/register', '/signup'], (req, res) => {
  res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Account registration requires a POST request with name, email, and password.'
    }
  });
});

// Login & Sign-In routes (supports POST /login and POST /signin)
router.post('/login', authRateLimiter, login);
router.post('/signin', authRateLimiter, login);
router.get(['/login', '/signin'], (req, res) => {
  res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Sign-in requires a POST request with email or userId and password.'
    }
  });
});

router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/demo-users', getDemoUsers);
router.post('/earn-balance', protect, earnBalance);
router.post('/refresh', refresh);

export default router;
