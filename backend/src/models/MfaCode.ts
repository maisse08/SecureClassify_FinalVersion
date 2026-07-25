import mongoose, { Schema } from 'mongoose';
import { IMfaCode } from '../interfaces/IMfaCode';

const mfaCodeSchema = new Schema<IMfaCode>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    hashedOtp: {
      type: String,
      required: [true, 'Hashed OTP is required'],
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookup: find latest OTP by user, sorted by creation date
mfaCodeSchema.index({ user: 1, createdAt: -1 });

// TTL index: automatically delete documents when expiresAt is reached
mfaCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MfaCode = mongoose.model<IMfaCode>('MfaCode', mfaCodeSchema);

export default MfaCode;