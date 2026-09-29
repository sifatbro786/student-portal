import "server-only";
import { connectDB, trusted } from "../db.js";
import { GalleryImage } from "../models/GalleryImage.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { saveImageSet } from "../storage/files.js";
import { removeStoredPaths } from "../storage/delete.js";
import { mediaUrl } from "./honor.js";

// [P8 addition] Public photo gallery. Script-safe; cached reader in site-public.js.
export const GALLERY_TAG = "gallery";
export const GALLERY_PHOTO_MAX = 10 * 1024 * 1024; // per photo (phone photos are 3–8 MB)
export const GALLERY_MAX_FILES = 12; // per upload request
const DIR = "public/gallery";

const audit = (actor, action, id, meta) =>
    writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action,
        target: { type: "gallery", id: String(id) },
        meta,
    });

/** Photos of identifiable students need guardian consent before they go public. */
function assertConsent({ isPublished, consentConfirmed }) {
    if (isPublished && !consentConfirmed) {
        throw new ServiceError(
            "consent",
            "Tick “cleared for public display” before publishing.",
            "consentConfirmed",
        );
    }
}

const plain = (g) => ({
    id: String(g._id),
    url: mediaUrl(g.image.key),
    thumbUrl: mediaUrl(g.thumb.key),
    width: g.width,
    height: g.height,
    caption: g.caption ?? "",
    alt: g.alt ?? "",
    category: g.category,
    isFeatured: !!g.isFeatured,
    consentConfirmed: !!g.consentConfirmed,
    isPublished: !!g.isPublished,
    isPlaceholder: !!g.isPlaceholder,
    credit: g.credit ?? "",
});

/**
 * Store one photo (1600 + 800 WebP, EXIF/GPS stripped). Returns the new id.
 * @param {File} file
 * @param {{ category: string, caption?: string, consentConfirmed: boolean, isPublished: boolean,
 *   alt?: string, isFeatured?: boolean, isPlaceholder?: boolean, credit?: string }} input
 */
export async function addGalleryImage(file, input, actor) {
    assertConsent(input);
    await connectDB();
    const set = await saveImageSet(file, {
        dirKey: DIR,
        maxBytes: GALLERY_PHOTO_MAX,
        variants: [
            { name: "image", max: 1600 },
            { name: "thumb", max: 800 },
        ],
    });
    try {
        const first = await GalleryImage.findOne().sort({ order: 1 }).select("order").lean();
        const g = await GalleryImage.create({
            image: set.image.ref,
            thumb: set.thumb.ref,
            width: set.image.width,
            height: set.image.height,
            caption: input.caption || undefined,
            alt: input.alt || undefined,
            category: input.category,
            isFeatured: !!input.isFeatured,
            consentConfirmed: input.consentConfirmed,
            isPublished: input.isPublished,
            isPlaceholder: !!input.isPlaceholder,
            credit: input.credit || undefined,
            order: (first?.order ?? 1) - 1, // newest first until reordered
            createdBy: actor.id,
        });
        await audit(actor, "gallery.create", g._id);
        return String(g._id);
    } catch (err) {
        await removeStoredPaths([set.image.ref.key, set.thumb.ref.key]);
        throw err;
    }
}

/**
 * Several files in one request. Each photo is independent: good ones are kept, bad ones
 * are reported by file name (no silent partial failure).
 */
export async function addGalleryImages(files, input, actor) {
    const list = files.filter((f) => f && typeof f !== "string" && f.size > 0);
    if (!list.length) throw new ServiceError("no_file", "Choose at least one photo.", "photos");
    if (list.length > GALLERY_MAX_FILES) {
        throw new ServiceError(
            "too_many",
            `Upload at most ${GALLERY_MAX_FILES} photos at a time.`,
            "photos",
        );
    }
    assertConsent(input);
    const added = [];
    const failed = [];
    for (const f of list) {
        try {
            added.push(await addGalleryImage(f, input, actor));
        } catch (err) {
            if (!(err instanceof ServiceError)) throw err;
            failed.push({ name: String(f.name).slice(0, 80), error: err.message });
        }
    }
    return { added: added.length, failed };
}

export async function listGalleryAdmin({ category } = {}) {
    await connectDB();
    const filter = category ? { category } : {};
    const rows = await GalleryImage.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    return rows.map(plain);
}

export async function getGalleryImage(id) {
    await connectDB();
    const g = await GalleryImage.findById(id).lean();
    if (!g) throw new ServiceError("not_found", "Photo not found.");
    return plain(g);
}

export async function updateGalleryImage(input, actor) {
    assertConsent(input);
    await connectDB();
    const unset = {};
    const set = {
        category: input.category,
        isFeatured: input.isFeatured,
        consentConfirmed: input.consentConfirmed,
        isPublished: input.isPublished,
    };
    for (const k of ["caption", "alt"]) {
        if (input[k]) set[k] = input[k];
        else unset[k] = 1;
    }
    const res = await GalleryImage.updateOne(
        { _id: input.id },
        Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set },
        { runValidators: true },
    );
    if (res.matchedCount === 0) throw new ServiceError("not_found", "Photo not found.");
    await audit(actor, "gallery.update", input.id);
}

export async function deleteGalleryImage(id, actor) {
    await connectDB();
    const g = await GalleryImage.findByIdAndDelete(id).lean();
    if (!g) throw new ServiceError("not_found", "Photo not found.");
    await removeStoredPaths([g.image.key, g.thumb.key]);
    await audit(actor, "gallery.delete", id);
}

/** Remove every stock placeholder photo (seeded by `npm run seed:gallery`). */
export async function removeGalleryPlaceholders(actor) {
    await connectDB();
    const rows = await GalleryImage.find({ isPlaceholder: true }).select("_id").lean();
    for (const r of rows) await deleteGalleryImage(String(r._id), actor);
    return rows.length;
}

/** ids in the new display order (all of them, or a filtered subset — only those move). */
export async function reorderGallery({ ids }, actor) {
    await connectDB();
    const found = await GalleryImage.find({ _id: trusted({ $in: ids }) })
        .select("order")
        .lean();
    if (found.length !== ids.length) {
        throw new ServiceError("stale", "The list changed. Reload and try again.");
    }
    // Reuse the subset's existing order slots so photos outside the subset don't move.
    const slots = found.map((g) => g.order).sort((a, b) => a - b);
    const unique = new Set(slots).size === slots.length;
    await GalleryImage.bulkWrite(
        ids.map((id, i) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { order: unique ? slots[i] : slots[0] + i } },
            },
        })),
    );
    await audit(actor, "gallery.reorder", "many", { count: ids.length });
}

/** Public: published photos only (consent is required to publish). */
export async function listPublishedGallery() {
    await connectDB();
    const rows = await GalleryImage.find({ isPublished: true, consentConfirmed: true })
        .sort({ order: 1, createdAt: -1 })
        .limit(500)
        .lean();
    return rows.map((g) => {
        const p = plain(g);
        return {
            id: p.id,
            url: p.url,
            thumbUrl: p.thumbUrl,
            width: p.width,
            height: p.height,
            caption: p.caption,
            alt: p.alt || p.caption || `${p.category} photo`,
            category: p.category,
            isFeatured: p.isFeatured,
            credit: p.credit,
        };
    });
}
