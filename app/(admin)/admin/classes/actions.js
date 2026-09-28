"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { classSchema, batchSchema } from "@/server/validators/academics.js";
import { objectId } from "@/server/validators/common.js";
import * as svc from "@/server/services/academics.js";

const ADMINS = ["super_admin", "admin"];
const CLASS_KEYS = ["name", "order", "isActive"];
const BATCH_KEYS = ["name", "days[]", "startTime", "endTime", "room", "notes", "isActive"];

// Public reads (admission form, P3) are cached under this tag.
const touch = () => {
    updateTag("academics");
    refresh();
};

export async function createClassAction(_prev, formData) {
    await requireAuth(ADMINS);
    const raw = pickForm(formData, CLASS_KEYS);
    const { data, state } = parseOrState(classSchema, raw);
    if (state) return state;
    try {
        await svc.createClass(data);
    } catch (err) {
        return errorState(err, "class.create", raw);
    }
    touch();
    return { ok: true, message: `${data.name} added.` };
}

export async function updateClassAction(id, _prev, formData) {
    await requireAuth(ADMINS);
    const raw = pickForm(formData, CLASS_KEYS);
    const { data, state } = parseOrState(classSchema, raw);
    if (state) return state;
    try {
        await svc.updateClass(objectId.parse(id), data);
    } catch (err) {
        return errorState(err, "class.update", raw);
    }
    touch();
    return { ok: true, message: "Class saved." };
}

export async function deleteClassAction(id, _prev) {
    await requireAuth(ADMINS);
    try {
        await svc.deleteClass(objectId.parse(id));
    } catch (err) {
        return errorState(err, "class.delete");
    }
    updateTag("academics");
    redirect("/admin/classes");
}

export async function createBatchAction(classId, _prev, formData) {
    await requireAuth(ADMINS);
    const raw = { ...pickForm(formData, BATCH_KEYS), class: classId };
    const { data, state } = parseOrState(batchSchema, raw);
    if (state) return state;
    try {
        await svc.createBatch(data);
    } catch (err) {
        return errorState(err, "batch.create", raw);
    }
    touch();
    return { ok: true, message: `Batch ${data.name} added.` };
}

export async function updateBatchAction(id, classId, _prev, formData) {
    await requireAuth(ADMINS);
    const raw = { ...pickForm(formData, BATCH_KEYS), class: classId };
    const { data, state } = parseOrState(batchSchema, raw);
    if (state) return state;
    try {
        await svc.updateBatch(objectId.parse(id), data);
    } catch (err) {
        return errorState(err, "batch.update", raw);
    }
    touch();
    return { ok: true, message: "Batch saved." };
}

export async function deleteBatchAction(id, classId, _prev) {
    await requireAuth(ADMINS);
    const cid = objectId.parse(classId);
    try {
        await svc.deleteBatch(objectId.parse(id));
    } catch (err) {
        return errorState(err, "batch.delete");
    }
    updateTag("academics");
    redirect(`/admin/classes/${cid}`);
}
