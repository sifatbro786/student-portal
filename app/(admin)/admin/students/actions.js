"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import {
    changeBatchSchema,
    createStudentSchema,
    purgeStudentSchema,
    resetPasswordSchema,
    updateStudentSchema,
} from "@/server/validators/students.js";
import * as svc from "@/server/services/students.js";

const ADMINS = ["super_admin", "admin"];
const PROFILE_KEYS = [
    "fullName",
    "email",
    "whatsapp",
    "fatherName",
    "fatherPhone",
    "motherName",
    "motherPhone",
    "address",
    "institutionType",
    "institutionName",
];

const actorOf = (u) => ({ id: u.id, role: u.role });

export async function createStudentAction(_prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, [...PROFILE_KEYS, "class", "batch", "password"]);
    const { data, state } = parseOrState(createStudentSchema, raw);
    if (state) return state;
    let created;
    try {
        created = await svc.createStudent(data, actorOf(user));
    } catch (err) {
        return errorState(err, "student.create", raw);
    }
    redirect(`/admin/students/${created.id}?created=1`);
}

export async function updateStudentAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, PROFILE_KEYS);
    const { data, state } = parseOrState(updateStudentSchema, raw);
    if (state) return state;
    try {
        await svc.updateStudent(objectId.parse(id), data, actorOf(user));
    } catch (err) {
        return errorState(err, "student.update", raw);
    }
    refresh();
    return { ok: true, message: "Profile saved." };
}

export async function changeBatchAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["class", "batch", "reason"]);
    const { data, state } = parseOrState(changeBatchSchema, raw);
    if (state) return state;
    try {
        await svc.changeStudentBatch(objectId.parse(id), data, actorOf(user));
    } catch (err) {
        return errorState(err, "student.batch_change", raw);
    }
    refresh();
    return { ok: true, message: "Batch changed. It applies from the student’s next page load." };
}

export async function resetStudentPasswordAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["password"]);
    const { data, state } = parseOrState(resetPasswordSchema, raw);
    if (state) return state;
    try {
        await svc.resetStudentPassword(objectId.parse(id), data.password, actorOf(user));
    } catch (err) {
        return errorState(err, "student.password_reset");
    }
    refresh();
    return {
        ok: true,
        message:
            "Password reset. The student is signed out everywhere and must set a new password after signing in.",
    };
}

export async function setStudentActiveAction(id, active, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await svc.setStudentActive(objectId.parse(id), active === true, actorOf(user));
    } catch (err) {
        return errorState(err, "student.set_active");
    }
    refresh();
    return {
        ok: true,
        message: active ? "Student reactivated." : "Student deactivated and signed out.",
    };
}

export async function purgeStudentAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["confirmStudentId", "honorAction"]);
    const { data, state } = parseOrState(purgeStudentSchema, raw);
    if (state) return state;
    try {
        await svc.purgeStudent(objectId.parse(id), data, actorOf(user));
    } catch (err) {
        return errorState(err, "student.purge", raw);
    }
    redirect("/admin/students?purged=1");
}
