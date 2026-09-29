"use server";

import { refresh, updateTag } from "next/cache";
import { getStudentScope } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { hit } from "@/server/rate-limit.js";
import { TESTIMONIAL_FIELDS, testimonialSchema } from "@/server/validators/site.js";
import {
    TESTIMONIAL_PHOTO_MAX,
    TESTIMONIAL_TAG,
    deleteOwnTestimonial,
    saveOwnTestimonial,
} from "@/server/services/testimonials.js";

const HOUR = 60 * 60 * 1000;

export async function saveReviewAction(_prev, formData) {
    const scope = await getStudentScope(); // student role + active record (else 404)
    const raw = pickForm(formData, TESTIMONIAL_FIELDS);
    if (!hit(`review:${scope.studentId}`, { limit: 10, windowMs: HOUR }).ok) {
        return { error: "Too many changes in a short time. Try again in an hour.", values: raw };
    }
    const { data, state } = parseOrState(testimonialSchema, raw);
    if (state) return state;
    const file = formData.get("photo");
    // Client rule: ≤ 1 MB. Checked here too (saveImage re-checks and verifies magic bytes).
    if (file && typeof file !== "string" && file.size > TESTIMONIAL_PHOTO_MAX) {
        return {
            error: "Please fix the highlighted fields.",
            fieldErrors: { photo: "Photo must be 1 MB or smaller." },
            values: raw,
        };
    }
    let res;
    try {
        res = await saveOwnTestimonial(scope, data, file);
    } catch (err) {
        return errorState(err, "review.save", raw);
    }
    if (res.wasApproved) updateTag(TESTIMONIAL_TAG); // it left the homepage until re-approved
    refresh();
    return { ok: true, message: "Thank you! Your review was sent for approval." };
}

export async function deleteReviewAction(_prev) {
    const scope = await getStudentScope();
    let res;
    try {
        res = await deleteOwnTestimonial(scope);
    } catch (err) {
        return errorState(err, "review.delete");
    }
    if (res.wasApproved) updateTag(TESTIMONIAL_TAG);
    refresh();
    return { ok: true, message: "Your review was deleted." };
}
