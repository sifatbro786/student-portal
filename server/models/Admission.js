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
import { ADMISSION_STATUSES } from "../../lib/constants.js";

const AdmissionSchema = new Schema(
    {
        refNo: { type: String, required: true, unique: true }, // ADM-2026-0042
        fullName: { type: String, required: true, trim: true, maxlength: 120 },
        class: { type: ObjectId, ref: "Class", required: true },
        institution: { type: InstitutionSchema, required: true },
        whatsapp: { type: String, required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        address: { type: String, required: true, trim: true, maxlength: 500 },
        father: PersonSchema,
        mother: PersonSchema,
        photo: { type: FileRefSchema, required: true },
        scoreSubmitted: { type: Number, required: true, min: 0, max: 100 },
        scoreVerified: { type: Number, min: 0, max: 100 },
        preferredBatch: { type: ObjectId, ref: "Batch" },
        status: { type: String, enum: ADMISSION_STATUSES, default: "pending" },
        statusNote: { type: String, trim: true, maxlength: 500 },
        reviewedBy: { type: ObjectId, ref: "User" },
        reviewedAt: Date,
        student: { type: ObjectId, ref: "Student" },
        meta: { ip: String /* hashed */, userAgent: { type: String, maxlength: 300 } },
    },
    baseOptions,
);
AdmissionSchema.index({ status: 1, createdAt: -1 });
AdmissionSchema.index({ email: 1, class: 1, status: 1 });
AdmissionSchema.index({ whatsapp: 1, class: 1, status: 1 });

export const Admission = model("Admission", AdmissionSchema, "admissions");
