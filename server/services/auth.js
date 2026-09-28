import "server-only";
import { connectDB } from "../db.js";
import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { ServiceError } from "../errors.js";

/**
 * @param {{ email: string, password: string }} input already zod-validated
 * @returns {Promise<{ ok: true, user: any } | { ok: false, user: any | null }>}
 */
export async function authenticate({ email, password }) {
    await connectDB();
    const user = await User.findOne({ email })
        .select("+passwordHash role name isActive tokenVersion mustChangePassword")
        .lean();

    const valid = await verifyPassword(password, user?.passwordHash);
    if (!user || !valid || !user.isActive) return { ok: false, user: user ?? null };

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    delete user.passwordHash;
    return { ok: true, user };
}

/**
 * FR-AUTH-05: verify current, set new, clear mustChangePassword, bump tokenVersion.
 * @returns {Promise<{ _id: any, role: string, tokenVersion: number }>}
 */
export async function changeOwnPassword(userId, { currentPassword, newPassword }) {
    await connectDB();
    const user = await User.findById(userId).select("+passwordHash isActive").lean();
    if (!user || !user.isActive) throw new ServiceError("not_found", "Account not found.");

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        throw new ServiceError("bad_password", "Current password is incorrect.", "currentPassword");
    }
    if (await verifyPassword(newPassword, user.passwordHash)) {
        throw new ServiceError(
            "same_password",
            "New password must be different from the current one.",
            "newPassword",
        );
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updateOne(
        { _id: userId },
        { $set: { passwordHash, mustChangePassword: false }, $inc: { tokenVersion: 1 } },
    );
    // Read back the bumped version to re-issue this device's cookie.
    return User.findById(userId).select("role tokenVersion").lean();
}

/** FR-AUTH-10: invalidate every session of this user. */
export async function revokeAllSessions(userId) {
    await connectDB();
    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}
