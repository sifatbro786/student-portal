import { z } from "zod";
import { revalidateTag } from "next/cache";
import { adminUpload } from "@/server/admin-route.js";
import { HERO_PHOTO_MAX, SITE_TAG, saveHeroPhoto } from "@/server/services/site-content.js";

export const runtime = "nodejs";

export const POST = (request) =>
    adminUpload(
        request,
        {
            maxBytes: HERO_PHOTO_MAX + 256 * 1024,
            schema: z.strictObject({}),
            fields: [],
            context: "site.hero_photo",
        },
        async (_data, form, actor) => {
            await saveHeroPhoto(form.get("photo"), actor);
            revalidateTag(SITE_TAG, { expire: 0 });
            return {};
        },
    );
