import { adminUpload } from "@/server/admin-route.js";
import { MATERIAL_FIELDS, materialSchema } from "@/server/validators/content.js";
import { MATERIAL_MAX, saveMaterial } from "@/server/services/materials.js";

export const runtime = "nodejs";

export const POST = (request) =>
    adminUpload(
        request,
        {
            maxBytes: MATERIAL_MAX + 256 * 1024,
            schema: materialSchema,
            fields: MATERIAL_FIELDS,
            context: "material.create",
        },
        (data, form, actor) => saveMaterial(null, data, form.get("file"), actor),
    );
