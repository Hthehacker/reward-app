import express from 'express';
import {
  getAllAdminGiveaways,
  createGiveaway,
  updateGiveaway,
  deleteGiveaway,
  setGiveawayStatus,
  runWinnerSelection,
  getAuditLogs,
  getFraudEvents,
  resetDemo
} from '../controllers/adminGiveawayController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { adminGetUsers } from '../controllers/adminUserController.js';
import { adminGetParticipants, adminGetWinners } from '../controllers/adminParticipantController.js';
import { adminGetAnalytics } from '../controllers/adminAnalyticsController.js';
import {
  getAllPrizes,
  getPrizeById,
  createPrize,
  updatePrize,
  deletePrize
} from '../controllers/adminPrizeController.js';
import {
  adminGetCoinStats,
  adminGetCoinTransactions,
  adminAdjustCoins
} from '../controllers/adminCoinController.js';

const router = express.Router();

// Enforce strict authentication and administrative authorization for ALL admin endpoints
router.use(protect, adminOnly);

// User Management APIs
router.get('/users', adminGetUsers);

// Coin Management APIs
router.get('/coins/stats', adminGetCoinStats);
router.get('/coins/transactions', adminGetCoinTransactions);
router.post('/coins/adjust', adminAdjustCoins);

// Prize Management APIs
router.get('/prizes', getAllPrizes);
router.get('/prizes/:id', getPrizeById);
router.post('/prizes', createPrize);
router.put('/prizes/:id', updatePrize);
router.delete('/prizes/:id', deletePrize);

router.get('/giveaways', getAllAdminGiveaways);
router.post('/giveaways', createGiveaway);
router.put('/giveaways/:id', updateGiveaway);
router.delete('/giveaways/:id', deleteGiveaway);

router.post('/giveaways/:id/status', setGiveawayStatus);
router.post('/giveaways/:id/select-winners', runWinnerSelection);
router.get('/audit-logs', getAuditLogs);
router.get('/participants', adminGetParticipants);
router.get('/winners', adminGetWinners);
router.get('/analytics', adminGetAnalytics);
router.get('/fraud-events', getFraudEvents);
router.post('/reset-demo', resetDemo);

export default router;
