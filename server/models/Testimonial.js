import "server-only";
import { Schema, ObjectId, baseOptions, model, FileRefSchema } from "./_shared.js";

// [P8 addition] Student reviews. Written by the student, shown on the homepage only
// after an admin approves them. One review per student (edit = resubmit for approval).
const TestimonialSchema = new Schema(
    {
        student: { type: ObjectId, ref: "Student", required: true, unique: true },
        name: { type: String, required: true, trim: true, maxlength: 80 }, // display name
        resultLine: { type: String, trim: true, maxlength: 60 }, // "A* · O Level 2026"
        quote: { type: String, required: true, trim: true, maxlength: 600 },
        rating: { type: Number, required: true, min: 1, max: 5 },
        // The student's upload stays PRIVATE (under their student folder) until approved;
        // approval copies it to public/testimonials/ and unapproval removes that copy.
        photo: FileRefSchema,
        publicPhoto: FileRefSchema,
        consent: { type: Boolean, required: true }, // student agreed to public display
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        statusNote: { type: String, trim: true, maxlength: 300 },
        isPinned: { type: Boolean, default: false },
        submittedAt: { type: Date, required: true },
        reviewedBy: { type: ObjectId, ref: "User" },
        reviewedAt: Date,
    },
    baseOptions,
);
TestimonialSchema.index({ status: 1, isPinned: -1, reviewedAt: -1 });

export const Testimonial = model("Testimonial", TestimonialSchema, "testimonials");
