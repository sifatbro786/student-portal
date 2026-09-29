import { z } from "zod";
import { ASSIGNMENT_TYPES, SUBMISSION_FILE_TYPES } from "../../lib/constants.js";
import { fromDhakaLocal } from "../../lib/date.js";
import { checkbox, objectId, optionalText } from "./common.js";

const idList = z.array(objectId).max(100).default([]);

/** Integer form field with a default when left empty. */
const intField = (min, max, fallback, label) =>
    z.preprocess(
        (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
        z.coerce
            .number({ error: `Enter ${label}.` })
            .int(`Enter a whole number for ${label}.`)
            .min(min, `${label[0].toUpperCase()}${label.slice(1)} must be at least ${min}.`)
            .max(max, `${label[0].toUpperCase()}${label.slice(1)} can be at most ${max}.`)
            .default(fallback),
    );

export const ASSIGNMENT_FIELDS = [
    "title",
    "instructions",
    "type",
    "audience",
    "classes[]",
    "batches[]",
    "deadline",
    "allowLate",
    "maxFiles",
    "maxFileSizeMB",
    "allowedTypes[]",
    "isPublished",
    "removeAttachment",
];

// FR-ASG-01. Deadline is entered in Dhaka time and stored as UTC.
export const assignmentSchema = z.strictObject({
    title: z.string().trim().min(3, "Enter a title.").max(200),
    instructions: z.string().max(50_000, "The instructions are too long.").default(""),
    type: z.enum(ASSIGNMENT_TYPES, { error: "Pick a type." }),
    audience: z.enum(["class", "batches"], { error: "Pick classes or batches." }),
    classes: idList,
    batches: idList,
    deadline: z.string({ error: "Set a deadline." }).transform((v, ctx) => {
        const d = fromDhakaLocal(v);
        if (!d) {
            ctx.addIssue({ code: "custom", message: "Set a valid deadline (date and time)." });
            return z.NEVER;
        }
        return d;
    }),
    allowLate: checkbox,
    maxFiles: intField(1, 10, 5, "the number of files"),
    maxFileSizeMB: intField(1, 20, 20, "the size limit"),
    allowedTypes: z
        .array(z.enum(SUBMISSION_FILE_TYPES))
        .min(1, "Allow at least one file type.")
        .max(SUBMISSION_FILE_TYPES.length)
        .transform((a) => [...new Set(a)]),
    isPublished: checkbox,
    removeAttachment: checkbox,
});

export const REVIEW_FIELDS = ["feedback", "marks"];

// FR-ASG-06: optional feedback text + marks (≥ 0, up to 2 decimals).
export const reviewSchema = z.strictObject({
    feedback: optionalText(2000),
    marks: z.preprocess(
        (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
        z.coerce
            .number({ error: "Enter a number." })
            .min(0, "Marks can’t be negative.")
            .max(1000, "Marks look too high.")
            .refine(
                (n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6,
                "Use at most 2 decimals.",
            )
            .optional(),
    ),
});

export const assignmentListQuery = z.object({
    status: z.enum(["all", "open", "closed", "draft"]).catch("all"),
});
