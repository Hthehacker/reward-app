import mongoose from 'mongoose';

const giveawaySchema = new mongoose.Schema(
  {
    giveawayId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    subtitle: {
      type: String,
      default: 'Complete eligible activities, collect entries and get a chance to win exciting rewards.'
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'ENDED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true
    },
    startAt: {
      type: Date,
      required: true
    },
    endAt: {
      type: Date,
      required: true
    },
    participantsCount: {
      type: Number,
      default: 8520
    },
    totalRewardsDistributed: {
      type: Number,
      default: 1240
    },
    prizes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prize'
      }
    ],
    rules: [
      {
        title: String,
        description: String
      }
    ],
    eligibility: [
      {
        type: String
      }
    ],
    participationSettings: {
      maxEntriesPerUser: {
        type: Number,
        default: 1
      },
      requireVerification: {
        type: Boolean,
        default: true
      },
      claimDeadlineDays: {
        type: Number,
        default: 7
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Giveaway', giveawaySchema);
