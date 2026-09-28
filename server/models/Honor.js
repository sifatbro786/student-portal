import "server-only";
import { Schema, ObjectId, baseOptions, model, FileRefSchema } from "./_shared.js";

const HonorEntrySchema = new Schema(
    {
        year: { type: Number, required: true, min: 2000, max: 2100 },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        photo: FileRefSchema, // own copy — independent of the student record (FR-HON-01)
        grade: { type: String, required: true, trim: true, maxlength: 4 },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        student: { type: ObjectId, ref: "Student" },
        school: { type: String, trim: true, maxlength: 200 },
        order: { type: Number, default: 0 },
        consentConfirmed: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: false },
    },
    baseOptions,
);
HonorEntrySchema.index({ year: -1, order: 1 });

const HonorYearSchema = new Schema(
    {
        year: { type: Number, required: true, unique: true },
        heading: { type: String, default: "Circle of Excellence", trim: true, maxlength: 120 },
        subheading: { type: String, trim: true, maxlength: 160 },
    },
    baseOptions,
);

export const HonorEntry = model("HonorEntry", HonorEntrySchema, "honorentries");
export const HonorYear = model("HonorYear", HonorYearSchema, "honoryears");
