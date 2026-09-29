import { adminUpload } from "@/server/admin-route.js";
import { json } from "@/server/http.js";
import { objectId } from "@/server/validators/common.js";
import { ASSIGNMENT_FIELDS, assignmentSchema } from "@/server/validators/assignments.js";
import { ASSIGNMENT_ATTACHMENT_MAX, saveAssignment } from "@/server/services/assignments.js";

export const runtime = "nodejs";

export async function POST(request, { params }) {
    const id = objectId.safeParse((await params).id);
    if (!id.success) return json({ error: "Not found." }, 404);
    return adminUpload(
        request,
        {
            maxBytes: ASSIGNMENT_ATTACHMENT_MAX + 256 * 1024,
            schema: assignmentSchema,
            fields: ASSIGNMENT_FIELDS,
            context: "assignment.update",
        },
        (data, form, actor) => saveAssignment(id.data, data, form.get("attachment"), actor),
    );
}
