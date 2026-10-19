import GiveawayWinner from '../models/GiveawayWinner.js';
import Giveaway from '../models/Giveaway.js';

export const getGiveawayWinners = async (req, res, next) => {
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

    // Critical Requirement #21:
    // If the current giveaway is active, communicate that winners are not yet finalized!
    // Never falsely display winners for an active giveaway.
    if (giveaway.status === 'ACTIVE' || giveaway.status === 'UPCOMING') {
      return res.json({
        success: true,
        data: {
          isLive: true,
          status: giveaway.status,
          giveawayTitle: giveaway.title,
          message: 'Giveaway is still live. Winners will be announced after the giveaway ends.',
          winnerAnnouncement: 'Coming after the giveaway ends',
          winners: []
        }
      });
    }

    // If ENDED, return winners
    const winners = await GiveawayWinner.find({
      giveawayId: giveaway.giveawayId
    }).sort({ selectedAt: -1 });

    res.json({
      success: true,
      data: {
        isLive: false,
        status: giveaway.status,
        giveawayTitle: giveaway.title,
        winners
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPreviousWinners = async (req, res, next) => {
  try {
    // Get winners belonging to completed/archived giveaways
    const previousGiveaways = await Giveaway.find({
      $or: [{ status: 'ENDED' }, { status: 'ARCHIVED' }],
      isCurrent: { $ne: true }
    });

    const previousGiveawayIds = previousGiveaways.map((g) => g.giveawayId);

    const winners = await GiveawayWinner.find({
      giveawayId: { $in: previousGiveawayIds }
    }).sort({ selectedAt: -1 });

    // Format for display with giveaway name
    const giveawayMap = {};
    previousGiveaways.forEach((g) => {
      giveawayMap[g.giveawayId] = g.title;
    });

    const formattedWinners = winners.map((w) => ({
      _id: w._id,
      giveawayId: w.giveawayId,
      giveawayName: giveawayMap[w.giveawayId] || 'Previous Giveaway',
      userId: w.maskedId, // Masked for privacy
      userName: w.userName,
      prizeName: w.prizeName,
      prizeType: w.prizeType,
      selectedAt: w.selectedAt,
      status: w.status
    }));

    res.json({
      success: true,
      data: formattedWinners
    });
  } catch (error) {
    next(error);
  }
};

export const getWinnerTicker = async (req, res, next) => {
  try {
    const recentWinners = await GiveawayWinner.find()
      .sort({ selectedAt: -1 })
      .limit(10);

    const announcements = recentWinners.map((w) => ({
      id: w._id,
      text: `User ${w.maskedId} won ${w.prizeName}!`,
      prizeName: w.prizeName,
      user: w.maskedId,
      time: w.selectedAt
    }));

    // Fallback social proof messages if database is fresh
    if (announcements.length === 0) {
      announcements.push(
        { id: '1', text: 'User VE****21 won an iPhone 15 Pro!' },
        { id: '2', text: 'Another lucky participant won an Apple Watch Series 9!' },
        { id: '3', text: 'Participant VE****54 won AirPods Pro!' },
        { id: '4', text: 'User VE****92 won an Amazon ₹2,000 Voucher!' }
      );
    }

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};
