import "server-only";
import { Schema, ObjectId, model } from "./_shared.js";

const AuditLogSchema = new Schema(
    {
        actor: { type: ObjectId, ref: "User" },
        actorRole: String,
        action: { type: String, required: true },
        target: { type: { type: String }, id: String },
        meta: Schema.Types.Mixed, // never PII (FR-STU-08)
        ip: String, // hashed
        at: { type: Date, default: Date.now },
    },
    { versionKey: false },
);
AuditLogSchema.index({ at: -1 });
AuditLogSchema.index({ at: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60, name: "ttl_at" });

export const AuditLog = model("AuditLog", AuditLogSchema, "auditlogs");
