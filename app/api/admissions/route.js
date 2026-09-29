import { isSameOrigin, json } from "@/server/http.js";
import { getClientIp, hashIp, hit, isLimited } from "@/server/rate-limit.js";
import { readLimitedFormData } from "@/server/storage/files.js";
import { checkFormToken, issueFormToken } from "@/server/form-token.js";
import { pickForm } from "@/server/action-utils.js";
import { ADMISSION_FIELDS, admissionSchema } from "@/server/validators/admissions.js";
import { submitAdmission } from "@/server/services/admissions.js";
import { ServiceError } from "@/server/errors.js";
import { log } from "@/server/log.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;
const MAX_BODY = 4 * 1024 * 1024; // 3 MB photo + fields
const GENERIC = "We couldn’t submit your application. Please try again.";

// FR-ADM-01..07. Anti-spam without Turnstile: honeypot + signed render time + IP limits.
export async function POST(request) {
    if (!isSameOrigin(request)) return json({ error: GENERIC }, 403);

    const ip = getClientIp(request.headers);
    if (!hit(`adm-try:${ip}`, { limit: 20, windowMs: HOUR }).ok) {
        return json({ error: "Too many attempts. Please try again in an hour." }, 429);
    }
    if (isLimited(`adm-ok:${ip}`, { limit: 3 })) {
        return json(
            {
                error: "Several applications were already sent from this network. Please call the office if you need help.",
            },
            429,
        );
    }

    let form;
    try {
        form = await readLimitedFormData(request, MAX_BODY);
    } catch (err) {
        const tooBig = err instanceof ServiceError && err.code === "too_large";
        return json(
            { error: tooBig ? "The photo is too large (max 3 MB)." : GENERIC },
            tooBig ? 413 : 400,
        );
    }

    if (form.get("website")) return json({ error: GENERIC }, 400); // honeypot: humans never see it
    const token = checkFormToken("admission", form.get("formToken"));
    if (token === "too_fast") {
        return json(
            { error: "Please take a moment to check your details, then submit again." },
            400,
        );
    }
    if (token === "expired") {
        // Page left open for hours: hand back a fresh token so nothing typed is lost.
        return json(
            {
                error: "This page was open for a long time. Please check your details and press Submit again.",
                formToken: issueFormToken("admission"),
            },
            400,
        );
    }
    if (token !== "ok") {
        return json({ error: "This page has expired. Please reload it and submit again." }, 400);
    }

    const raw = pickForm(form, ADMISSION_FIELDS);
    const parsed = admissionSchema.safeParse(raw);
    if (!parsed.success) {
        const fieldErrors = {};
        for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
        return json({ error: "Please fix the highlighted fields.", fieldErrors }, 422);
    }

    try {
        const { refNo } = await submitAdmission(parsed.data, form.get("photo"), {
            ipHash: hashIp(ip),
            userAgent: request.headers.get("user-agent") ?? "",
        });
        hit(`adm-ok:${ip}`, { limit: 3, windowMs: HOUR });
        return json({ ok: true, refNo }, 201);
    } catch (err) {
        if (err instanceof ServiceError) {
            const status = err.code === "duplicate" ? 409 : 422;
            return json(
                {
                    error: err.message,
                    fieldErrors: err.field ? { [err.field]: err.message } : undefined,
                },
                status,
            );
        }
        log.error("admission.submit_failed", { err });
        return json({ error: GENERIC }, 500);
    }
}
