import Giveaway from '../models/Giveaway.js';
import Prize from '../models/Prize.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import GiveawayWinner from '../models/GiveawayWinner.js';
import AuditLog from '../models/AuditLog.js';
import FraudEvent from '../models/FraudEvent.js';
import { selectWinnersForGiveaway } from '../services/winnerService.js';
import { seedDatabase } from '../utils/seedData.js';

export const getAllAdminGiveaways = async (req, res, next) => {
  try {
    const giveaways = await Giveaway.find().populate('prizes').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: giveaways
    });
  } catch (error) {
    next(error);
  }
};

export const createGiveaway = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      subtitle,
      description,
      status = 'UPCOMING',
      startAt,
      endAt,
      prizes = [],
      rules = [],
      eligibility = [],
      isCurrent = false
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Title and description are required.' }
      });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const generatedId = `GW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const startDate = startAt ? new Date(startAt) : new Date();
    const endDate = endAt ? new Date(endAt) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // If marked current, unmark others
    if (isCurrent) {
      await Giveaway.updateMany({}, { isCurrent: false });
    }

    const newGiveaway = await Giveaway.create({
      giveawayId: generatedId,
      title,
      slug: generatedSlug,
      subtitle: subtitle || 'Complete eligible activities and get a chance to win exciting rewards.',
      description,
      status,
      isCurrent,
      startAt: startDate,
      endAt: endDate,
      prizes,
      rules: rules.length > 0 ? rules : [
        { title: 'Eligibility', description: 'Open to registered members in good standing.' },
        { title: 'Fair Selection', description: 'Winners are determined provably fair.' }
      ],
      eligibility: eligibility.length > 0 ? eligibility : ['Registered account in good standing', 'Sufficient virtual balance']
    });

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'GIVEAWAY_CREATED',
      giveawayId: newGiveaway.giveawayId,
      result: 'SUCCESS',
      metadata: { title }
    });

    res.status(201).json({
      success: true,
      message: 'Giveaway created successfully.',
      data: newGiveaway
    });
  } catch (error) {
    next(error);
  }
};

export const updateGiveaway = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const giveaway = await Giveaway.findOne({
      $or: [{ giveawayId: id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: { code: 'GIVEAWAY_NOT_FOUND', message: 'Giveaway not found' }
      });
    }

    if (updateData.isCurrent) {
      await Giveaway.updateMany({ _id: { $ne: giveaway._id } }, { isCurrent: false });
    }

    if (updateData.startAt) updateData.startAt = new Date(updateData.startAt);
    if (updateData.endAt) updateData.endAt = new Date(updateData.endAt);

    Object.assign(giveaway, updateData);
    await giveaway.save();

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'GIVEAWAY_UPDATED',
      giveawayId: giveaway.giveawayId,
      result: 'SUCCESS',
      metadata: { updatedFields: Object.keys(updateData) }
    });

    res.json({
      success: true,
      message: 'Giveaway updated successfully.',
      data: giveaway
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGiveaway = async (req, res, next) => {
  try {
    const { id } = req.params;

    const giveaway = await Giveaway.findOne({
      $or: [{ giveawayId: id }, { slug: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: { code: 'GIVEAWAY_NOT_FOUND', message: 'Giveaway not found' }
      });
    }

    const removedId = giveaway.giveawayId;
    await Giveaway.deleteOne({ _id: giveaway._id });

    await AuditLog.create({
      userId: req.user ? req.user.userId : 'ADMIN',
      action: 'GIVEAWAY_DELETED',
      giveawayId: removedId,
      result: 'SUCCESS'
    });

    res.json({
      success: true,
      message: 'Giveaway deleted successfully.',
      data: { giveawayId: removedId }
    });
  } catch (error) {
    next(error);
  }
};


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
