import Prize from '../models/Prize.js';
import Giveaway from '../models/Giveaway.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Get all prizes (Admin & optionally public)
 * Supports search and category filter
 */
export const getAllPrizes = async (req, res, next) => {
  try {
    const { search, type, currency } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { prizeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (currency && currency !== 'all') {
      filter.entryCurrency = currency;
    }

    const prizes = await Prize.find(filter).sort({ createdAt: -1 });

    // Also calculate how many giveaways each prize is associated with
    const prizesWithUsage = await Promise.all(
      prizes.map(async (prize) => {
        const giveawayCount = await Giveaway.countDocuments({ prizes: prize._id });
        return {
          ...prize.toObject(),
          assignedGiveawaysCount: giveawayCount
        };
      })
    );

    res.json({
      success: true,
      count: prizesWithUsage.length,
      data: prizesWithUsage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single prize by ID or slug
 */
export const getPrizeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prize = await Prize.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { prizeId: id }, { slug: id }]
    });

    if (!prize) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRIZE_NOT_FOUND', message: 'Prize not found.' }
      });
    }

    const assignedGiveaways = await Giveaway.find({ prizes: prize._id })
      .select('giveawayId title status slug startAt endAt')
      .lean();

    res.json({
      success: true,
      data: {
        ...prize.toObject(),
        assignedGiveaways
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new prize (Admin Only)
 */
export const createPrize = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      position = 'Prize',
      image,
      description,
      fullDescription = '',
      winnerCount = 1,
      type = 'physical',
      entryCurrency = 'VE',
      entryFee = 100,
      approxValue = '',
      claimInstructions = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Prize name is required.' }
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DESCRIPTION', message: 'Prize description is required.' }
      });
    }

    if (!image || !image.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_IMAGE', message: 'Prize image URL or asset path is required.' }
      });
    }

    // Auto-generate prizeId and slug if omitted
    const generatedPrizeId = `PRIZE-${Date.now().toString().slice(-6)}`;
    const baseSlug = (slug && slug.trim()) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Prize.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const newPrize = await Prize.create({
      prizeId: generatedPrizeId,
      name: name.trim(),
      slug: uniqueSlug,
      position: position.trim() || 'Prize',
      image: image.trim(),
      description: description.trim(),
      fullDescription: fullDescription ? fullDescription.trim() : description.trim(),
      winnerCount: Number(winnerCount) > 0 ? Number(winnerCount) : 1,
      type: ['physical', 'gift_card', 'digital'].includes(type) ? type : 'physical',
      entryCurrency: ['VE', 'SVE', 'TOKEN'].includes(entryCurrency) ? entryCurrency : 'VE',
      entryFee: Number(entryFee) >= 0 ? Number(entryFee) : 0,
      approxValue: approxValue ? approxValue.trim() : '',
      claimInstructions: claimInstructions ? claimInstructions.trim() : ''
    });

    await AuditLog.create({
      userId: req.user?.userId || 'ADMIN',
      action: 'PRIZE_CREATED',
      result: 'SUCCESS',
      metadata: { prizeId: newPrize.prizeId, name: newPrize.name }
    });

    res.status(201).json({
      success: true,
      message: 'Prize created successfully.',
      data: newPrize
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing prize (Admin Only)
 */
export const updatePrize = async (req, res, next) => {
  try {
    const { id } = req.params;

    const prize = await Prize.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { prizeId: id }]
    });

    if (!prize) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRIZE_NOT_FOUND', message: 'Prize not found.' }
      });
    }

    const {
      name,
      slug,
      position,
      image,
      description,
      fullDescription,
      winnerCount,
      type,
      entryCurrency,
      entryFee,
      approxValue,
      claimInstructions
    } = req.body;

    if (name !== undefined) prize.name = name.trim();
    if (slug !== undefined && slug.trim() !== prize.slug) {
      const existingSlug = await Prize.findOne({ slug: slug.trim(), _id: { $ne: prize._id } });
      if (existingSlug) {
        return res.status(409).json({
          success: false,
          error: { code: 'SLUG_EXISTS', message: 'This slug is already used by another prize.' }
        });
      }
      prize.slug = slug.trim();
    }
    if (position !== undefined) prize.position = position.trim();
    if (image !== undefined) prize.image = image.trim();
    if (description !== undefined) prize.description = description.trim();
    if (fullDescription !== undefined) prize.fullDescription = fullDescription.trim();
    if (winnerCount !== undefined && Number(winnerCount) > 0) prize.winnerCount = Number(winnerCount);
    if (type !== undefined && ['physical', 'gift_card', 'digital'].includes(type)) prize.type = type;
    if (entryCurrency !== undefined && ['VE', 'SVE', 'TOKEN'].includes(entryCurrency)) prize.entryCurrency = entryCurrency;
    if (entryFee !== undefined && Number(entryFee) >= 0) prize.entryFee = Number(entryFee);
    if (approxValue !== undefined) prize.approxValue = approxValue.trim();
    if (claimInstructions !== undefined) prize.claimInstructions = claimInstructions.trim();

    await prize.save();

    await AuditLog.create({
      userId: req.user?.userId || 'ADMIN',
      action: 'PRIZE_UPDATED',
      result: 'SUCCESS',
      metadata: { prizeId: prize.prizeId, name: prize.name }
    });

    res.json({
      success: true,
      message: 'Prize updated successfully.',
      data: prize
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a prize (Admin Only)
 * Checks if assigned to active or completed giveaways before deletion
 */
export const deletePrize = async (req, res, next) => {
  try {
    const { id } = req.params;

    const prize = await Prize.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { prizeId: id }]
    });

    if (!prize) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRIZE_NOT_FOUND', message: 'Prize not found.' }
      });
    }

    // Safety rule: Check if assigned to any active or completed giveaways
    const activeOrEndedGiveaways = await Giveaway.find({
      prizes: prize._id,
      status: { $in: ['ACTIVE', 'ENDED'] }
    }).select('giveawayId title status');

    if (activeOrEndedGiveaways.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRIZE_IN_USE',
          message: `Cannot delete prize "${prize.name}" because it is currently assigned to ${activeOrEndedGiveaways.length} active or completed giveaway(s) (${activeOrEndedGiveaways.map((g) => g.title).join(', ')}). Remove it from those giveaways or archive them first.`
        }
      });
    }

    // Remove reference from any upcoming/draft giveaways
    await Giveaway.updateMany({ prizes: prize._id }, { $pull: { prizes: prize._id } });

    await Prize.findByIdAndDelete(prize._id);

    await AuditLog.create({
      userId: req.user?.userId || 'ADMIN',
      action: 'PRIZE_DELETED',
      result: 'SUCCESS',
      metadata: { prizeId: prize.prizeId, name: prize.name }
    });

    res.json({
      success: true,
      message: `Prize "${prize.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};
