import "server-only";
import { createHmac } from "node:crypto";
import { LRUCache } from "lru-cache";

// In-process fixed-window limiter (SEC-06). Assumes ONE Next process
// (PM2 fork mode). With PM2 cluster mode each worker would count separately.

/** @type {LRUCache<string, { count: number, resetAt: number }>} */
const store =
    globalThis.__tmRateLimit ??
    (globalThis.__tmRateLimit = new LRUCache({ max: 20_000, ttlAutopurge: true }));

/**
 * Count one attempt against `key`.
 * @returns {{ ok: boolean, retryAfterSec: number }}
 */
export function hit(key, { limit, windowMs }) {
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
    entry.count += 1;
    store.set(key, entry, { ttl: entry.resetAt - now });
    return { ok: entry.count <= limit, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
}

/** True if `key` already used up `limit` in the current window (does not count). */
export function isLimited(key, { limit }) {
    const entry = store.get(key);
    return !!entry && entry.resetAt > Date.now() && entry.count >= limit;
}

export const resetLimit = (key) => store.delete(key);

/**
 * Client IP from the Nginx-set X-Real-IP header only (never X-Forwarded-For).
 * Port 3000 must not be publicly reachable, otherwise this header can be spoofed.
 * @param {Headers} h
 */
export function getClientIp(h) {
    const ip = h.get("x-real-ip")?.trim();
    if (!ip && process.env.NODE_ENV === "production" && !globalThis.__tmWarnedNoRealIp) {
        globalThis.__tmWarnedNoRealIp = true; // once per process
        console.warn(
            JSON.stringify({
                level: "warn",
                msg: "rate_limit.no_real_ip",
                at: new Date().toISOString(),
                detail: "X-Real-IP missing — all visitors share one rate-limit bucket. Run behind Nginx (deploy/nginx).",
            }),
        );
    }
    return ip || "unknown";
}

/** Keyed hash for storing IPs without keeping the raw value. */
export function hashIp(ip) {
    return createHmac("sha256", process.env.JWT_SECRET ?? "")
        .update(ip)
        .digest("hex")
        .slice(0, 32);
}
