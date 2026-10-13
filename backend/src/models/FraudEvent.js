import mongoose from 'mongoose';

const fraudEventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    giveawayId: {
      type: String,
      index: true
    },
    deviceHash: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    classification: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    signals: [
      {
        type: String
      }
    ],
    action: {
      type: String,
      enum: ['ALLOWED', 'FLAGGED', 'BLOCKED'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('FraudEvent', fraudEventSchema);
