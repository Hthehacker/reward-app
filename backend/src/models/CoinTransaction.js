import mongoose from 'mongoose';

const coinTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    adminId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    currency: {
      type: String,
      enum: ['VE', 'SVE', 'TOKEN'],
      default: 'VE',
      required: true
    },
    type: {
      type: String,
      enum: ['ADD', 'DEDUCT'],
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Adjustment amount is required'],
      min: [1, 'Amount must be at least 1']
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: [true, 'A reason for the coin adjustment is required'],
      trim: true,
      minlength: [3, 'Reason must be at least 3 characters long']
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast queries by user and date
coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ adminId: 1, createdAt: -1 });

export default mongoose.model('CoinTransaction', coinTransactionSchema);
