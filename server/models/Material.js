import "server-only";
import { Schema, ObjectId, baseOptions, model, FileRefSchema } from "./_shared.js";
import { MATERIAL_TYPES } from "../../lib/constants.js";

const MaterialSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 1000 },
        type: { type: String, enum: MATERIAL_TYPES, required: true },
        audience: { type: String, enum: ["all_students", "class", "batches"], required: true },
        classes: [{ type: ObjectId, ref: "Class" }],
        batches: [{ type: ObjectId, ref: "Batch" }],
        file: { type: FileRefSchema, required: true },
        isPublished: { type: Boolean, default: false },
        createdBy: { type: ObjectId, ref: "User" },
    },
    baseOptions,
);
MaterialSchema.index({ type: 1, batches: 1, createdAt: -1 });
MaterialSchema.index({ type: 1, classes: 1, createdAt: -1 });

export const Material = model("Material", MaterialSchema, "materials");
