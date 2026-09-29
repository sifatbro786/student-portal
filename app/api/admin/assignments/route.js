import { adminUpload } from "@/server/admin-route.js";
import { ASSIGNMENT_FIELDS, assignmentSchema } from "@/server/validators/assignments.js";
import { ASSIGNMENT_ATTACHMENT_MAX, saveAssignment } from "@/server/services/assignments.js";

export const runtime = "nodejs";

export const POST = (request) =>
    adminUpload(
        request,
        {
            maxBytes: ASSIGNMENT_ATTACHMENT_MAX + 256 * 1024,
            schema: assignmentSchema,
            fields: ASSIGNMENT_FIELDS,
            context: "assignment.create",
        },
        (data, form, actor) => saveAssignment(null, data, form.get("attachment"), actor),
    );
