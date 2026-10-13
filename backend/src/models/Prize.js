import mongoose from 'mongoose';

const prizeSchema = new mongoose.Schema(
  {
    prizeId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    position: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    fullDescription: {
      type: String,
      default: ''
    },
    winnerCount: {
      type: Number,
      required: true,
      default: 1
    },
    type: {
      type: String,
      enum: ['physical', 'gift_card', 'digital'],
      required: true
    },
    entryCurrency: {
      type: String,
      enum: ['VE', 'SVE', 'TOKEN'],
      required: true
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0
    },
    approxValue: {
      type: String,
      default: ''
    },
    claimInstructions: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Prize', prizeSchema);
