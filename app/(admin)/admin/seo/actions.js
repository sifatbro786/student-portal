"use server";

import { refresh, updateTag } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState } from "@/server/action-utils.js";
import { siteSeoSchema } from "@/server/validators/site.js";
import { SITE_TAG, saveSiteSeo } from "@/server/services/site-content.js";

/** Admin → SEO. One JSON payload; errors keyed by path, e.g. "pages.home.title". */
export async function saveSeoAction(_prev, formData) {
    const user = await requireAuth(["super_admin", "admin"]);
    const text = String(formData.get("payload") ?? "");
    if (text.length > 50_000) return { error: "The settings are too large." };
    let raw;
    try {
        raw = JSON.parse(text);
    } catch {
        return { error: "Could not read the form. Reload and try again." };
    }
    const parsed = siteSeoSchema.safeParse(raw);
    if (!parsed.success) {
        const fieldErrors = {};
        for (const i of parsed.error.issues) {
            // keyword errors ("pages.home.keywords.3") are shown on the keywords box
            const path = i.path.join(".").replace(/(keywords)\.\d+$/, "$1");
            fieldErrors[path || "_form"] ??= i.message;
        }
        return { error: "Please fix the highlighted fields.", fieldErrors };
    }
    try {
        await saveSiteSeo(parsed.data, { id: user.id, role: user.role });
    } catch (err) {
        return errorState(err, "site.seo_save");
    }
    updateTag(SITE_TAG);
    refresh();
    return { ok: true, message: "Saved — search engines see the new text on their next visit." };
}
