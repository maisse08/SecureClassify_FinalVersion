import { Document, Types } from "mongoose";

export interface IShare extends Document {
    document: Types.ObjectId;
    documentTitle: string;
    sender: Types.ObjectId;
    senderEmail: string;
    receiver: Types.ObjectId;
    receiverEmail: string;
    permission: "Read" | "Read & Write" | "Full Access";
    sharedDate: Date;
    expirationDate: Date;
    status: "Active" | "Expired" | "Revoked";
}