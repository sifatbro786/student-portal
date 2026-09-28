import "server-only";
import path from "node:path";
import { env } from "../env.js";
import { STUDENT_ID_RE } from "../../lib/constants.js";

/** Absolute, normalised UPLOAD_ROOT. */
export const uploadRoot = () => path.resolve(env().UPLOAD_ROOT);

/**
 * Resolve a stored key (relative, forward slashes) to an absolute path and
 * assert it stays inside UPLOAD_ROOT (PRD §8 path safety).
 * @param {string} key
 */
export function resolveKey(key) {
    const root = uploadRoot();
    const abs = path.resolve(root, key);
    if (!key || abs === root || !abs.startsWith(root + path.sep)) {
        throw new Error("Unsafe storage key");
    }
    return abs;
}

/** `private/students/<studentId>` — the whole folder is removed on purge. */
export function studentFolderKey(studentId) {
    if (!STUDENT_ID_RE.test(studentId)) throw new Error("Invalid studentId");
    return `private/students/${studentId}`;
}

/** `private/admissions/<refNo>` */
export function admissionFolderKey(refNo) {
    if (!/^ADM-\d{4}-\d{4,}$/.test(refNo)) throw new Error("Invalid refNo");
    return `private/admissions/${refNo}`;
}
