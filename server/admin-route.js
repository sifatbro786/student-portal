import "server-only";
import { getCurrentUser } from "./auth/guards.js";
import { isSameOrigin, json } from "./http.js";
import { hit } from "./rate-limit.js";
import { readLimitedFormData } from "./storage/files.js";
import { pickForm } from "./action-utils.js";
import { ServiceError } from "./errors.js";
import { log } from "./log.js";

const HOUR = 60 * 60 * 1000;

/**
 * Admin multipart Route Handler wrapper (uploads are too big for Server Actions):
 * same-origin → admin session → upload rate limit (30/h, SEC-06) → capped body →
 * zod strict parse → handler. Returns JSON the client form understands.
 * @param {Request} request
 * @param {{ maxBytes: number, schema: import('zod').ZodType, fields: string[], context: string }} cfg
 * @param {(data: any, form: FormData, actor: { id: string, role: string }) => Promise<object>} handler
 */
export async function adminUpload(request, { maxBytes, schema, fields, context }, handler) {
    if (!isSameOrigin(request)) return json({ error: "Forbidden." }, 403);
    const user = await getCurrentUser();
    if (
        !user ||
        (user.role !== "admin" && user.role !== "super_admin") ||
        user.mustChangePassword
    ) {
        return json({ error: "Not found." }, 404);
    }
    if (!hit(`upload:${user.id}`, { limit: 30, windowMs: HOUR }).ok) {
        return json({ error: "Upload limit reached (30 per hour). Please try again later." }, 429);
    }
    let form;
    try {
        form = await readLimitedFormData(request, maxBytes);
    } catch (err) {
        const big = err instanceof ServiceError && err.code === "too_large";
        return json(
            {
                error: big
                    ? `File is too large (max ${Math.floor(maxBytes / 1048576)} MB).`
                    : "Could not read the upload.",
            },
            big ? 413 : 400,
        );
    }
    const parsed = schema.safeParse(pickForm(form, fields));
    if (!parsed.success) {
        const fieldErrors = {};
        for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
        return json({ error: "Please fix the highlighted fields.", fieldErrors }, 422);
    }
    try {
        return json({
            ok: true,
            ...(await handler(parsed.data, form, { id: user.id, role: user.role })),
        });
    } catch (err) {
        if (err instanceof ServiceError) {
            return json(
                {
                    error: err.message,
                    fieldErrors: err.field ? { [err.field]: err.message } : undefined,
                },
                422,
            );
        }
        log.error(`${context}.failed`, { err });
        return json({ error: "Something went wrong. Please try again." }, 500);
    }
}
