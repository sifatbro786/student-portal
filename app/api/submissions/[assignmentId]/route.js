import { connectDB } from "@/server/db.js";
import { findStudentScope } from "@/server/auth/guards.js";
import { drainBody, isSameOrigin, json } from "@/server/http.js";
import { hit } from "@/server/rate-limit.js";
import { ServiceError } from "@/server/errors.js";
import { log } from "@/server/log.js";
import { objectId } from "@/server/validators/common.js";
import { receiveFiles } from "@/server/storage/submissions.js";
import {
    getAssignmentForStudent,
    isSubmissionLocked,
    submissionWindow,
    submitAssignment,
} from "@/server/services/assignments.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MB = 1024 * 1024;
const HOUR = 60 * 60 * 1000;
const notFound = () => json({ error: "Not found." }, 404);
const closed = () =>
    json({ error: "The deadline has passed — submissions are closed.", code: "closed" }, 403);

const STATUS = {
    too_large: 413,
    too_many: 413,
    timeout: 408,
    not_found: 404,
    closed: 403,
    locked: 403,
};

/**
 * FR-ASG-03/04 — a student submits or re-submits files for one assignment.
 * Scope comes from the DB (findStudentScope), never the request. Server time decides lateness.
 */
export async function POST(request, { params }) {
    const receivedAt = new Date(); // authoritative submission time (FR-ASG-03)
    if (!isSameOrigin(request)) return json({ error: "Forbidden." }, 403);
    const id = objectId.safeParse((await params).assignmentId);
    if (!id.success) return notFound();

    await connectDB();
    const scope = await findStudentScope();
    if (!scope) return notFound();
    const a = await getAssignmentForStudent(id.data, scope);
    if (!a) return notFound(); // unpublished or another batch's — SEC-10

    const maxFileBytes = a.maxFileSizeMB * MB;
    const maxBody = a.maxFiles * maxFileBytes + MB;
    // Early answers still drain the (size-capped) body so the browser gets our JSON.
    if (!submissionWindow(a, receivedAt).open) {
        await drainBody(request, maxBody);
        return closed();
    }
    if (await isSubmissionLocked(a._id, scope)) {
        await drainBody(request, maxBody);
        return json(
            {
                error: "Your teacher has already reviewed this submission, so it can’t be changed any more.",
                code: "locked",
            },
            403,
        );
    }
    if (!hit(`upload:${scope.user.id}`, { limit: 30, windowMs: HOUR }).ok) {
        await drainBody(request, maxBody);
        return json({ error: "Upload limit reached (30 per hour). Please try again later." }, 429);
    }
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > maxBody) {
        return json(
            { error: `Too large: up to ${a.maxFiles} files of ${a.maxFileSizeMB} MB each.` },
            413,
        );
    }

    try {
        const staged = await receiveFiles(request, { maxFiles: a.maxFiles, maxFileBytes });
        const result = await submitAssignment(id.data, scope, staged, receivedAt);
        return json({ ok: true, ...result });
    } catch (err) {
        if (err instanceof ServiceError) {
            if (err.code === "not_found") return notFound();
            if (err.code === "closed") return closed();
            return json(
                {
                    error: err.message,
                    code: err.code,
                    fieldErrors: err.field ? { [err.field]: err.message } : undefined,
                },
                STATUS[err.code] ?? 422,
            );
        }
        log.error("submission.failed", { err });
        return json({ error: "Something went wrong. Please try again." }, 500);
    }
}
