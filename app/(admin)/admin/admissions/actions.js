"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { reviewSchema, verifyScoreSchema } from "@/server/validators/admissions.js";
import * as svc from "@/server/services/admissions.js";

const ADMINS = ["super_admin", "admin"];
const actorOf = (u) => ({ id: u.id, role: u.role });
const LABEL = { approved: "Approved.", rejected: "Rejected.", pending: "Moved back to pending." };

export async function reviewAdmissionAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["status", "note"]);
    const { data, state } = parseOrState(reviewSchema, raw);
    if (state) return state;
    try {
        await svc.reviewAdmission(objectId.parse(id), data, actorOf(user));
    } catch (err) {
        return errorState(err, "admission.review", raw);
    }
    refresh();
    return { ok: true, message: LABEL[data.status] };
}

export async function verifyScoreAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["scoreVerified"]);
    const { data, state } = parseOrState(verifyScoreSchema, raw);
    if (state) return state;
    try {
        await svc.verifyAdmissionScore(objectId.parse(id), data.scoreVerified, actorOf(user));
    } catch (err) {
        return errorState(err, "admission.verify_score", raw);
    }
    refresh();
    return { ok: true, message: "Verified score saved." };
}

export async function deleteAdmissionAction(id, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await svc.deleteAdmission(objectId.parse(id), actorOf(user));
    } catch (err) {
        return errorState(err, "admission.delete");
    }
    redirect("/admin/admissions?deleted=1");
}
