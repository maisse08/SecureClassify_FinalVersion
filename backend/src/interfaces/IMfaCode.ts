import { Document, ObjectId } from 'mongoose';

export interface IMfaCode extends Document {
  user: ObjectId;
  hashedOtp: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}