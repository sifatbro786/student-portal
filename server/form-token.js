import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Anti-spam for public forms (replaces Turnstile, decided 2026-09-28):
// a signed render timestamp. Bots that post instantly or replay old pages fail.
const MIN_AGE_MS = 4_000;
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

const sign = (payload) =>
    createHmac("sha256", process.env.JWT_SECRET ?? "")
        .update(payload)
        .digest("base64url");

/** @param {string} purpose e.g. "admission" */
export function issueFormToken(purpose) {
    const ts = Date.now().toString(36);
    return `${ts}.${sign(`${purpose}:${ts}`)}`;
}

/** @returns {"ok" | "invalid" | "too_fast" | "expired"} */
export function checkFormToken(purpose, token) {
    const [ts, sig] = String(token ?? "").split(".");
    if (!ts || !sig) return "invalid";
    const expected = Buffer.from(sign(`${purpose}:${ts}`));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
    const age = Date.now() - parseInt(ts, 36);
    if (!Number.isFinite(age) || age < MIN_AGE_MS) return "too_fast";
    if (age > MAX_AGE_MS) return "expired";
    return "ok";
}
