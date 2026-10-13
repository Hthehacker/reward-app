import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    balances: {
      VEs: {
        type: Number,
        default: 850,
        min: 0
      },
      SVEs: {
        type: Number,
        default: 1200,
        min: 0
      },
      tokens: {
        type: Number,
        default: 5000,
        min: 0
      }
    },
    deviceHash: {
      type: String,
      default: ''
    },
    isSuspicious: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('User', userSchema);
