import "server-only";
import { Schema, ObjectId, baseOptions, model } from "./_shared.js";
import { WEEKDAYS } from "../../lib/constants.js";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const BatchSchema = new Schema(
    {
        class: { type: ObjectId, ref: "Class", required: true },
        name: { type: String, required: true, trim: true, maxlength: 20 },
        schedule: {
            days: [{ type: String, enum: WEEKDAYS }],
            startTime: { type: String, match: HHMM, required: true },
            endTime: { type: String, match: HHMM, required: true },
        },
        room: { type: String, trim: true, maxlength: 80 },
        notes: { type: String, trim: true, maxlength: 500 },
        isActive: { type: Boolean, default: true },
    },
    baseOptions,
);
BatchSchema.index({ class: 1, name: 1 }, { unique: true });

export const Batch = model("Batch", BatchSchema, "batches");
