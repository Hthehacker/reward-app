import FraudEvent from '../models/FraudEvent.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';

export const analyzeParticipationRisk = async ({ userId, giveawayId, ip, deviceHash, user }) => {
  let riskScore = 0;
  const signals = [];
  let reason = 'Standard verification passed';

  // 1. Check if user profile is already flagged
  if (user && user.isSuspicious) {
    riskScore += 50;
    signals.push('USER_ALREADY_FLAGGED');
  }

  // 2. Device Fingerprint Analysis (multiple distinct accounts from same device)
  if (deviceHash) {
    const existingOtherUsersOnDevice = await GiveawayParticipation.distinct('userId', {
      giveawayId,
      deviceHash,
      userId: { $ne: userId }
    });

    if (existingOtherUsersOnDevice.length >= 2) {
      riskScore += 45;
      signals.push(`MULTIPLE_ACCOUNTS_ON_SAME_DEVICE_${existingOtherUsersOnDevice.length}`);
    } else if (existingOtherUsersOnDevice.length === 1) {
      riskScore += 25;
      signals.push('SHARED_DEVICE_SECONDARY_ACCOUNT');
    }
  }

  // 3. Velocity check: recent participations in rapid succession across giveaways
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentParticipationsCount = await GiveawayParticipation.countDocuments({
    userId,
    joinedAt: { $gte: fiveMinutesAgo }
  });

  if (recentParticipationsCount >= 5) {
    riskScore += 30;
    signals.push('HIGH_FREQUENCY_PARTICIPATION_BURST');
  }

  // 4. IP reputation check / missing device fingerprint
  if (!deviceHash) {
    riskScore += 15;
    signals.push('MISSING_DEVICE_FINGERPRINT');
  }

  // Classify risk
  let classification = 'LOW';
  let action = 'ALLOWED';

  if (riskScore >= 80) {
    classification = 'CRITICAL';
    action = 'BLOCKED';
    reason = 'Critical risk threshold exceeded: anomalous multi-account or pattern violation';
  } else if (riskScore >= 60) {
    classification = 'HIGH';
    action = 'FLAGGED';
    reason = 'High risk: suspicious device concurrency';
  } else if (riskScore >= 30) {
    classification = 'MEDIUM';
    action = 'ALLOWED';
    reason = 'Medium risk: monitored activity';
  }

  // If flagged or blocked, persist a FraudEvent record
  if (action === 'BLOCKED' || action === 'FLAGGED') {
    await FraudEvent.create({
      userId,
      giveawayId,
      deviceHash: deviceHash || 'UNKNOWN',
      ip: ip || '127.0.0.1',
      riskScore,
      classification,
      reason,
      signals,
      action
    });
  }

  return {
    riskScore,
    classification,
    action,
    signals,
    reason
  };
};
