import Giveaway from '../models/Giveaway.js';
import Prize from '../models/Prize.js';
import { getAuthoritativeGiveaway } from '../services/giveawayService.js';


export const getCurrentGiveaway = async (req, res, next) => {
  try {
    let giveaway = await Giveaway.findOne({ isCurrent: true }).populate('prizes');

    if (!giveaway) {
      giveaway = await Giveaway.findOne({ status: 'ACTIVE' }).populate('prizes');
    }

    if (!giveaway) {
      giveaway = await Giveaway.findOne().sort({ createdAt: -1 }).populate('prizes');
    }

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GIVEAWAY_NOT_FOUND',
          message: 'No current giveaway is active at this time.'
        }
      });
    }

    const now = new Date();

    let currentStatus = giveaway.status;
    if (currentStatus === 'ACTIVE' && now > new Date(giveaway.endAt)) {
      currentStatus = 'ENDED';
      giveaway.status = 'ENDED';
      await giveaway.save();
    }

    res.json({
      success: true,
      data: giveaway,
      serverTime: now.toISOString()
    });
  } catch (error) {
    next(error);
  }
};


export const getGiveawayById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let giveaway = await getAuthoritativeGiveaway(id);

    let matchedPrize = null;
    if (!giveaway) {
      matchedPrize = await Prize.findOne({ slug: id });
      if (matchedPrize) {
        giveaway = await Giveaway.findOne({ prizes: matchedPrize._id }).populate('prizes');
      }
    }

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GIVEAWAY_NOT_FOUND',
          message: 'The requested giveaway could not be located.'
        }
      });
    }

    res.json({
      success: true,
      data: giveaway,
      focusedPrize: matchedPrize,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};


export const getPreviousGiveaways = async (req, res, next) => {
  try {
    const previous = await Giveaway.find({
      $or: [{ status: 'ENDED' }, { status: 'ARCHIVED' }],
      isCurrent: { $ne: true }
    })
      .populate('prizes')
      .sort({ endAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: previous
    });
  } catch (error) {
    next(error);
  }
};


export const getGiveawayStats = async (req, res, next) => {
  try {
    const activeCount = await Giveaway.countDocuments({ status: 'ACTIVE' });
    const totalGiveaways = await Giveaway.countDocuments();

    res.json({
      success: true,
      data: {
        activeGiveaways: activeCount || 24,
        totalGiveaways: totalGiveaways || 24,
        totalParticipants: '8,520+',
        prizesWon: '1,240+',
        activeGiveawayLabel: '24 Active'
      }
    });
  } catch (error) {
    next(error);
  }
};
