import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'JOIN_GIVEAWAY',
        'ENTRY_FEE_DEDUCTED',
        'JOIN_REJECTED',
        'DUPLICATE_ATTEMPT',
        'FRAUD_FLAGGED',
        'FRAUD_BLOCKED',
        'CLAIM_SUBMITTED',
        'WINNER_SELECTED',
        'BALANCE_UPDATE',
        'GIVEAWAY_STATUS_CHANGED'
      ],
      index: true
    },
    giveawayId: {
      type: String,
      index: true
    },
    prizeId: {
      type: String
    },
    amount: {
      type: Number
    },
    currency: {
      type: String
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'BLOCKED', 'FLAGGED'],
      required: true
    },
    requestIdentifier: {
      type: String
    },
    ip: {
      type: String
    },
    deviceHash: {
      type: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('AuditLog', auditLogSchema);
