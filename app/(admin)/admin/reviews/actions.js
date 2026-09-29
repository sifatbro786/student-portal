"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { testimonialModerationSchema } from "@/server/validators/site.js";
import {
    TESTIMONIAL_TAG,
    deleteTestimonial,
    moderateTestimonial,
} from "@/server/services/testimonials.js";

const ADMINS = ["super_admin", "admin"];
const actorOf = (u) => ({ id: u.id, role: u.role });

export async function moderateReviewAction(_prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, [
        "id",
        "decision",
        "version",
        "name",
        "resultLine",
        "quote",
        "statusNote",
        "isPinned",
    ]);
    const { data, state } = parseOrState(testimonialModerationSchema, raw);
    if (state) return state;
    try {
        await moderateTestimonial(data, actorOf(user));
    } catch (err) {
        return errorState(err, "review.moderate", raw);
    }
    updateTag(TESTIMONIAL_TAG);
    // The card usually moves to another tab, so confirm at page level.
    const tab = ["pending", "approved", "rejected"].includes(formData.get("tab"))
        ? formData.get("tab")
        : "pending";
    redirect(`/admin/reviews?status=${tab}&done=${data.decision}`);
}

export async function deleteReviewAdminAction(id, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await deleteTestimonial(objectId.parse(id), actorOf(user));
    } catch (err) {
        return errorState(err, "review.delete");
    }
    updateTag(TESTIMONIAL_TAG);
    refresh();
    return { ok: true, message: "Review deleted." };
}
