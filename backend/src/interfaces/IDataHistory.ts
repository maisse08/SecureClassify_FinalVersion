import { Document, Types } from "mongoose";

export interface IDataHistory extends Document {
    data: Types.ObjectId;
    action: "create" | "update" | "delete" | "restore" | "import" | "cia_assigned" | "classified";
    performedBy: Types.ObjectId;
    details?: string;
    timestamp: Date;
}
