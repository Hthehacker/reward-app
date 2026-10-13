import express from 'express';
import {
  joinGiveaway,
  getMyParticipationStatus
} from '../controllers/participationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { joinRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/:id/join', protect, joinRateLimiter, joinGiveaway);
router.get('/:id/my-status', protect, getMyParticipationStatus);

export default router;
