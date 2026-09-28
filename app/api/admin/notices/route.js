import { adminUpload } from "@/server/admin-route.js";
import { NOTICE_FIELDS, noticeSchema } from "@/server/validators/content.js";
import { NOTICE_ATTACHMENT_MAX, saveNotice } from "@/server/services/notices.js";

export const runtime = "nodejs";

export const POST = (request) =>
    adminUpload(
        request,
        {
            maxBytes: NOTICE_ATTACHMENT_MAX + 256 * 1024,
            schema: noticeSchema,
            fields: NOTICE_FIELDS,
            context: "notice.create",
        },
        (data, form, actor) => saveNotice(null, data, form.get("attachment"), actor),
    );
