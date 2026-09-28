"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { deleteNotice } from "@/server/services/notices.js";

export async function deleteNoticeAction(id, _prev) {
    const user = await requireAuth(["super_admin", "admin"]);
    try {
        await deleteNotice(objectId.parse(id), { id: user.id, role: user.role });
    } catch (err) {
        return errorState(err, "notice.delete");
    }
    redirect("/admin/notices?deleted=1");
}
