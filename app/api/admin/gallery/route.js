import { revalidateTag } from "next/cache";
import { adminUpload } from "@/server/admin-route.js";
import { GALLERY_UPLOAD_FIELDS, galleryUploadSchema } from "@/server/validators/site.js";
import { GALLERY_TAG, addGalleryImages } from "@/server/services/gallery.js";

export const runtime = "nodejs";

// Several photos per request; the whole body is capped (Nginx: client_max_body_size ≥ 64m here).
const GALLERY_REQUEST_MAX = 64 * 1024 * 1024;

export const POST = (request) =>
    adminUpload(
        request,
        {
            maxBytes: GALLERY_REQUEST_MAX,
            schema: galleryUploadSchema,
            fields: GALLERY_UPLOAD_FIELDS,
            context: "gallery.upload",
        },
        async (data, form, actor) => {
            const res = await addGalleryImages(form.getAll("photos"), data, actor);
            if (res.added) revalidateTag(GALLERY_TAG, { expire: 0 });
            return res;
        },
    );
