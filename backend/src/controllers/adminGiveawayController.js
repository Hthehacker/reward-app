import Giveaway from '../models/Giveaway.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import GiveawayWinner from '../models/GiveawayWinner.js';
import AuditLog from '../models/AuditLog.js';
import FraudEvent from '../models/FraudEvent.js';
import { selectWinnersForGiveaway } from '../services/winnerService.js';
import { seedDatabase } from '../utils/seedData.js';

// POST /api/admin/giveaways/:id/status
export const setGiveawayStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE', 'ENDED', 'UPCOMING', 'ARCHIVED'

    if (!['ACTIVE', 'ENDED', 'UPCOMING', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid status specified.' }
      });
    }

    const giveaway = await Giveaway.findOne({
      $or: [{ giveawayId: id }, { slug: id }]
    });

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: { code: 'GIVEAWAY_NOT_FOUND', message: 'Giveaway not found' }
      });
    }

    giveaway.status = status;

    // Adjust dates for visual consistency
    const now = new Date();
    if (status === 'ACTIVE') {
      giveaway.startAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      giveaway.endAt = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000 + 8 * 3600 * 1000 + 45 * 60 * 1000);
    } else if (status === 'ENDED') {
      giveaway.endAt = new Date(now.getTime() - 1000);
    } else if (status === 'UPCOMING') {
      giveaway.startAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      giveaway.endAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    }

    await giveaway.save();

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'GIVEAWAY_STATUS_CHANGED',
      giveawayId: giveaway.giveawayId,
      result: 'SUCCESS',
      metadata: { newStatus: status }
    });

    res.json({
      success: true,
      message: `Giveaway status updated to ${status}`,
      data: giveaway
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/giveaways/:id/select-winners
export const runWinnerSelection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const giveaway = await Giveaway.findOne({
      $or: [{ giveawayId: id }, { slug: id }]
    });

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: { code: 'GIVEAWAY_NOT_FOUND', message: 'Giveaway not found' }
      });
    }

    const winners = await selectWinnersForGiveaway(giveaway.giveawayId);

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'WINNER_SELECTED',
      giveawayId: giveaway.giveawayId,
      result: 'SUCCESS',
      metadata: { count: winners.length }
    });

    res.json({
      success: true,
      message: `Successfully finalized ${winners.length} winners for ${giveaway.title}!`,
      data: winners
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/fraud-events
export const getFraudEvents = async (req, res, next) => {
  try {
    const events = await FraudEvent.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/reset-demo
export const resetDemo = async (req, res, next) => {
  try {
    await seedDatabase();
    res.json({
      success: true,
      message: 'Database reset and re-seeded with demo data successfully.'
    });
  } catch (error) {
    next(error);
  }
};
