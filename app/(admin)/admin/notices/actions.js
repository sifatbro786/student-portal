"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { deleteNotice } from "@/server/services/notices.js";
import { NOTICES_PUBLIC_TAG } from "@/server/services/site-public.js";

export async function deleteNoticeAction(id, _prev) {
    const user = await requireAuth(["super_admin", "admin"]);
    try {
        await deleteNotice(objectId.parse(id), { id: user.id, role: user.role });
    } catch (err) {
        return errorState(err, "notice.delete");
    }
    updateTag(NOTICES_PUBLIC_TAG);
    redirect("/admin/notices?deleted=1");
}
