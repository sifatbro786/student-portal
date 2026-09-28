import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "../../lib/constants.js";
import { signSessionToken, verifySessionToken, sessionCookieOptions } from "./token.js";

/**
 * Issue (or re-issue) the session cookie. Server Actions / Route Handlers only.
 * @param {{ _id: unknown, role: string, tokenVersion: number }} user
 */
export async function createSession(user) {
    const token = await signSessionToken({
        sub: String(user._id),
        role: user.role,
        tv: user.tokenVersion,
    });
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function destroySession() {
    (await cookies()).delete(SESSION_COOKIE);
}

/** Signature/expiry check only — DB checks happen in guards.getCurrentUser. */
export async function readSession() {
    return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
