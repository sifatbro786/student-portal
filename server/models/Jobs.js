import "server-only";
import { Schema, baseOptions, model } from "./_shared.js";

// Orphan file cleanup (PRD §6 delete semantics).
const PendingFileDeletionSchema = new Schema(
    {
        path: { type: String, required: true },
        attempts: { type: Number, default: 0 },
        lastError: String,
    },
    baseOptions,
);

// Non-blocking mail queue processed by scripts/cron.js (PRD §9).
const MailJobSchema = new Schema(
    {
        to: { type: [String], required: true },
        bcc: [String],
        template: { type: String, required: true },
        data: Schema.Types.Mixed,
        status: {
            type: String,
            enum: ["queued", "sending", "sent", "failed"],
            default: "queued",
        },
        attempts: { type: Number, default: 0 },
        nextAttemptAt: { type: Date, default: Date.now },
        lockedAt: Date,
        sentAt: Date,
        lastError: String,
    },
    baseOptions,
);
MailJobSchema.index({ status: 1, nextAttemptAt: 1 });

export const PendingFileDeletion = model(
    "PendingFileDeletion",
    PendingFileDeletionSchema,
    "pendingfiledeletions",
);
export const MailJob = model("MailJob", MailJobSchema, "mailjobs");
