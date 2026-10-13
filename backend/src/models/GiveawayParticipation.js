import mongoose from 'mongoose';

const giveawayParticipationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
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
    entryCurrency: {
      type: String,
      enum: ['VE', 'SVE', 'TOKEN'],
      required: true
    },
    entryAmount: {
      type: Number,
      required: true
    },
    deviceHash: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISQUALIFIED', 'WON', 'NOT_WON'],
      default: 'ACTIVE'
    },
    transactionId: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Critical compound unique index guaranteeing 1 participation per user per giveaway event
giveawayParticipationSchema.index({ userId: 1, giveawayId: 1 }, { unique: true });
// Index for fraud analysis of multiple accounts on same device
giveawayParticipationSchema.index({ giveawayId: 1, deviceHash: 1 });

export default mongoose.model('GiveawayParticipation', giveawayParticipationSchema);
