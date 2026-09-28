import "server-only";
import { Schema, baseOptions, model } from "./_shared.js";

const ClassSchema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    baseOptions,
);

// "Class" is a reserved word in JS, hence ClassModel.
export const ClassModel = model("Class", ClassSchema, "classes");
