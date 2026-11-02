import GiveawayParticipation from '../models/GiveawayParticipation.js';
import GiveawayWinner from '../models/GiveawayWinner.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Admin endpoint to list participants across all giveaways.
 * Supports pagination via `page` and `limit` query params.
 */
export const adminGetParticipants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const participants = await GiveawayParticipation.find()
      .populate('userId', '-password -refreshTokenHash')
      .populate('giveawayId')
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await GiveawayParticipation.countDocuments();

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'ADMIN_GET_PARTICIPANTS',
      result: 'SUCCESS',
      metadata: { page, limit, total }
    });

    res.json({
      success: true,
      data: { participants, pagination: { page, limit, total } }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin endpoint to list winners across all giveaways.
 * Supports pagination via `page` and `limit` query params.
 */
export const adminGetWinners = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const winners = await GiveawayWinner.find()
      .populate('userId', '-password -refreshTokenHash')
      .populate('giveawayId')
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await GiveawayWinner.countDocuments();

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'ADMIN_GET_WINNERS',
      result: 'SUCCESS',
      metadata: { page, limit, total }
    });

    res.json({
      success: true,
      data: { winners, pagination: { page, limit, total } }
    });
  } catch (err) {
    next(err);
  }
};
