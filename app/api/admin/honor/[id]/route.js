import { revalidateTag } from "next/cache";
import { adminUpload } from "@/server/admin-route.js";
import { json } from "@/server/http.js";
import { objectId } from "@/server/validators/common.js";
import { HONOR_FIELDS, honorEntrySchema } from "@/server/validators/honor.js";
import { HONOR_PHOTO_MAX, HONOR_TAG, saveHonorEntry } from "@/server/services/honor.js";

export const runtime = "nodejs";

export async function POST(request, { params }) {
    const id = objectId.safeParse((await params).id);
    if (!id.success) return json({ error: "Not found." }, 404);
    return adminUpload(
        request,
        {
            maxBytes: HONOR_PHOTO_MAX + 256 * 1024,
            schema: honorEntrySchema,
            fields: HONOR_FIELDS,
            context: "honor.update",
        },
        async (data, form, actor) => {
            const res = await saveHonorEntry(id.data, data, form.get("photo"), actor);
            revalidateTag(HONOR_TAG, { expire: 0 });
            return res;
        },
    );
}
