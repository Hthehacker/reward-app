import Giveaway from '../models/Giveaway.js';
import Prize from '../models/Prize.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import GiveawayEntryTransaction from '../models/GiveawayEntryTransaction.js';
import AuditLog from '../models/AuditLog.js';
import { verifyAndDeductBalance, refundBalance } from '../services/balanceService.js';
import { analyzeParticipationRisk } from '../services/fraudService.js';


export const joinGiveaway = async (req, res, next) => {
  const { id } = req.params;
  const { prizeId: requestPrizeId } = req.body;
  const user = req.user;
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const deviceHash = req.headers['x-device-hash'] || user.deviceHash || 'dev_device_fp_default';

  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  try {
    // 1. Load giveaway from DB (authoritative)
    const giveaway = await Giveaway.findOne({
      $or: [{ giveawayId: id }, { slug: id }]
    }).populate('prizes');

    if (!giveaway) {
      await AuditLog.create({
        userId: user.userId,
        action: 'JOIN_REJECTED',
        giveawayId: id,
        result: 'FAILURE',
        metadata: { reason: 'GIVEAWAY_NOT_FOUND' }
      });
      return res.status(404).json({
        success: false,
        error: {
          code: 'GIVEAWAY_NOT_FOUND',
          message: 'The requested giveaway does not exist.'
        }
      });
    }

    // 2. Check giveaway status
    if (giveaway.status === 'UPCOMING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'GIVEAWAY_NOT_ACTIVE',
          message: 'This giveaway has not started yet. Please check back when it goes live.'
        }
      });
    }

    const now = new Date();
    if (giveaway.status === 'ENDED' || now > new Date(giveaway.endAt)) {
      if (giveaway.status !== 'ENDED') {
        giveaway.status = 'ENDED';
        await giveaway.save();
      }
      return res.status(400).json({
        success: false,
        error: {
          code: 'GIVEAWAY_ENDED',
          message: 'This giveaway has ended. Check out the winners and get ready for the next giveaway.'
        }
      });
    }

    // 3. Resolve Prize (authoritative - never trust client price/currency)
    let selectedPrize = null;
    if (requestPrizeId) {
      selectedPrize = giveaway.prizes.find(
        (p) => p.prizeId === requestPrizeId || p.slug === requestPrizeId || p._id.toString() === requestPrizeId
      );
    }
    if (!selectedPrize && giveaway.prizes.length > 0) {
      selectedPrize = giveaway.prizes[0];
    }

    if (!selectedPrize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRIZE',
          message: 'Specified prize is not available in this giveaway.'
        }
      });
    }

    const requiredCurrency = selectedPrize.entryCurrency; // 'VE', 'SVE', or 'TOKEN'
    const requiredAmount = selectedPrize.entryFee; // Authoritative fee from DB!

    // 4. Check existing participation (database-level uniqueness check + app check)
    const existingParticipation = await GiveawayParticipation.findOne({
      userId: user.userId,
      giveawayId: giveaway.giveawayId
    });

    if (existingParticipation) {
      await AuditLog.create({
        userId: user.userId,
        action: 'DUPLICATE_ATTEMPT',
        giveawayId: giveaway.giveawayId,
        prizeId: selectedPrize.prizeId,
        result: 'BLOCKED',
        metadata: { existingJoinedAt: existingParticipation.joinedAt }
      });

      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_PARTICIPATING',
          message: "You're already participating in this giveaway! You can participate again when a new giveaway event begins."
        }
      });
    }

    // 5. Fraud risk analysis
    const fraudAssessment = await analyzeParticipationRisk({
      userId: user.userId,
      giveawayId: giveaway.giveawayId,
      ip,
      deviceHash,
      user
    });

    if (fraudAssessment.action === 'BLOCKED') {
      await AuditLog.create({
        userId: user.userId,
        action: 'FRAUD_BLOCKED',
        giveawayId: giveaway.giveawayId,
        result: 'BLOCKED',
        deviceHash,
        ip,
        metadata: { signals: fraudAssessment.signals, score: fraudAssessment.riskScore }
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'PARTICIPATION_BLOCKED',
          message: "Participation couldn't be completed. We couldn't verify this participation request. Please try again later or contact support if you believe this is an error."
        }
      });
    }

    // 6. Atomic Balance Verification & Deduction
    let deductionResult;
    try {
      deductionResult = await verifyAndDeductBalance({
        userId: user.userId,
        currency: requiredCurrency,
        requiredAmount
      });
    } catch (balErr) {
      const currencyLabel = requiredCurrency === 'TOKEN' ? 'Tokens' : `${requiredCurrency}s`;
      let errorMsg = `Not enough ${currencyLabel}`;
      if (balErr.deficit) {
        errorMsg += `. You need ${balErr.deficit} more ${currencyLabel} to join this giveaway.`;
      }

      return res.status(400).json({
        success: false,
        error: {
          code: balErr.message || `INSUFFICIENT_${requiredCurrency}_BALANCE`,
          message: errorMsg,
          required: requiredAmount,
          currency: requiredCurrency
        }
      });
    }

    // 7. Record Financial Entry Transaction
    const transactionRecord = await GiveawayEntryTransaction.create({
      transactionId,
      userId: user.userId,
      giveawayId: giveaway.giveawayId,
      prizeId: selectedPrize.prizeId,
      currency: requiredCurrency,
      amount: requiredAmount,
      type: 'ENTRY_FEE',
      status: 'SUCCESS',
      balanceBefore: deductionResult.balanceBefore,
      balanceAfter: deductionResult.balanceAfter,
      note: `Entry fee for ${selectedPrize.name} in ${giveaway.title}`
    });

    // 8. Record Participation (guaranteed unique by compound index)
    let participation;
    try {
      participation = await GiveawayParticipation.create({
        userId: user.userId,
        userRef: user._id,
        giveawayId: giveaway.giveawayId,
        prizeId: selectedPrize.prizeId,
        entryCurrency: requiredCurrency,
        entryAmount: requiredAmount,
        deviceHash,
        ip,
        status: 'ACTIVE',
        transactionId
      });
    } catch (dbErr) {
      // If compound unique index violation occurred (e.g. race condition)
      if (dbErr.code === 11000) {
        // Rollback / Refund deducted balance
        await refundBalance({
          userId: user.userId,
          currency: requiredCurrency,
          amount: requiredAmount
        });

        transactionRecord.status = 'REVERSED';
        transactionRecord.note += ' [Auto-reversed due to concurrent duplicate submission]';
        await transactionRecord.save();

        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_PARTICIPATING',
            message: "You're already participating! Your entry has already been recorded."
          }
        });
      }
      throw dbErr;
    }

    // 9. Update participant stats & Audit Log
    giveaway.participantsCount = (giveaway.participantsCount || 8500) + 1;
    await giveaway.save();

    await AuditLog.create({
      userId: user.userId,
      action: 'JOIN_GIVEAWAY',
      giveawayId: giveaway.giveawayId,
      prizeId: selectedPrize.prizeId,
      amount: requiredAmount,
      currency: requiredCurrency,
      result: 'SUCCESS',
      requestIdentifier: transactionId,
      ip,
      deviceHash,
      metadata: {
        prizeName: selectedPrize.name,
        newBalance: deductionResult.balanceAfter
      }
    });

    return res.status(201).json({
      success: true,
      message: "You're In! Your participation has been successfully recorded.",
      data: {
        participationId: participation._id,
        giveawayId: giveaway.giveawayId,
        prize: {
          id: selectedPrize.prizeId,
          name: selectedPrize.name,
          position: selectedPrize.position
        },
        entryFeeDeducted: {
          amount: requiredAmount,
          currency: requiredCurrency
        },
        newBalance: deductionResult.balanceAfter,
        transactionId
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getMyParticipationStatus = async (req, res, next) => {
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

    const participation = await GiveawayParticipation.findOne({
      userId: user.userId,
      giveawayId: giveaway.giveawayId
    });

    const transactions = await GiveawayEntryTransaction.find({
      userId: user.userId,
      giveawayId: giveaway.giveawayId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        isParticipating: !!participation,
        participation: participation || null,
        entryCount: participation ? 1 : 0,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};
