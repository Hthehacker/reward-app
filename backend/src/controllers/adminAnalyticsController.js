import User from '../models/User.js';
import Giveaway from '../models/Giveaway.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import GiveawayWinner from '../models/GiveawayWinner.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Simple analytics endpoint for admin dashboard.
 * Returns counts of core entities and recent activity.
 */
export const adminGetAnalytics = async (req, res, next) => {
  try {
    const [userCount, giveawayCount, participantCount, winnerCount] = await Promise.all([
      User.countDocuments(),
      Giveaway.countDocuments(),
      GiveawayParticipation.countDocuments(),
      GiveawayWinner.countDocuments()
    ]);

    // Recent audit logs (last 5)
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'ADMIN_GET_ANALYTICS',
      result: 'SUCCESS',
      metadata: { userCount, giveawayCount, participantCount, winnerCount }
    });

    res.json({
      success: true,
      data: {
        userCount,
        giveawayCount,
        participantCount,
        winnerCount,
        recentLogs
      }
    });
  } catch (err) {
    next(err);
  }
};
