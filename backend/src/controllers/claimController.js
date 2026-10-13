import GiveawayWinner from '../models/GiveawayWinner.js';
import PrizeClaim from '../models/PrizeClaim.js';
import Giveaway from '../models/Giveaway.js';
import Prize from '../models/Prize.js';
import AuditLog from '../models/AuditLog.js';

// GET /api/giveaways/:id/my-claim
export const getMyClaimStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const giveaway = await Giveaway.findOne({
      $or: [{ giveawayId: id }, { slug: id }]
    });

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: { code: 'GIVEAWAY_NOT_FOUND', message: 'Giveaway not found' }
      });
    }

    // Check if user is a winner in this giveaway
    const winnerRecord = await GiveawayWinner.findOne({
      giveawayId: giveaway.giveawayId,
      userId: user.userId
    });

    if (!winnerRecord) {
      return res.json({
        success: true,
        data: {
          isWinner: false,
          message: "You did not win in this giveaway. Keep participating for future rewards!"
        }
      });
    }

    // Check existing claim
    const claim = await PrizeClaim.findOne({
      giveawayId: giveaway.giveawayId,
      userId: user.userId
    });

    // Check expiration
    const isExpired = new Date() > new Date(winnerRecord.claimDeadline);

    res.json({
      success: true,
      data: {
        isWinner: true,
        winnerRecord,
        claim: claim || null,
        claimStatus: isExpired
          ? 'EXPIRED'
          : claim
          ? claim.status
          : 'NOT_SUBMITTED',
        claimDeadline: winnerRecord.claimDeadline
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/giveaways/:id/claim
export const submitPrizeClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { physicalDetails, digitalDetails } = req.body;

    const giveaway = await Giveaway.findOne({
      $or: [{ giveawayId: id }, { slug: id }]
    });

    if (!giveaway) {
      return res.status(404).json({
        success: false,
        error: { code: 'GIVEAWAY_NOT_FOUND', message: 'Giveaway not found' }
      });
    }

    // 1. Authoritative check: User MUST be in the winner list for this giveaway
    const winnerRecord = await GiveawayWinner.findOne({
      giveawayId: giveaway.giveawayId,
      userId: user.userId
    });

    if (!winnerRecord) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CLAIM_NOT_ALLOWED',
          message: 'You are not listed as a winner for this giveaway.'
        }
      });
    }

    // 2. Check if claim window has expired
    if (new Date() > new Date(winnerRecord.claimDeadline)) {
      winnerRecord.status = 'EXPIRED';
      await winnerRecord.save();

      return res.status(400).json({
        success: false,
        error: {
          code: 'CLAIM_EXPIRED',
          message: 'The claim window for this prize has expired.'
        }
      });
    }

    // 3. Validate based on authoritative prize type
    const prize = await Prize.findOne({ prizeId: winnerRecord.prizeId });
    const prizeType = prize ? prize.type : winnerRecord.prizeType;

    if (prizeType === 'physical') {
      if (!physicalDetails) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PHYSICAL_DETAILS',
            message: 'Physical delivery address is required.'
          }
        });
      }

      const { fullName, phoneNumber, completeAddress, city, state, pinCode } = physicalDetails;
      if (!fullName || !phoneNumber || !completeAddress || !city || !state || !pinCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INCOMPLETE_ADDRESS',
            message: 'Please provide complete name, phone, address, city, state, and PIN code.'
          }
        });
      }
    } else {
      // Gift Card or Digital Prize
      if (!digitalDetails || !digitalDetails.emailAddress) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_EMAIL',
            message: 'Please provide a valid email address to receive your voucher.'
          }
        });
      }
    }

    // 4. Save or update PrizeClaim
    let claim = await PrizeClaim.findOne({
      giveawayId: giveaway.giveawayId,
      userId: user.userId
    });

    if (claim) {
      claim.physicalDetails = physicalDetails || claim.physicalDetails;
      claim.digitalDetails = digitalDetails || claim.digitalDetails;
      claim.status = 'SUBMITTED';
      await claim.save();
    } else {
      claim = await PrizeClaim.create({
        giveawayId: giveaway.giveawayId,
        prizeId: winnerRecord.prizeId,
        userId: user.userId,
        prizeType,
        physicalDetails: prizeType === 'physical' ? physicalDetails : undefined,
        digitalDetails: prizeType !== 'physical' ? digitalDetails : undefined,
        status: 'SUBMITTED',
        trackingNumber: `VEL-SHIP-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }

    winnerRecord.status = 'CLAIMED';
    await winnerRecord.save();

    await AuditLog.create({
      userId: user.userId,
      action: 'CLAIM_SUBMITTED',
      giveawayId: giveaway.giveawayId,
      prizeId: winnerRecord.prizeId,
      result: 'SUCCESS',
      metadata: {
        prizeType,
        claimId: claim._id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Claim Submitted! Our team will process your prize.',
      data: claim
    });
  } catch (error) {
    next(error);
  }
};
