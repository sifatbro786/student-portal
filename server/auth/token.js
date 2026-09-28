// Pure JWT helpers. Intentionally NOT marked 'server-only' because proxy.js
// imports it; it only reads the non-public JWT_SECRET, so a client bundle
// importing it by mistake would get `undefined` and throw — never leak.
import { SignJWT, jwtVerify } from "jose";
import { ROLES } from "../../lib/constants.js";

const ALG = "HS256";
const DAY = 24 * 60 * 60;
export const SESSION_TTL_SECONDS = 7 * DAY; // FR-AUTH-03
const REFRESH_WHEN_LEFT_SECONDS = 2 * DAY;

function secretKey() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("JWT_SECRET is missing or too short");
    return new TextEncoder().encode(secret);
}

/**
 * Payload is `{ sub, role, tv }` only (+ iat/exp).
 * @param {{ sub: string, role: string, tv: number }} p
 */
export function signSessionToken({ sub, role, tv }) {
    return new SignJWT({ role, tv })
        .setProtectedHeader({ alg: ALG })
        .setSubject(sub)
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
        .sign(secretKey());
}

/**
 * @param {string | undefined} token
 * @returns {Promise<{ sub: string, role: string, tv: number, exp: number } | null>}
 */
export async function verifySessionToken(token) {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
        const { sub, role, tv, exp } = payload;
        if (typeof sub !== "string" || !ROLES.includes(role) || !Number.isInteger(tv) || !exp)
            return null;
        return { sub, role, tv, exp };
    } catch {
        return null;
    }
}

/** Sliding refresh when < 2 days remain. @param {number} exp seconds */
export const needsRefresh = (exp) =>
    exp - Math.floor(Date.now() / 1000) < REFRESH_WHEN_LEFT_SECONDS;

export const sessionCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: /** @type {const} */ ("lax"),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
});
