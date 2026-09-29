"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { REVIEW_FIELDS, reviewSchema } from "@/server/validators/assignments.js";
import {
    deleteAssignment,
    reviewSubmission,
    setAssignmentPublished,
} from "@/server/services/assignments.js";

const ADMINS = ["super_admin", "admin"];

export async function setAssignmentPublishedAction(id, isPublished, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await setAssignmentPublished(objectId.parse(id), isPublished === true, {
            id: user.id,
            role: user.role,
        });
    } catch (err) {
        return errorState(err, "assignment.publish");
    }
    refresh();
    return {
        ok: true,
        message: isPublished ? "Published — students can see it now." : "Hidden from students.",
    };
}

export async function deleteAssignmentAction(id, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await deleteAssignment(objectId.parse(id), { id: user.id, role: user.role });
    } catch (err) {
        return errorState(err, "assignment.delete");
    }
    redirect("/admin/assignments?deleted=1");
}

/** FR-ASG-06: feedback + marks for one submission. */
export async function reviewSubmissionAction(assignmentId, submissionId, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, REVIEW_FIELDS);
    const { data, state } = parseOrState(reviewSchema, raw);
    if (state) return state;
    try {
        await reviewSubmission(objectId.parse(assignmentId), objectId.parse(submissionId), data, {
            id: user.id,
            role: user.role,
        });
    } catch (err) {
        return errorState(err, "submission.review", raw);
    }
    refresh();
    return { ok: true, message: "Feedback saved." };
}
