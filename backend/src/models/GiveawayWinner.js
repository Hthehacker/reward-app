import mongoose from 'mongoose';

const giveawayWinnerSchema = new mongoose.Schema(
  {
    giveawayId: {
      type: String,
      required: true,
      index: true
    },
    prizeId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true
    },
    maskedId: {
      type: String,
      required: true
    },
    prizeName: {
      type: String,
      required: true
    },
    prizeType: {
      type: String,
      enum: ['physical', 'gift_card', 'digital'],
      required: true
    },
    selectionMethod: {
      type: String,
      default: 'RANDOM_PROVABLY_FAIR'
    },
    selectedAt: {
      type: Date,
      default: Date.now
    },
    claimDeadline: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['ANNOUNCED', 'CLAIM_PENDING', 'CLAIMED', 'EXPIRED'],
      default: 'CLAIM_PENDING'
    }
  },
  {
    timestamps: true
  }
);

// Prevent accidental duplicate winner record for the same user and prize in a giveaway
giveawayWinnerSchema.index({ giveawayId: 1, prizeId: 1, userId: 1 }, { unique: true });

export default mongoose.model('GiveawayWinner', giveawayWinnerSchema);
