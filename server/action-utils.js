import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ServiceError } from "./errors.js";
import { log } from "./log.js";

/**
 * @typedef {{ ok?: boolean, message?: string, error?: string,
 *             fieldErrors?: Record<string, string>, values?: Record<string, unknown> }} ActionState
 */

/**
 * Read only the expected keys from FormData, so zod `.strictObject()` never
 * sees React's internal `$ACTION_*` fields. Keys ending in `[]` are read with getAll().
 * @param {FormData} formData
 * @param {string[]} keys
 */
export function pickForm(formData, keys) {
    const out = {};
    for (const k of keys) {
        if (k.endsWith("[]")) out[k.slice(0, -2)] = formData.getAll(k).map(String);
        else {
            const v = formData.get(k);
            if (v !== null) out[k] = typeof v === "string" ? v : "";
        }
    }
    return out;
}

/** zod safeParse → { data } | { state } with first message per field. */
export function parseOrState(schema, raw) {
    const parsed = schema.safeParse(raw);
    if (parsed.success) return { data: parsed.data };
    const fieldErrors = {};
    for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_form");
        fieldErrors[key] ??= issue.message;
    }
    return {
        state: {
            error: "Please fix the highlighted fields.",
            fieldErrors,
            values: stripSecrets(raw),
        },
    };
}

/** Map a thrown error to a user-safe state (SEC-09). Re-throws Next redirects/notFound. */
export function errorState(err, context, raw) {
    unstable_rethrow(err);
    if (err instanceof ServiceError) {
        return err.field
            ? {
                  error: err.message,
                  fieldErrors: { [err.field]: err.message },
                  values: stripSecrets(raw),
              }
            : { error: err.message, values: stripSecrets(raw) };
    }
    log.error(`${context}.failed`, { err });
    return { error: "Something went wrong. Please try again.", values: stripSecrets(raw) };
}

function stripSecrets(raw) {
    if (!raw) return undefined;
    const { password, confirmStudentId, ...rest } = raw;
    return rest;
}
