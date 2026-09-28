"use server";

import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { loginSchema, changePasswordSchema } from "@/server/validators/auth.js";
import { authenticate, changeOwnPassword, revokeAllSessions } from "@/server/services/auth.js";
import { createSession, destroySession } from "@/server/auth/session.js";
import { requireAuth } from "@/server/auth/guards.js";
import { hit, isLimited, resetLimit, getClientIp, hashIp } from "@/server/rate-limit.js";
import { writeAudit } from "@/server/audit.js";
import { ServiceError } from "@/server/errors.js";
import { log } from "@/server/log.js";
import { ADMIN_ROLES, homeForRole } from "@/lib/constants.js";

const FIFTEEN_MIN = 15 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "Incorrect email or password.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Pull only the expected keys so .strict() never sees React's internal fields. */
const pick = (formData, keys) => Object.fromEntries(keys.map((k) => [k, formData.get(k) ?? ""]));

// ---------------------------------------------------------------- login (FR-AUTH-01, 09)
export async function loginAction(_prev, formData) {
    const raw = pick(formData, ["email", "password"]);
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success)
        return { error: "Enter your email and password.", email: String(raw.email) };

    const { email } = parsed.data;
    const ip = getClientIp(await headers());
    const limitKey = `login:${ip}:${email}`;

    if (isLimited(limitKey, { limit: 5 })) {
        return { error: "Too many attempts. Please wait 15 minutes and try again.", email };
    }

    let user;
    try {
        const result = await authenticate(parsed.data);
        if (!result.ok) {
            hit(limitKey, { limit: 5, windowMs: FIFTEEN_MIN });
            if (result.user && ADMIN_ROLES.includes(result.user.role)) {
                await writeAudit({
                    actor: String(result.user._id),
                    actorRole: result.user.role,
                    action: "auth.login_failed",
                    ip: hashIp(ip),
                });
            }
            return { error: GENERIC_LOGIN_ERROR, email };
        }
        user = result.user;
        resetLimit(limitKey);
        await createSession(user);
        if (ADMIN_ROLES.includes(user.role)) {
            await writeAudit({
                actor: String(user._id),
                actorRole: user.role,
                action: "auth.login",
                ip: hashIp(ip),
            });
        }
    } catch (err) {
        unstable_rethrow(err);
        log.error("auth.login_error", { err });
        return { error: GENERIC_ERROR, email };
    }

    redirect(user.mustChangePassword ? "/change-password" : homeForRole(user.role));
}

// ---------------------------------------------------------------- logout (FR-AUTH-10)
export async function logoutAction() {
    await destroySession();
    redirect("/login");
}

export async function logoutAllAction() {
    const user = await requireAuth(null, { allowPasswordChange: true });
    await revokeAllSessions(user.id);
    await destroySession();
    if (ADMIN_ROLES.includes(user.role)) {
        await writeAudit({ actor: user.id, actorRole: user.role, action: "auth.logout_all" });
    }
    redirect("/login");
}

// ---------------------------------------------------------------- change password (FR-AUTH-05, 07)
export async function changePasswordAction(_prev, formData) {
    const user = await requireAuth(null, { allowPasswordChange: true });

    // SEC-06: 5 attempts / 15 min per user.
    if (!hit(`pwchange:${user.id}`, { limit: 5, windowMs: FIFTEEN_MIN }).ok) {
        return { error: "Too many attempts. Please wait 15 minutes and try again." };
    }

    const parsed = changePasswordSchema.safeParse(
        pick(formData, ["currentPassword", "newPassword", "confirmPassword"]),
    );
    if (!parsed.success) {
        const fieldErrors = {};
        for (const issue of parsed.error.issues) fieldErrors[issue.path[0]] ??= issue.message;
        return { fieldErrors };
    }

    try {
        const updated = await changeOwnPassword(user.id, parsed.data);
        await createSession(updated); // re-issue with new tv → other devices are logged out
        await writeAudit({ actor: user.id, actorRole: user.role, action: "auth.password_changed" });
    } catch (err) {
        unstable_rethrow(err);
        if (err instanceof ServiceError) {
            return err.field
                ? { fieldErrors: { [err.field]: err.message } }
                : { error: err.message };
        }
        log.error("auth.change_password_error", { err });
        return { error: GENERIC_ERROR };
    }

    redirect(homeForRole(user.role));
}
