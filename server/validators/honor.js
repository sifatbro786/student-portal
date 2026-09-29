import { z } from "zod";
import { GRADES, STUDENT_ID_RE } from "../../lib/constants.js";
import { checkbox, objectId, optionalText } from "./common.js";

// Honor Board (FR-HON)
const year = z.coerce
    .number({ error: "Enter a year." })
    .int()
    .min(2000, "Year looks wrong.")
    .max(2100, "Year looks wrong.");
const percentage = z.coerce
    .number({ error: "Enter the percentage." })
    .min(0, "0–100.")
    .max(100, "0–100.")
    .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, "Use at most 2 decimals.");

export const HONOR_FIELDS = [
    "year",
    "name",
    "grade",
    "percentage",
    "school",
    "consentConfirmed",
    "isPublished",
    "removePhoto",
];

export const honorEntrySchema = z.strictObject({
    year,
    name: z
        .string()
        .trim()
        .min(2, "Enter the name.")
        .max(120)
        .regex(/^[^\p{Cc}<>]+$/u, "Name contains invalid characters."),
    grade: z.enum(GRADES, { error: "Pick a grade." }),
    percentage,
    school: optionalText(200),
    consentConfirmed: checkbox,
    isPublished: checkbox,
    removePhoto: checkbox,
});

export const honorFromStudentSchema = z.strictObject({
    year,
    studentId: z
        .string()
        .trim()
        .toUpperCase()
        .regex(STUDENT_ID_RE, "Enter a student ID like TM-2026-0014."),
    grade: z.enum(GRADES, { error: "Pick a grade." }),
    percentage,
});

export const honorYearSchema = z.strictObject({
    year,
    heading: z.string().trim().min(2, "Enter a heading.").max(120),
    subheading: optionalText(160),
});

export const honorOrderSchema = z.strictObject({
    year,
    ids: z.array(objectId).min(1).max(500),
});
