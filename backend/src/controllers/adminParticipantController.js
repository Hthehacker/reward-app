import GiveawayParticipation from '../models/GiveawayParticipation.js';
import GiveawayWinner from '../models/GiveawayWinner.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Admin endpoint to list participants across all giveaways.
 * Supports pagination via `page` and `limit` query params.
 */
export const adminGetParticipants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [participants, total] = await Promise.all([
      GiveawayParticipation.find()
        .populate('userRef', 'name email userId balances')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GiveawayParticipation.countDocuments()
    ]);

    // Enhance participants with userName if populated or from User collection
    const unpopulatedIds = [
      ...new Set(participants.filter((p) => !p.userRef?.name).map((p) => p.userId))
    ];
    const fallbackUsers =
      unpopulatedIds.length > 0
        ? await User.find({ userId: { $in: unpopulatedIds } })
            .select('userId name email')
            .lean()
        : [];
    const userMap = fallbackUsers.reduce((acc, u) => {
      acc[u.userId] = u;
      return acc;
    }, {});

    const enriched = participants.map((p) => ({
      ...p,
      userName: p.userRef?.name || userMap[p.userId]?.name || p.userId,
      userEmail: p.userRef?.email || userMap[p.userId]?.email || ''
    }));

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'ADMIN_GET_PARTICIPANTS',
      result: 'SUCCESS',
      metadata: { page, limit, total }
    });

    res.json({
      success: true,
      data: { participants: enriched, pagination: { page, limit, total } }
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
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [winners, total] = await Promise.all([
      GiveawayWinner.find()
        .sort({ selectedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GiveawayWinner.countDocuments()
    ]);

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
