import { z } from "zod";
import { isValidObjectId } from "mongoose";

export const objectId = z
    .string()
    .trim()
    .refine((v) => isValidObjectId(v) && /^[a-f\d]{24}$/i.test(v), "Invalid id");

export const optionalObjectId = z.preprocess(
    (v) => (v === "" ? undefined : v),
    objectId.optional(),
);

export const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.").max(254));

export const personName = z
    .string()
    .trim()
    .min(2, "Enter a name.")
    .max(120, "Name is too long.")
    .regex(/^[^\p{Cc}]+$/u, "Name contains invalid characters."); // no CR/LF etc.

/** "" → undefined for optional text inputs. */
export const optionalText = (max) =>
    z.preprocess(
        (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
        z.string().trim().max(max).optional(),
    );

/** FR-ADM-04: BD mobile, normalised to 8801XXXXXXXXX. */
export const bdPhone = z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(?:\+?88)?01[3-9]\d{8}$/.test(v), "Enter a valid Bangladeshi mobile number.")
    .transform((v) => `88${v.slice(v.indexOf("01"))}`);

export const optionalBdPhone = z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    bdPhone.optional(),
);

// bcrypt uses only the first 72 BYTES.
export const newPassword = z
    .string()
    .min(8, "Use at least 8 characters.")
    .refine(
        (v) => new TextEncoder().encode(v).length <= 72,
        "Password is too long (max 72 bytes).",
    );

/** Checkbox → boolean ("on" when checked, missing otherwise). */
export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** Escape a user string for use inside a RegExp (SEC-04). */
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** List query params (searchParams). Unknown keys are ignored here on purpose (URLs). */
export const listQuery = z.object({
    q: z.string().trim().max(100).optional().catch(undefined),
    page: z.coerce.number().int().min(1).max(10_000).catch(1),
    pageSize: z.coerce.number().int().min(1).max(100).catch(20),
});
