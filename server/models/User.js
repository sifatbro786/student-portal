import "server-only";
import { Schema, baseOptions, model } from "./_shared.js";
import { ROLES } from "../../lib/constants.js";

const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ROLES, required: true },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        isActive: { type: Boolean, default: true },
        tokenVersion: { type: Number, default: 0 },
        mustChangePassword: { type: Boolean, default: true },
        lastLoginAt: Date,
    },
    baseOptions,
);
UserSchema.index({ role: 1, isActive: 1 });

export const User = model("User", UserSchema, "users");
