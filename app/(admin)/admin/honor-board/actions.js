"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import {
    honorFromStudentSchema,
    honorOrderSchema,
    honorYearSchema,
} from "@/server/validators/honor.js";
import {
    HONOR_TAG,
    addHonorFromStudent,
    deleteHonorEntry,
    reorderHonor,
    saveHonorYear,
    setHonorPublished,
} from "@/server/services/honor.js";

const ADMINS = ["super_admin", "admin"];
const actorOf = (u) => ({ id: u.id, role: u.role });

export async function saveHonorYearAction(_prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["year", "heading", "subheading"]);
    const { data, state } = parseOrState(honorYearSchema, raw);
    if (state) return state;
    try {
        await saveHonorYear(data, actorOf(user));
    } catch (err) {
        return errorState(err, "honor.year", raw);
    }
    updateTag(HONOR_TAG);
    refresh();
    return { ok: true, message: "Heading saved." };
}

export async function addHonorFromStudentAction(_prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["year", "studentId", "grade", "percentage"]);
    const { data, state } = parseOrState(honorFromStudentSchema, raw);
    if (state) return state;
    let res;
    try {
        res = await addHonorFromStudent(data, actorOf(user));
    } catch (err) {
        return errorState(err, "honor.from_student", raw);
    }
    updateTag(HONOR_TAG);
    redirect(`/admin/honor-board/${res.id}?added=${res.hasPhoto ? "photo" : "1"}`);
}

/** Order comes as JSON in a hidden input (ids in display order). */
export async function reorderHonorAction(year, _prev, formData) {
    const user = await requireAuth(ADMINS);
    let ids;
    try {
        ids = JSON.parse(String(formData.get("ids") ?? "[]"));
    } catch {
        return { error: "Could not read the new order." };
    }
    const parsed = honorOrderSchema.safeParse({ year, ids });
    if (!parsed.success) return { error: "Could not read the new order." };
    try {
        await reorderHonor(parsed.data, actorOf(user));
    } catch (err) {
        return errorState(err, "honor.reorder");
    }
    updateTag(HONOR_TAG);
    refresh();
    return { ok: true, message: "Order saved." };
}

export async function setHonorPublishedAction(id, isPublished, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await setHonorPublished(objectId.parse(id), isPublished === true, actorOf(user));
    } catch (err) {
        return errorState(err, "honor.publish");
    }
    updateTag(HONOR_TAG);
    refresh();
    return { ok: true, message: isPublished ? "Published." : "Hidden from the website." };
}

export async function deleteHonorEntryAction(id, _prev) {
    const user = await requireAuth(ADMINS);
    let year;
    try {
        ({ year } = await deleteHonorEntry(objectId.parse(id), actorOf(user)));
    } catch (err) {
        return errorState(err, "honor.delete");
    }
    updateTag(HONOR_TAG);
    redirect(`/admin/honor-board?year=${year}&deleted=1`);
}
