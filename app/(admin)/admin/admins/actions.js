"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import {
    adminPasswordSchema,
    createAdminSchema,
    updateAdminSchema,
} from "@/server/validators/admins.js";
import * as svc from "@/server/services/admins.js";

// Page-level guard is super_admin only; the service re-checks (FR-ADMN-02).
const actorOf = (u) => ({ id: u.id, role: u.role });

export async function createAdminAction(_prev, formData) {
    const user = await requireAuth(["super_admin"]);
    const raw = pickForm(formData, ["name", "email", "role", "password"]);
    const { data, state } = parseOrState(createAdminSchema, raw);
    if (state) return state;
    try {
        await svc.createAdmin(data, actorOf(user));
    } catch (err) {
        return errorState(err, "admin.create", raw);
    }
    refresh();
    return {
        ok: true,
        message: `${data.name} can now sign in. Share the temporary password in person.`,
    };
}

export async function updateAdminAction(id, _prev, formData) {
    const user = await requireAuth(["super_admin"]);
    const raw = pickForm(formData, ["name", "email", "role"]);
    const { data, state } = parseOrState(updateAdminSchema, raw);
    if (state) return state;
    try {
        await svc.updateAdmin(objectId.parse(id), data, actorOf(user));
    } catch (err) {
        return errorState(err, "admin.update", raw);
    }
    refresh();
    return { ok: true, message: "Saved." };
}

export async function resetAdminPasswordAction(id, _prev, formData) {
    const user = await requireAuth(["super_admin"]);
    const raw = pickForm(formData, ["password"]);
    const { data, state } = parseOrState(adminPasswordSchema, raw);
    if (state) return state;
    try {
        await svc.resetAdminPassword(objectId.parse(id), data.password, actorOf(user));
    } catch (err) {
        return errorState(err, "admin.password_reset");
    }
    return { ok: true, message: "Password reset. They are signed out everywhere." };
}

export async function setAdminActiveAction(id, active, _prev) {
    const user = await requireAuth(["super_admin"]);
    try {
        await svc.setAdminActive(objectId.parse(id), active === true, actorOf(user));
    } catch (err) {
        return errorState(err, "admin.set_active");
    }
    refresh();
    return { ok: true, message: active ? "Reactivated." : "Deactivated and signed out." };
}

export async function deleteAdminAction(id, _prev) {
    const user = await requireAuth(["super_admin"]);
    try {
        await svc.deleteAdmin(objectId.parse(id), actorOf(user));
    } catch (err) {
        return errorState(err, "admin.delete");
    }
    redirect("/admin/admins");
}
