import "server-only";
import { Schema, ObjectId, baseOptions, model, FileRefSchema } from "./_shared.js";
import { ASSIGNMENT_TYPES } from "../../lib/constants.js";

const AssignmentSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        instructions: { type: String, default: "" },
        type: { type: String, enum: ASSIGNMENT_TYPES, required: true },
        audience: { type: String, enum: ["class", "batches"], required: true },
        classes: [{ type: ObjectId, ref: "Class" }],
        batches: [{ type: ObjectId, ref: "Batch" }],
        attachment: FileRefSchema,
        deadline: { type: Date, required: true },
        allowLate: { type: Boolean, default: false },
        maxFiles: { type: Number, default: 5, min: 1, max: 10 },
        allowedTypes: { type: [String], default: ["pdf", "docx", "pptx", "jpg", "png", "webp"] },
        maxFileSizeMB: { type: Number, default: 20, min: 1, max: 20 },
        isPublished: { type: Boolean, default: false },
        createdBy: { type: ObjectId, ref: "User" },
    },
    baseOptions,
);
AssignmentSchema.index({ batches: 1, deadline: -1 });
AssignmentSchema.index({ classes: 1, deadline: -1 });

export const Assignment = model("Assignment", AssignmentSchema, "assignments");
