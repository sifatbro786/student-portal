import "server-only";
import { Schema, ObjectId, model } from "./_shared.js";

const BatchChangeLogSchema = new Schema(
    {
        student: { type: ObjectId, ref: "Student", required: true, index: true },
        fromClass: { type: ObjectId, ref: "Class" },
        fromBatch: { type: ObjectId, ref: "Batch" },
        toClass: { type: ObjectId, ref: "Class", required: true },
        toBatch: { type: ObjectId, ref: "Batch", required: true },
        reason: { type: String, trim: true, maxlength: 300 },
        changedBy: { type: ObjectId, ref: "User", required: true },
        at: { type: Date, default: Date.now },
    },
    { versionKey: false },
);

export const BatchChangeLog = model("BatchChangeLog", BatchChangeLogSchema, "batchchangelogs");
