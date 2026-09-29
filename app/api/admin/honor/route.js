import { revalidateTag } from "next/cache";
import { adminUpload } from "@/server/admin-route.js";
import { HONOR_FIELDS, honorEntrySchema } from "@/server/validators/honor.js";
import { HONOR_PHOTO_MAX, HONOR_TAG, saveHonorEntry } from "@/server/services/honor.js";

export const runtime = "nodejs";

export const POST = (request) =>
    adminUpload(
        request,
        {
            maxBytes: HONOR_PHOTO_MAX + 256 * 1024,
            schema: honorEntrySchema,
            fields: HONOR_FIELDS,
            context: "honor.create",
        },
        async (data, form, actor) => {
            const res = await saveHonorEntry(null, data, form.get("photo"), actor);
            revalidateTag(HONOR_TAG, { expire: 0 }); // FR-HON-06: public board updates now
            return res;
        },
    );
