import mongoose from 'mongoose';

const prizeClaimSchema = new mongoose.Schema(
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
    prizeType: {
      type: String,
      enum: ['physical', 'gift_card', 'digital'],
      required: true
    },
    physicalDetails: {
      fullName: { type: String, trim: true },
      phoneNumber: { type: String, trim: true },
      completeAddress: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pinCode: { type: String, trim: true }
    },
    digitalDetails: {
      emailAddress: { type: String, trim: true, lowercase: true }
    },
    status: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'EXPIRED'],
      default: 'SUBMITTED'
    },
    trackingNumber: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

prizeClaimSchema.index({ giveawayId: 1, prizeId: 1, userId: 1 }, { unique: true });

export default mongoose.model('PrizeClaim', prizeClaimSchema);
