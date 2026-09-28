import "server-only";
import { Schema, ObjectId, baseOptions, model, FileRefSchema } from "./_shared.js";

const SubmissionSchema = new Schema(
    {
        assignment: { type: ObjectId, ref: "Assignment", required: true },
        student: { type: ObjectId, ref: "Student", required: true },
        files: [FileRefSchema],
        submittedAt: { type: Date, required: true },
        isLate: { type: Boolean, default: false },
        feedback: { type: String, trim: true, maxlength: 2000 },
        marks: { type: Number, min: 0 },
        reviewedBy: { type: ObjectId, ref: "User" },
        reviewedAt: Date,
    },
    baseOptions,
);
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
SubmissionSchema.index({ student: 1, submittedAt: -1 });

export const Submission = model("Submission", SubmissionSchema, "submissions");
