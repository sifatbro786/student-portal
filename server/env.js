import "server-only";
import { z } from "zod";

// Only the variables needed so far. Later phases extend this schema.
const schema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    APP_URL: z.url(),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
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
