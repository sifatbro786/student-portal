import "server-only";
import path from "node:path";
import { z } from "zod";

// Only the variables needed so far. Later phases extend this schema.
const schema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    APP_URL: z.url(),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    // PRD §8: absolute and OUTSIDE the project, so builds/deploys never touch uploads
    // and nothing private is ever reachable through Next's public/ folder.
    UPLOAD_ROOT: z
        .string()
        .min(1)
        .refine((p) => path.isAbsolute(p), "UPLOAD_ROOT must be an absolute path")
        .refine((p) => {
            const rel = path.relative(process.cwd(), path.resolve(p));
            return rel.startsWith("..") || path.isAbsolute(rel);
        }, "UPLOAD_ROOT must be outside the project directory"),
    // Public files (honor photos) are served by Nginx at this path (PRD §8, §16).
    PUBLIC_MEDIA_BASE: z
        .string()
        .regex(/^\/[a-z0-9/_-]*$/i)
        .default("/media")
        .transform((v) => v.replace(/\/+$/, "")),
    // Mail (PRD §9). Optional in development: without SMTP the worker logs mails instead.
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().default(465),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    ADMIN_NOTIFY_EMAILS: z
        .string()
        .optional()
        .transform((v) =>
            (v ?? "")
                .split(",")
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean),
        ),
});

let cached;

/**
 * Validated env, parsed lazily so `next build` does not require runtime secrets.
 * @returns {z.infer<typeof schema>}
 */
export function env() {
    if (cached) return cached;
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
        const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
        throw new Error(`Invalid environment variables: ${keys}`);
    }
    cached = parsed.data;
    return cached;
}

export const isProd = () => process.env.NODE_ENV === "production";

/**
 * Called once when the web server boots (instrumentation.js). Invalid env → the process
 * exits now with a clear message instead of failing on the first request. In production
 * it also warns about settings that silently break features.
 */
export function checkEnvAtBoot() {
    const e = env(); // throws with the list of bad keys
    if (!isProd()) return;
    const warn = (msg) =>
        console.warn(
            JSON.stringify({
                level: "warn",
                msg: "env.warning",
                at: new Date().toISOString(),
                detail: msg,
            }),
        );
    if (!e.APP_URL.startsWith("https://"))
        warn("APP_URL is not https:// — canonical URLs, sitemap and emails will use http.");
    if (!e.SMTP_HOST || !e.SMTP_USER || !e.SMTP_PASS)
        warn("SMTP is not configured — emails are only logged, never sent.");
    if (e.ADMIN_NOTIFY_EMAILS.length === 0)
        warn("ADMIN_NOTIFY_EMAILS is empty — nobody receives admission alerts.");
    if (process.env.MONGO_TRANSACTIONS === "off")
        warn("MONGO_TRANSACTIONS=off is ignored in production (a replica set is required).");
}
