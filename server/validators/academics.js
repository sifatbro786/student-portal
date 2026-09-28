import { z } from "zod";
import { WEEKDAYS } from "../../lib/constants.js";
import { checkbox, objectId, optionalText } from "./common.js";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h).");

export const classSchema = z.strictObject({
    name: z.string().trim().min(1, "Enter a class name.").max(60),
    order: z.coerce.number().int().min(0).max(999).default(0),
    isActive: checkbox,
});

export const batchSchema = z
    .strictObject({
        class: objectId,
        name: z
            .string()
            .trim()
            .toUpperCase()
            .min(1, "Enter a batch name.")
            .max(20)
            .regex(/^[A-Z0-9][A-Z0-9 -]*$/, "Use letters/numbers, e.g. A, B, C1."),
        days: z.array(z.enum(WEEKDAYS)).min(1, "Pick at least one day."),
        startTime: hhmm,
        endTime: hhmm,
        room: optionalText(80),
        notes: optionalText(500),
        isActive: checkbox,
    })
    .refine((d) => d.startTime < d.endTime, {
        path: ["endTime"],
        message: "End time must be after start time.",
    });
