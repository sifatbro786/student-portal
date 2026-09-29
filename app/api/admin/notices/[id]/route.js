import { revalidateTag } from "next/cache";
import { adminUpload } from "@/server/admin-route.js";
import { json } from "@/server/http.js";
import { objectId } from "@/server/validators/common.js";
import { NOTICE_FIELDS, noticeSchema } from "@/server/validators/content.js";
import { NOTICE_ATTACHMENT_MAX, saveNotice } from "@/server/services/notices.js";
import { NOTICES_PUBLIC_TAG } from "@/server/services/site-public.js";

export const runtime = "nodejs";

export async function POST(request, { params }) {
    const id = objectId.safeParse((await params).id);
    if (!id.success) return json({ error: "Not found." }, 404);
    return adminUpload(
        request,
        {
            maxBytes: NOTICE_ATTACHMENT_MAX + 256 * 1024,
            schema: noticeSchema,
            fields: NOTICE_FIELDS,
            context: "notice.update",
        },
        async (data, form, actor) => {
            const res = await saveNotice(id.data, data, form.get("attachment"), actor);
            revalidateTag(NOTICES_PUBLIC_TAG, { expire: 0 }); // homepage + /notices
            return res;
        },
    );
}
