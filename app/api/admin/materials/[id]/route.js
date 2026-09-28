import { adminUpload } from "@/server/admin-route.js";
import { json } from "@/server/http.js";
import { objectId } from "@/server/validators/common.js";
import { MATERIAL_FIELDS, materialSchema } from "@/server/validators/content.js";
import { MATERIAL_MAX, saveMaterial } from "@/server/services/materials.js";

export const runtime = "nodejs";

export async function POST(request, { params }) {
    const id = objectId.safeParse((await params).id);
    if (!id.success) return json({ error: "Not found." }, 404);
    return adminUpload(
        request,
        {
            maxBytes: MATERIAL_MAX + 256 * 1024,
            schema: materialSchema,
            fields: MATERIAL_FIELDS,
            context: "material.update",
        },
        (data, form, actor) => saveMaterial(id.data, data, form.get("file"), actor),
    );
}
