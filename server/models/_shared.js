import "server-only";
import mongoose from "mongoose";

export const { Schema } = mongoose;
export const ObjectId = Schema.Types.ObjectId;

export const baseOptions = { timestamps: true, versionKey: false };

/** Reuse compiled model across dev HMR. */
export const model = (name, schema, collection) =>
    mongoose.models[name] ?? mongoose.model(name, schema, collection);

/** Embedded file reference. `key` is relative to UPLOAD_ROOT (PRD §6, §8). */
export const FileRefSchema = new Schema(
    {
        key: { type: String, required: true },
        originalName: { type: String, required: true, maxlength: 255 },
        mime: { type: String, required: true },
        size: { type: Number, required: true, min: 0 },
        sha256: { type: String, required: true },
    },
    { _id: false },
);

export const PersonSchema = new Schema(
    { name: { type: String, trim: true, maxlength: 120 }, phone: { type: String, trim: true } },
    { _id: false },
);

export const InstitutionSchema = new Schema(
    {
        type: { type: String, enum: ["school", "private"], required: true },
        name: { type: String, trim: true, maxlength: 200 },
    },
    { _id: false },
);
