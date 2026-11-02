import express from 'express';
import { register, login, logout, getMe, getDemoUsers, earnBalance, refresh } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/demo-users', getDemoUsers);
router.post('/earn-balance', protect, earnBalance);
router.post('/refresh', refresh);

export default router;
