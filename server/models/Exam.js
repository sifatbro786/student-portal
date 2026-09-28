import "server-only";
import { Schema, ObjectId, baseOptions, model } from "./_shared.js";
import { GRADES } from "../../lib/constants.js";

const ExamSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        class: { type: ObjectId, ref: "Class", required: true },
        batches: [{ type: ObjectId, ref: "Batch" }],
        date: { type: Date, required: true },
        fullMarks: { type: Number, required: true, min: 1 },
        isPublished: { type: Boolean, default: false },
        createdBy: { type: ObjectId, ref: "User" },
    },
    baseOptions,
);
ExamSchema.index({ class: 1, date: -1 });

const ResultEntrySchema = new Schema(
    {
        exam: { type: ObjectId, ref: "Exam", required: true },
        student: { type: ObjectId, ref: "Student", required: true },
        marks: { type: Number, required: true, min: 0 },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        grade: { type: String, enum: GRADES },
        remark: { type: String, trim: true, maxlength: 300 },
    },
    baseOptions,
);
ResultEntrySchema.index({ exam: 1, student: 1 }, { unique: true });
ResultEntrySchema.index({ student: 1 });

export const Exam = model("Exam", ExamSchema, "exams");
export const ResultEntry = model("ResultEntry", ResultEntrySchema, "resultentries");
