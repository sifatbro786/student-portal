import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

// bcrypt only uses the first 72 BYTES of a password.
const newPassword = z
    .string()
    .min(8, "Use at least 8 characters.")
    .refine(
        (v) => new TextEncoder().encode(v).length <= 72,
        "Password is too long (max 72 bytes).",
    );

export const loginSchema = z.strictObject({
    email,
    password: z.string().min(1).max(200),
});

export const changePasswordSchema = z
    .strictObject({
        currentPassword: z.string().min(1, "Enter your current password.").max(200),
        newPassword,
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match.",
    })
    .refine((d) => d.newPassword !== d.currentPassword, {
        path: ["newPassword"],
        message: "New password must be different from the current one.",
    });
