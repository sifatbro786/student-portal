"use server";

import { refresh, updateTag } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState } from "@/server/action-utils.js";
import { siteContentSchema } from "@/server/validators/site.js";
import { SITE_TAG, removeHeroPhoto, saveSiteContent } from "@/server/services/site-content.js";

const ADMINS = ["super_admin", "admin"];
const actorOf = (u) => ({ id: u.id, role: u.role });

/** The CMS form posts one JSON payload (nested lists). Errors come back keyed by path, e.g. "campuses.0.mapUrl". */
export async function saveSiteContentAction(_prev, formData) {
    const user = await requireAuth(ADMINS);
    const text = String(formData.get("payload") ?? "");
    if (text.length > 200_000) return { error: "The content is too large." };
    let raw;
    try {
        raw = JSON.parse(text);
    } catch {
        return { error: "Could not read the form. Reload and try again." };
    }
    const parsed = siteContentSchema.safeParse(raw);
    if (!parsed.success) {
        const fieldErrors = {};
        for (const i of parsed.error.issues) fieldErrors[i.path.join(".") || "_form"] ??= i.message;
        return { error: "Please fix the highlighted fields.", fieldErrors };
    }
    try {
        await saveSiteContent(parsed.data, actorOf(user));
    } catch (err) {
        return errorState(err, "site.save");
    }
    updateTag(SITE_TAG);
    refresh();
    return { ok: true, message: "Saved — the website is updated." };
}

export async function removeHeroPhotoAction(_prev) {
    const user = await requireAuth(ADMINS);
    try {
        await removeHeroPhoto(actorOf(user));
    } catch (err) {
        return errorState(err, "site.hero_photo_remove");
    }
    updateTag(SITE_TAG);
    refresh();
    return { ok: true, message: "Photo removed — the default portrait is shown." };
}
