import express from 'express';
import {
  setGiveawayStatus,
  runWinnerSelection,
  getAuditLogs,
  getFraudEvents,
  resetDemo
} from '../controllers/adminGiveawayController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/giveaways/:id/status', optionalAuth, setGiveawayStatus);
router.post('/giveaways/:id/select-winners', optionalAuth, runWinnerSelection);
router.get('/audit-logs', optionalAuth, getAuditLogs);
router.get('/fraud-events', optionalAuth, getFraudEvents);
router.post('/reset-demo', resetDemo);

export default router;
