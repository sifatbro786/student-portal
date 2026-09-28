import "server-only";
import { Schema, ObjectId, baseOptions, model, FileRefSchema } from "./_shared.js";
import { AUDIENCES } from "../../lib/constants.js";

const NoticeSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        slug: { type: String, required: true, unique: true },
        body: { type: String, default: "" }, // sanitised HTML only (SEC-08)
        attachment: FileRefSchema,
        audience: { type: String, enum: AUDIENCES, required: true },
        classes: [{ type: ObjectId, ref: "Class" }],
        batches: [{ type: ObjectId, ref: "Batch" }],
        isPinned: { type: Boolean, default: false },
        publishAt: { type: Date, default: Date.now },
        expiresAt: Date,
        emailedAt: Date, // last "email this notice" broadcast (FR-NOT-04)
        createdBy: { type: ObjectId, ref: "User" },
    },
    baseOptions,
);
NoticeSchema.index({ audience: 1, publishAt: -1 });
NoticeSchema.index({ batches: 1, publishAt: -1 });
NoticeSchema.index({ classes: 1, publishAt: -1 });
NoticeSchema.index({ isPinned: -1, publishAt: -1 });

export const Notice = model("Notice", NoticeSchema, "notices");
