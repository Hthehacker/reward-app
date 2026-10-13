import express from 'express';
import {
  getGiveawayWinners,
  getPreviousWinners
} from '../controllers/winnerController.js';

const router = express.Router();

router.get('/previous/winners', getPreviousWinners);
router.get('/:id/winners', getGiveawayWinners);

export default router;
