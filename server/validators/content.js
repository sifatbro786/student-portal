import { z } from "zod";
import { MATERIAL_TYPES } from "../../lib/constants.js";
import { fromDhakaLocal } from "../../lib/date.js";
import { checkbox, objectId, optionalText } from "./common.js";

const idList = z.array(objectId).max(100).default([]);
const dhakaDateTime = z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
        .string()
        .optional()
        .transform((v, ctx) => {
            if (v === undefined) return undefined;
            const d = fromDhakaLocal(v);
            if (!d) {
                ctx.addIssue({ code: "custom", message: "Enter a valid date and time." });
                return z.NEVER;
            }
            return d;
        }),
);

export const NOTICE_FIELDS = [
    "title",
    "body",
    "audience",
    "classes[]",
    "batches[]",
    "isPinned",
    "publishAt",
    "expiresAt",
    "emailAudience",
    "removeAttachment",
];

// FR-NOT-01
export const noticeSchema = z
    .strictObject({
        title: z.string().trim().min(3, "Enter a title.").max(200),
        body: z.string().max(50_000, "The notice is too long.").default(""),
        audience: z.enum(["public", "all_students", "class", "batches"]),
        classes: idList,
        batches: idList,
        isPinned: checkbox,
        publishAt: dhakaDateTime,
        expiresAt: dhakaDateTime,
        emailAudience: checkbox,
        removeAttachment: checkbox,
    })
    .refine((d) => !d.expiresAt || !d.publishAt || d.expiresAt > d.publishAt, {
        path: ["expiresAt"],
        message: "Expiry must be after the publish time.",
    });

export const MATERIAL_FIELDS = [
    "title",
    "description",
    "type",
    "audience",
    "classes[]",
    "batches[]",
    "isPublished",
];

// FR-MAT-01 (no "public" audience for materials)
export const materialSchema = z.strictObject({
    title: z.string().trim().min(3, "Enter a title.").max(200),
    description: optionalText(1000),
    type: z.enum(MATERIAL_TYPES),
    audience: z.enum(["all_students", "class", "batches"]),
    classes: idList,
    batches: idList,
    isPublished: checkbox,
});

export const contentListQuery = z.object({
    type: z.enum(MATERIAL_TYPES).catch("note"),
    audience: z.enum(["public", "all_students", "class", "batches", "all"]).catch("all"),
});
