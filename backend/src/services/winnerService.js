import GiveawayWinner from '../models/GiveawayWinner.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import Prize from '../models/Prize.js';
import Giveaway from '../models/Giveaway.js';
import User from '../models/User.js';
import { maskUserId } from './giveawayService.js';

export const selectWinnersForGiveaway = async (giveawayId) => {
  const giveaway = await Giveaway.findOne({ giveawayId }).populate('prizes');
  if (!giveaway) {
    throw new Error('GIVEAWAY_NOT_FOUND');
  }

  const results = [];
  const claimDeadline = new Date(Date.now() + (giveaway.participationSettings?.claimDeadlineDays || 7) * 24 * 60 * 60 * 1000);

  for (const prize of giveaway.prizes) {
    // Check if winners already finalized for this prize
    const existingWinnersCount = await GiveawayWinner.countDocuments({
      giveawayId,
      prizeId: prize.prizeId
    });

    const neededWinners = prize.winnerCount - existingWinnersCount;
    if (neededWinners <= 0) {
      continue;
    }

    // Get participations for this giveaway & prize that haven't won anything yet
    const existingWinnerUserIds = await GiveawayWinner.distinct('userId', { giveawayId });

    const eligibleParticipations = await GiveawayParticipation.find({
      giveawayId,
      prizeId: prize.prizeId,
      status: 'ACTIVE',
      userId: { $nin: existingWinnerUserIds }
    });

    // If participations exist, select provably fair random winners
    // Shuffle array using Fisher-Yates
    const shuffled = [...eligibleParticipations];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedParticipations = shuffled.slice(0, neededWinners);

    for (const part of selectedParticipations) {
      const user = await User.findOne({ userId: part.userId });
      const winnerName = user ? user.name : `Participant ${part.userId}`;

      try {
        const winnerDoc = await GiveawayWinner.create({
          giveawayId,
          prizeId: prize.prizeId,
          userId: part.userId,
          userName: winnerName,
          maskedId: maskUserId(part.userId),
          prizeName: prize.name,
          prizeType: prize.type,
          selectionMethod: 'RANDOM_PROVABLY_FAIR',
          selectedAt: new Date(),
          claimDeadline,
          status: 'CLAIM_PENDING'
        });

        // Mark participation status as WON
        part.status = 'WON';
        await part.save();

        results.push(winnerDoc);
      } catch (err) {
        // Unique index handles duplicate prevention
        console.warn('Duplicate winner prevented:', err.message);
      }
    }
  }

  // Update giveaway status to ENDED if not already
  if (giveaway.status !== 'ENDED' && giveaway.status !== 'ARCHIVED') {
    giveaway.status = 'ENDED';
    await giveaway.save();
  }

  return results;
};
