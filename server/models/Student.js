import "server-only";
import {
    Schema,
    ObjectId,
    baseOptions,
    model,
    FileRefSchema,
    PersonSchema,
    InstitutionSchema,
} from "./_shared.js";

const StudentSchema = new Schema(
    {
        user: { type: ObjectId, ref: "User", required: true, unique: true },
        studentId: { type: String, required: true, unique: true }, // TM-2026-0014
        fullName: { type: String, required: true, trim: true, maxlength: 120 },
        class: { type: ObjectId, ref: "Class", required: true },
        batch: { type: ObjectId, ref: "Batch", required: true },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        whatsapp: { type: String, required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        father: PersonSchema,
        mother: PersonSchema,
        address: { type: String, trim: true, maxlength: 500 },
        institution: InstitutionSchema,
        photo: FileRefSchema,
        admission: { type: ObjectId, ref: "Admission" },
        admittedAt: { type: Date, default: Date.now },
    },
    baseOptions,
);
StudentSchema.index({ batch: 1, status: 1 });
StudentSchema.index({ class: 1, status: 1 });
StudentSchema.index({ fullName: "text", studentId: "text", email: "text" });

export const Student = model("Student", StudentSchema, "students");
