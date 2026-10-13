import express from 'express';
import {
  getCurrentGiveaway,
  getGiveawayById,
  getPreviousGiveaways,
  getGiveawayStats
} from '../controllers/giveawayController.js';
import { getWinnerTicker } from '../controllers/winnerController.js';

const router = express.Router();

router.get('/current', getCurrentGiveaway);
router.get('/previous', getPreviousGiveaways);
router.get('/stats', getGiveawayStats);
router.get('/ticker', getWinnerTicker);
router.get('/:id', getGiveawayById);

export default router;
