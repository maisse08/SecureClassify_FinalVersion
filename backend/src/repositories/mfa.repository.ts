import MfaCode from '../models/MfaCode';
import { IMfaCode } from '../interfaces/IMfaCode';
import { Types } from 'mongoose';

export class MfaRepository {
  /**
   * Create a new MFA code record
   */
  async create(data: {
    user: Types.ObjectId;
    hashedOtp: string;
    expiresAt: Date;
    attempts?: number;
  }): Promise<IMfaCode> {
    const mfaCode = new MfaCode(data);
    return mfaCode.save();
  }

  /**
   * Find the latest MFA code for a given user
   */
  async findByUser(userId: Types.ObjectId | string): Promise<IMfaCode | null> {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const result = await MfaCode.findOne({ user: objectId as any })
      .sort({ createdAt: -1 })
      .exec();
    return result;
  }

  /**
   * Delete all MFA codes for a given user
   * This is used when a new OTP is generated or after successful verification
   */
  async deleteByUser(userId: Types.ObjectId | string): Promise<number> {
    const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const result = await MfaCode.deleteMany({ user: objectId as any }).exec();
    return result.deletedCount;
  }

  /**
   * Increment the attempts counter for an MFA code
   * Uses atomic $inc to prevent race conditions
   */
  async incrementAttempts(mfaCodeId: Types.ObjectId | string): Promise<IMfaCode | null> {
    const objectId = typeof mfaCodeId === 'string' ? new Types.ObjectId(mfaCodeId) : mfaCodeId;
    const result = await MfaCode.findByIdAndUpdate(
      objectId,
      { $inc: { attempts: 1 } },
      { new: true }
    ).exec();
    return result;
  }
}

export default new MfaRepository();