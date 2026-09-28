import "server-only";
import { FEE_STATUSES } from "../../lib/constants.js";
import { ObjectId, Schema, baseOptions, model } from "./_shared.js";

// Status only — no amounts, never exposed to students (FR-PAY-01).
const FeeRecordSchema = new Schema(
    {
        student: { type: ObjectId, ref: "Student", required: true },
        period: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
        status: { type: String, enum: FEE_STATUSES, default: "due" },
        classSnapshot: { type: ObjectId, ref: "Class", required: true },
        batchSnapshot: { type: ObjectId, ref: "Batch", required: true },
        batchTimeSnapshot: { type: String, default: "" },
        paidAt: Date,
        note: { type: String, trim: true, maxlength: 300 },
        updatedBy: { type: ObjectId, ref: "User" },
    },
    baseOptions,
);
FeeRecordSchema.index({ student: 1, period: 1 }, { unique: true });
FeeRecordSchema.index({ batchSnapshot: 1, period: 1 });
FeeRecordSchema.index({ period: 1, status: 1 });

export const FeeRecord = model("FeeRecord", FeeRecordSchema, "feerecords");
