import mongoose from 'mongoose';

const giveawayEntryTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    giveawayId: {
      type: String,
      required: true,
      index: true
    },
    prizeId: {
      type: String,
      required: true
    },
    currency: {
      type: String,
      enum: ['VE', 'SVE', 'TOKEN'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['ENTRY_FEE', 'REVERSAL'],
      default: 'ENTRY_FEE'
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED'],
      default: 'SUCCESS'
    },
    balanceBefore: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('GiveawayEntryTransaction', giveawayEntryTransactionSchema);
