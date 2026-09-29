"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { galleryEditSchema, galleryOrderSchema } from "@/server/validators/site.js";
import {
    GALLERY_TAG,
    deleteGalleryImage,
    removeGalleryPlaceholders,
    reorderGallery,
    updateGalleryImage,
} from "@/server/services/gallery.js";

const ADMINS = ["super_admin", "admin"];
const actorOf = (u) => ({ id: u.id, role: u.role });

export async function updateGalleryAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = {
        id,
        ...pickForm(formData, [
            "category",
            "caption",
            "alt",
            "isFeatured",
            "consentConfirmed",
            "isPublished",
        ]),
    };
    const { data, state } = parseOrState(galleryEditSchema, raw);
    if (state) return state;
    try {
        await updateGalleryImage(data, actorOf(user));
    } catch (err) {
        return errorState(err, "gallery.update", raw);
    }
    updateTag(GALLERY_TAG);
    redirect("/admin/gallery?saved=1");
}

export async function deleteGalleryAction(id, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await deleteGalleryImage(objectId.parse(id), actorOf(user));
    } catch (err) {
        return errorState(err, "gallery.delete");
    }
    updateTag(GALLERY_TAG);
    redirect("/admin/gallery?deleted=1");
}

export async function reorderGalleryAction(_prev, formData) {
    const user = await requireAuth(ADMINS);
    let ids;
    try {
        ids = JSON.parse(String(formData.get("ids") ?? "[]"));
    } catch {
        return { error: "Could not read the new order." };
    }
    const parsed = galleryOrderSchema.safeParse({ ids });
    if (!parsed.success) return { error: "Could not read the new order." };
    try {
        await reorderGallery(parsed.data, actorOf(user));
    } catch (err) {
        return errorState(err, "gallery.reorder");
    }
    updateTag(GALLERY_TAG);
    refresh();
    return { ok: true, message: "Order saved." };
}

/** Remove every stock placeholder (seeded by `npm run seed:gallery`). */
export async function removePlaceholdersAction(_prev) {
    const user = await requireAuth(ADMINS);
    try {
        await removeGalleryPlaceholders(actorOf(user));
    } catch (err) {
        return errorState(err, "gallery.placeholders");
    }
    updateTag(GALLERY_TAG);
    refresh();
    return { ok: true, message: "Placeholder photos removed." };
}
