import express from 'express';
import { login, getMe, getDemoUsers, earnBalance } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/login', authRateLimiter, login);
router.get('/me', protect, getMe);
router.get('/demo-users', getDemoUsers);
router.post('/earn-balance', protect, earnBalance);

export default router;
