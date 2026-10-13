import express from 'express';
import {
  getMyClaimStatus,
  submitPrizeClaim
} from '../controllers/claimController.js';
import { protect } from '../middleware/authMiddleware.js';
import { claimRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.get('/:id/my-claim', protect, getMyClaimStatus);
router.post('/:id/claim', protect, claimRateLimiter, submitPrizeClaim);

export default router;
