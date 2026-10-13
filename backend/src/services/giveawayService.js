import Giveaway from '../models/Giveaway.js';
import Prize from '../models/Prize.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';

export const getAuthoritativeGiveaway = async (giveawayIdOrSlug) => {
  const query = giveawayIdOrSlug.startsWith('GW-')
    ? { giveawayId: giveawayIdOrSlug }
    : { slug: giveawayIdOrSlug };

  const giveaway = await Giveaway.findOne(query).populate('prizes');
  if (!giveaway) {
    return null;
  }

  // Check server-side time vs endAt
  const now = new Date();
  if (giveaway.status === 'ACTIVE' && now > new Date(giveaway.endAt)) {
    giveaway.status = 'ENDED';
    await giveaway.save();
  } else if (giveaway.status === 'UPCOMING' && now >= new Date(giveaway.startAt) && now <= new Date(giveaway.endAt)) {
    giveaway.status = 'ACTIVE';
    await giveaway.save();
  }

  return giveaway;
};

export const maskUserId = (userId) => {
  if (!userId || userId.length <= 4) return 'VE****';
  const prefix = userId.slice(0, 2);
  const suffix = userId.slice(-2);
  return `${prefix}****${suffix}`;
};

export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return 'u***@veloop.com';
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
};
