"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { deleteMaterial, setMaterialPublished } from "@/server/services/materials.js";

const ADMINS = ["super_admin", "admin"];

export async function setMaterialPublishedAction(id, isPublished, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await setMaterialPublished(objectId.parse(id), isPublished === true, {
            id: user.id,
            role: user.role,
        });
    } catch (err) {
        return errorState(err, "material.publish");
    }
    refresh();
    return {
        ok: true,
        message: isPublished ? "Published — students can open it now." : "Hidden from students.",
    };
}

export async function deleteMaterialAction(id, type, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await deleteMaterial(objectId.parse(id), { id: user.id, role: user.role });
    } catch (err) {
        return errorState(err, "material.delete");
    }
    redirect(`/admin/materials?type=${encodeURIComponent(type)}&deleted=1`);
}
