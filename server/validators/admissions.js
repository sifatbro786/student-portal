import { z } from "zod";
import { bdPhone, email, objectId, optionalObjectId, optionalText, personName } from "./common.js";

// FR-ADM-02. Honeypot/token fields are checked separately, before this schema.
export const admissionSchema = z
    .strictObject({
        fullName: personName,
        class: objectId,
        preferredBatch: optionalObjectId,
        institutionType: z.enum(["school", "private"], { error: "Choose school or private." }),
        institutionName: optionalText(200),
        whatsapp: bdPhone,
        email,
        address: z.string().trim().min(5, "Enter your address.").max(500),
        fatherName: personName,
        fatherPhone: bdPhone,
        motherName: personName,
        motherPhone: bdPhone,
        score: z
            .string()
            .trim()
            .regex(/^\d{1,3}(\.\d{1,2})?$/, "Enter a number like 78 or 78.5.")
            .transform(Number)
            .refine((n) => n >= 0 && n <= 100, "Score must be between 0 and 100."),
        consent: z.literal("on", { error: "Please confirm the information is correct." }),
    })
    .refine((d) => d.institutionType !== "school" || !!d.institutionName, {
        path: ["institutionName"],
        message: "Enter your school name.",
    });

export const ADMISSION_FIELDS = [
    "fullName",
    "class",
    "preferredBatch",
    "institutionType",
    "institutionName",
    "whatsapp",
    "email",
    "address",
    "fatherName",
    "fatherPhone",
    "motherName",
    "motherPhone",
    "score",
    "consent",
];

export const reviewSchema = z.strictObject({
    status: z.enum(["pending", "approved", "rejected"]),
    note: optionalText(500),
});

export const verifyScoreSchema = z.strictObject({
    scoreVerified: z
        .string()
        .trim()
        .regex(/^\d{1,3}(\.\d{1,2})?$/, "Enter a number like 78 or 78.5.")
        .transform(Number)
        .refine((n) => n <= 100, "Score must be between 0 and 100."),
});

export const admissionListQuery = z.object({
    status: z.enum(["pending", "approved", "rejected", "all"]).catch("pending"),
    class: objectId.optional().catch(undefined),
    from: z.iso.date().optional().catch(undefined),
    to: z.iso.date().optional().catch(undefined),
});
