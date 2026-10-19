import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Prize from '../models/Prize.js';
import Giveaway from '../models/Giveaway.js';
import GiveawayParticipation from '../models/GiveawayParticipation.js';
import GiveawayWinner from '../models/GiveawayWinner.js';
import GiveawayEntryTransaction from '../models/GiveawayEntryTransaction.js';
import PrizeClaim from '../models/PrizeClaim.js';
import FraudEvent from '../models/FraudEvent.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seed]: Clearing existing giveaway database collections...');
    await Promise.all([
      User.deleteMany({}),
      Prize.deleteMany({}),
      Giveaway.deleteMany({}),
      GiveawayParticipation.deleteMany({}),
      GiveawayWinner.deleteMany({}),
      GiveawayEntryTransaction.deleteMany({}),
      PrizeClaim.deleteMany({}),
      FraudEvent.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Seed]: Creating seed Prizes...');
    const prizesData = [
      {
        prizeId: 'PRIZE-001',
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        position: '1st Prize',
        image: '/assets/prizes/prize-iphone-15-pro.webp',
        description: 'Titanium design with A17 Pro chip and state-of-the-art camera system.',
        fullDescription: 'The iPhone 15 Pro features aerospace-grade titanium design, powerful A17 Pro chip with hardware ray tracing, customizable Action Button, and a versatile 48MP main camera system with USB-C 3.0 speeds.',
        winnerCount: 1, // Mandatory single winner for 1st Prize
        type: 'physical',
        entryCurrency: 'VE',
        entryFee: 250,
        approxValue: '₹1,34,900',
        claimInstructions: 'Fulfillment includes doorstep insured courier delivery. Requires valid government ID name & delivery address verification.'
      },
      {
        prizeId: 'PRIZE-002',
        name: 'Apple Watch Series 9',
        slug: 'apple-watch',
        position: '2nd Prize',
        image: '/assets/prizes/prize-apple-watch-s9.webp',
        description: 'Always-On Retina display, S9 chip with magical Double Tap gesture.',
        fullDescription: 'Apple Watch Series 9 brings an ultra-bright Always-On Retina display up to 2000 nits, the S9 SiP chip, precision finding for iPhone, and intuitive double tap gesture control without touching the screen.',
        winnerCount: 3,
        type: 'physical',
        entryCurrency: 'VE',
        entryFee: 200,
        approxValue: '₹41,900',
        claimInstructions: 'Shipped via priority courier with tracking. Choose your preferred case finish upon claim verification.'
      },
      {
        prizeId: 'PRIZE-003',
        name: 'AirPods Pro (2nd Gen)',
        slug: 'airpods',
        position: '3rd Prize',
        image: '/assets/prizes/prize-airpods-pro.webp',
        description: 'Up to 2x more Active Noise Cancellation and Adaptive Audio.',
        fullDescription: 'AirPods Pro features the H2 chip, personalized spatial audio with dynamic head tracking, next-level Active Noise Cancellation, transparency mode, and MagSafe charging case with speaker and lanyard loop.',
        winnerCount: 5,
        type: 'physical',
        entryCurrency: 'SVE',
        entryFee: 500,
        approxValue: '₹24,900',
        claimInstructions: 'Includes factory sealed retail box with MagSafe case and 4 sizes of silicone ear tips.'
      },
      {
        prizeId: 'PRIZE-004',
        name: '₹2,000 Amazon Voucher',
        slug: 'amazon-2000',
        position: '4th Prize',
        image: '/assets/prizes/prize-amazon-2000.webp',
        description: 'Instant shopping voucher valid across all Amazon categories for 12 months.',
        fullDescription: 'Digital gift voucher delivered directly to your verified email address. Can be added to your Amazon Pay balance immediately with zero transaction fees.',
        winnerCount: 5,
        type: 'gift_card',
        entryCurrency: 'VE',
        entryFee: 500,
        approxValue: '₹2,000',
        claimInstructions: 'Digital claim. Requires email address verification only. Delivered within 24 hours of claim submission.'
      },
      {
        prizeId: 'PRIZE-005',
        name: '₹500 Amazon Voucher',
        slug: 'amazon-500',
        position: '5th Prize',
        image: '/assets/prizes/prize-amazon-500.webp',
        description: 'Instant Amazon credit for daily shopping, recharges, and bill payments.',
        fullDescription: 'A versatile ₹500 digital gift voucher redeemable for products, Kindle books, food delivery, and utility bill payments through Amazon Pay.',
        winnerCount: 10,
        type: 'gift_card',
        entryCurrency: 'VE',
        entryFee: 300,
        approxValue: '₹500',
        claimInstructions: 'Instant digital claim. Voucher code sent to winner email upon claim submission.'
      },
      {
        prizeId: 'PRIZE-006',
        name: '₹20 Amazon Voucher',
        slug: 'amazon-20',
        position: 'Lucky Draw',
        image: '/assets/prizes/prize-amazon-20.webp',
        description: 'Exclusive token-based reward pool with high winning odds.',
        fullDescription: 'Accessible token-based reward designed for everyday community members. Redeem your accrued VELOOP platform tokens for guaranteed draw entries.',
        winnerCount: 50,
        type: 'gift_card',
        entryCurrency: 'TOKEN',
        entryFee: 2000,
        approxValue: '₹20',
        claimInstructions: 'Digital redemption. Claim directly to registered email.'
      }
    ];

    const createdPrizes = await Prize.insertMany(prizesData);

    console.log('[Seed]: Creating seed Users...');
    const hashedPassword = await bcrypt.hash('Veloop2026!', 10);

    const usersData = [
      {
        userId: 'VE10025',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@veloop.io',
        password: hashedPassword,
        role: 'user',
        balances: { VEs: 850, SVEs: 1200, tokens: 5000 },
        deviceHash: 'dev_fp_aarav_850'
      },
      {
        userId: 'VE10099',
        name: 'Priya Verma',
        email: 'priya.verma@veloop.io',
        password: hashedPassword,
        role: 'user',
        balances: { VEs: 120, SVEs: 100, tokens: 350 },
        deviceHash: 'dev_fp_priya_120'
      },
      {
        userId: 'VE10042',
        name: 'Rohan Kapoor',
        email: 'rohan.kapoor@veloop.io',
        password: hashedPassword,
        role: 'user',
        balances: { VEs: 600, SVEs: 900, tokens: 4000 },
        deviceHash: 'dev_fp_rohan_part'
      },
      {
        userId: 'VE10088',
        name: 'Ananya Roy',
        email: 'ananya.roy@veloop.io',
        password: hashedPassword,
        role: 'user',
        balances: { VEs: 400, SVEs: 700, tokens: 2500 },
        deviceHash: 'dev_fp_ananya_win'
      },
      {
        userId: 'VE10077',
        name: 'Kabir Mehta',
        email: 'kabir.mehta@veloop.io',
        password: hashedPassword,
        role: 'user',
        balances: { VEs: 350, SVEs: 600, tokens: 3000 },
        deviceHash: 'dev_fp_kabir_win_gc'
      },
      {
        userId: 'VE10012',
        name: 'Meera Iyer',
        email: 'meera.iyer@veloop.io',
        password: hashedPassword,
        role: 'user',
        balances: { VEs: 500, SVEs: 800, tokens: 4200 },
        deviceHash: 'dev_fp_meera_nonwin'
      },
      {
        userId: 'VE_ADMIN',
        name: 'VELOOP Director',
        email: 'admin@veloop.io',
        password: hashedPassword,
        role: 'admin',
        balances: { VEs: 99999, SVEs: 99999, tokens: 99999 },
        deviceHash: 'dev_fp_admin_root'
      }
    ];

    const createdUsers = await User.insertMany(usersData);

    console.log('[Seed]: Creating seed Giveaways (Active & Past)...');
    const now = new Date();
    // 12 days, 8 hours, 45 minutes into the future
    const activeEndTime = new Date(now.getTime() + 12 * 24 * 3600 * 1000 + 8 * 3600 * 1000 + 45 * 60 * 1000 + 32 * 1000);
    const activeStartTime = new Date(now.getTime() - 2 * 24 * 3600 * 1000);

    const activeGiveaway = await Giveaway.create({
      giveawayId: 'GW-2026-08',
      title: 'Summer Rewards Giveaway',
      slug: 'summer-rewards-2026',
      subtitle: 'Complete eligible activities, collect entries and get a chance to win exciting rewards.',
      description: 'The flagship VELOOP Summer Rewards event featuring premium titanium devices, audio gear, and flexible shopping vouchers. Participation is open to all verified members holding required entry credits.',
      status: 'ACTIVE',
      isCurrent: true,
      startAt: activeStartTime,
      endAt: activeEndTime,
      participantsCount: 8524,
      totalRewardsDistributed: 1240,
      prizes: createdPrizes.map((p) => p._id),
      rules: [
        {
          title: 'Eligibility & Verification',
          description: 'Open to registered VELOOP members aged 18+ in supported regions. Accounts must be in good standing without previous fraud flags.'
        },
        {
          title: 'One Entry Policy',
          description: 'Each member may enter once per giveaway event. Multiple entries from spoofed accounts or shared device rings are strictly prohibited and automatically blocked.'
        },
        {
          title: 'Authoritative Currency Deduction',
          description: 'Entry fees (250 VEs for iPhone, 200 VEs for Watch, 500 SVEs for AirPods, etc.) are verified server-side and atomically deducted upon confirmation.'
        },
        {
          title: 'Provably Fair Selection',
          description: 'Winners are determined using server-side pseudorandom seed algorithms immediately when the countdown timer concludes.'
        },
        {
          title: 'Prize Claim Deadline',
          description: 'Winners have a 7-day claim window. Physical prizes require postal delivery verification; digital vouchers are sent directly to verified email addresses.'
        },
        {
          title: 'Anti-Abuse & Disqualification',
          description: 'VELOOP employs real-time rate limiting, IP velocity analysis, and device fingerprint risk modeling to maintain platform integrity.'
        }
      ],
      eligibility: [
        'Registered VELOOP account in good standing',
        'Verified phone or email identity',
        'Sufficient virtual balance (VEs, SVEs, or Tokens)',
        'Compliance with single-entry terms'
      ],
      participationSettings: {
        maxEntriesPerUser: 1,
        requireVerification: true,
        claimDeadlineDays: 7
      }
    });

    // Seed Completed Giveaway 1 (August Reward Rush)
    const pastEndTime1 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const pastStartTime1 = new Date(now.getTime() - 21 * 24 * 3600 * 1000);

    const pastGiveaway1 = await Giveaway.create({
      giveawayId: 'GW-2026-07',
      title: 'August Reward Rush',
      slug: 'august-reward-rush',
      subtitle: 'Celebrating high-achiever reward milestones with flagship hardware.',
      description: 'Completed celebration giveaway where over 12,000 members participated for tech gadgets and shopping credits.',
      status: 'ENDED',
      isCurrent: false,
      startAt: pastStartTime1,
      endAt: pastEndTime1,
      participantsCount: 12840,
      totalRewardsDistributed: 19,
      prizes: [createdPrizes[0]._id, createdPrizes[1]._id, createdPrizes[2]._id, createdPrizes[3]._id],
      rules: activeGiveaway.rules,
      eligibility: activeGiveaway.eligibility
    });

    // Seed Completed Giveaway 2 (Independence Rewards)
    const pastEndTime2 = new Date(now.getTime() - 25 * 24 * 3600 * 1000);
    const pastStartTime2 = new Date(now.getTime() - 39 * 24 * 3600 * 1000);

    const pastGiveaway2 = await Giveaway.create({
      giveawayId: 'GW-2026-06',
      title: 'Independence Rewards',
      slug: 'independence-rewards',
      subtitle: 'Mid-year festival rewards honoring active VELOOP contributors.',
      description: 'Completed festival giveaway distribution across tier-1 participants.',
      status: 'ENDED',
      isCurrent: false,
      startAt: pastStartTime2,
      endAt: pastEndTime2,
      participantsCount: 9650,
      totalRewardsDistributed: 15,
      prizes: [createdPrizes[0]._id, createdPrizes[1]._id, createdPrizes[2]._id],
      rules: activeGiveaway.rules,
      eligibility: activeGiveaway.eligibility
    });

    // Seed an Upcoming Giveaway (Stage 3 lifecycle demo: "Next Giveaway Starts In 3 Days")
    const upcomingStartTime = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
    const upcomingEndTime = new Date(now.getTime() + 17 * 24 * 3600 * 1000);

    await Giveaway.create({
      giveawayId: 'GW-2026-09',
      title: 'Autumn Tech Gala Giveaway',
      slug: 'autumn-tech-gala',
      subtitle: 'Get ready for the next reward opportunity starting soon.',
      description: 'Upcoming autumn rewards featuring the latest generation laptops, cameras, and gift bundles.',
      status: 'UPCOMING',
      isCurrent: false,
      startAt: upcomingStartTime,
      endAt: upcomingEndTime,
      participantsCount: 0,
      totalRewardsDistributed: 0,
      prizes: [createdPrizes[0]._id, createdPrizes[1]._id, createdPrizes[2]._id],
      rules: activeGiveaway.rules,
      eligibility: activeGiveaway.eligibility
    });

    console.log('[Seed]: Seeding pre-existing participations for demo states...');
    // Seed Rohan (VE10042) as already participated in active giveaway
    const rohanTxnId = `TXN-SEED-${Date.now()}-1042`;
    await GiveawayEntryTransaction.create({
      transactionId: rohanTxnId,
      userId: 'VE10042',
      giveawayId: 'GW-2026-08',
      prizeId: 'PRIZE-001',
      currency: 'VE',
      amount: 250,
      type: 'ENTRY_FEE',
      status: 'SUCCESS',
      balanceBefore: 850,
      balanceAfter: 600,
      note: 'Seed entry for iPhone 15 Pro'
    });

    await GiveawayParticipation.create({
      userId: 'VE10042',
      userRef: createdUsers[2]._id,
      giveawayId: 'GW-2026-08',
      prizeId: 'PRIZE-001',
      entryCurrency: 'VE',
      entryAmount: 250,
      deviceHash: 'dev_fp_rohan_part',
      ip: '127.0.0.1',
      status: 'ACTIVE',
      transactionId: rohanTxnId
    });

    console.log('[Seed]: Seeding previous giveaway winners for Historical Tabs...');
    // Historical Winners for August Reward Rush (GW-2026-07)
    await GiveawayWinner.create([
      {
        giveawayId: 'GW-2026-07',
        prizeId: 'PRIZE-001',
        userId: 'VE10082',
        userName: 'Vikram Malhotra',
        maskedId: 'VE****82',
        prizeName: 'iPhone 15 Pro',
        prizeType: 'physical',
        selectedAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
        claimDeadline: new Date(now.getTime() - 24 * 3600 * 1000),
        status: 'CLAIMED'
      },
      {
        giveawayId: 'GW-2026-07',
        prizeId: 'PRIZE-002',
        userId: 'VE10042',
        userName: 'Rohan Kapoor',
        maskedId: 'VE****42',
        prizeName: 'Apple Watch Series 9',
        prizeType: 'physical',
        selectedAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
        claimDeadline: new Date(now.getTime() - 24 * 3600 * 1000),
        status: 'CLAIMED'
      },
      {
        giveawayId: 'GW-2026-07',
        prizeId: 'PRIZE-003',
        userId: 'VE10091',
        userName: 'Sanya Singhal',
        maskedId: 'VE****91',
        prizeName: 'AirPods Pro (2nd Gen)',
        prizeType: 'physical',
        selectedAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
        claimDeadline: new Date(now.getTime() - 24 * 3600 * 1000),
        status: 'CLAIMED'
      },
      {
        giveawayId: 'GW-2026-07',
        prizeId: 'PRIZE-004',
        userId: 'VE10027',
        userName: 'Kunal Deshmukh',
        maskedId: 'VE****27',
        prizeName: '₹2,000 Amazon Voucher',
        prizeType: 'gift_card',
        selectedAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
        claimDeadline: new Date(now.getTime() - 24 * 3600 * 1000),
        status: 'CLAIMED'
      }
    ]);

    // Historical Winners for Independence Rewards (GW-2026-06)
    await GiveawayWinner.create([
      {
        giveawayId: 'GW-2026-06',
        prizeId: 'PRIZE-001',
        userId: 'VE10019',
        userName: 'Deepak Joshi',
        maskedId: 'VE****19',
        prizeName: 'iPhone 15 Pro',
        prizeType: 'physical',
        selectedAt: new Date(now.getTime() - 25 * 24 * 3600 * 1000),
        claimDeadline: new Date(now.getTime() - 18 * 24 * 3600 * 1000),
        status: 'CLAIMED'
      },
      {
        giveawayId: 'GW-2026-06',
        prizeId: 'PRIZE-002',
        userId: 'VE10063',
        userName: 'Neha Nambiar',
        maskedId: 'VE****63',
        prizeName: 'Apple Watch Series 9',
        prizeType: 'physical',
        selectedAt: new Date(now.getTime() - 25 * 24 * 3600 * 1000),
        claimDeadline: new Date(now.getTime() - 18 * 24 * 3600 * 1000),
        status: 'CLAIMED'
      }
    ]);

    // Seed winner records for demonstration of Winner States (Req #26, #34)
    // Ananya (VE10088) is set as an active winner of Apple Watch in active giveaway to test Physical Claim
    await GiveawayWinner.create({
      giveawayId: 'GW-2026-08',
      prizeId: 'PRIZE-002',
      userId: 'VE10088',
      userName: 'Ananya Roy',
      maskedId: 'VE****88',
      prizeName: 'Apple Watch Series 9',
      prizeType: 'physical',
      selectedAt: new Date(),
      claimDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      status: 'CLAIM_PENDING'
    });

    // Kabir (VE10077) is set as an active winner of ₹2,000 Amazon Voucher to test Gift Card Claim
    await GiveawayWinner.create({
      giveawayId: 'GW-2026-08',
      prizeId: 'PRIZE-004',
      userId: 'VE10077',
      userName: 'Kabir Mehta',
      maskedId: 'VE****77',
      prizeName: '₹2,000 Amazon Voucher',
      prizeType: 'gift_card',
      selectedAt: new Date(),
      claimDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      status: 'CLAIM_PENDING'
    });

    console.log('[Seed]: Successfully completed database seeding!');
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
};

// Auto-run if executed directly
if (process.argv[1].endsWith('seedData.js')) {
  mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veloop_rewards')
    .then(async () => {
      await seedDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
