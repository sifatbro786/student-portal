import "server-only";
import { readFile } from "node:fs/promises";
import { connectDB } from "../db.js";
import { HonorEntry, HonorYear } from "../models/Honor.js";
import { Student } from "../models/Student.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { env } from "../env.js";
import { saveImage } from "../storage/files.js";
import { resolveKey } from "../storage/paths.js";
import { removeStoredPaths } from "../storage/delete.js";

export const HONOR_TAG = "honor";
export const HONOR_PHOTO_MAX = 5 * 1024 * 1024;
const folderOf = (year) => `public/honor/${Number(year)}`;

export const defaultHeading = () => "Circle of Excellence";
export const defaultSubheading = (year) => `Top Achievers : ${year}`;

/** `public/honor/2026/x.webp` → `/media/honor/2026/x.webp` (served by Nginx, PRD §8). */
export function mediaUrl(key) {
    if (!key?.startsWith("public/")) return null;
    return `${env().PUBLIC_MEDIA_BASE}/${key.slice("public/".length)}`;
}

/** FR-HON-04: 600×600 + 200×200 square WebP, EXIF stripped, public folder. */
async function savePhotoPair(file, year) {
    const photo = await saveImage(file, {
        dirKey: folderOf(year),
        maxBytes: HONOR_PHOTO_MAX,
        square: 600,
    });
    try {
        const thumb = await saveImage(file, {
            dirKey: folderOf(year),
            maxBytes: HONOR_PHOTO_MAX,
            square: 200,
        });
        return { photo, thumb };
    } catch (err) {
        await removeStoredPaths([photo.key]);
        throw err;
    }
}

/** FR-HON-05: a real photo can only be public with guardian consent. */
function assertConsent({ isPublished, consentConfirmed }, hasPhoto) {
    if (isPublished && hasPhoto && !consentConfirmed) {
        throw new ServiceError(
            "consent",
            "Tick guardian consent before publishing an entry with a photo (or remove the photo).",
            "consentConfirmed",
        );
    }
}

async function nextOrder(year) {
    const last = await HonorEntry.findOne({ year }).sort({ order: -1 }).select("order").lean();
    return (last?.order ?? -1) + 1;
}

const audit = (actor, action, id, meta) =>
    writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action,
        target: { type: "honor", id: String(id) },
        meta,
    });

// ------------------------------------------------------------------ admin
/** Years that have entries or settings, plus the current one — newest first. */
export async function listHonorYears() {
    await connectDB();
    const [a, b] = await Promise.all([HonorEntry.distinct("year"), HonorYear.distinct("year")]);
    const now = new Date().getFullYear();
    return [...new Set([...a, ...b, now])].sort((x, y) => y - x);
}

export async function listHonorAdmin(year) {
    await connectDB();
    const [entries, settings] = await Promise.all([
        HonorEntry.find({ year }).sort({ order: 1, name: 1 }).lean(),
        HonorYear.findOne({ year }).lean(),
    ]);
    return {
        year,
        heading: settings?.heading ?? defaultHeading(),
        subheading: settings?.subheading ?? defaultSubheading(year),
        entries: entries.map((e) => ({
            ...e,
            thumbUrl: mediaUrl(e.thumb?.key),
            photoUrl: mediaUrl(e.photo?.key),
        })),
    };
}

export async function getHonorEntry(id) {
    await connectDB();
    const e = await HonorEntry.findById(id).lean();
    if (!e) throw new ServiceError("not_found", "Entry not found.");
    return { ...e, thumbUrl: mediaUrl(e.thumb?.key), photoUrl: mediaUrl(e.photo?.key) };
}

/**
 * Create (id null) or update an entry. Name/photo live on the entry (FR-HON-01).
 * @param {File | null} file new photo (optional)
 */
export async function saveHonorEntry(id, input, file, actor) {
    await connectDB();
    const existing = id ? await HonorEntry.findById(id).lean() : null;
    if (id && !existing) throw new ServiceError("not_found", "Entry not found.");

    const hasNewFile = file && typeof file !== "string" && file.size > 0;
    const keepsPhoto = !!existing?.photo && !input.removePhoto && !hasNewFile;
    assertConsent(input, hasNewFile || keepsPhoto);

    const pair = hasNewFile ? await savePhotoPair(file, input.year) : null;
    const oldKeys =
        existing?.photo && (hasNewFile || input.removePhoto)
            ? [existing.photo.key, existing.thumb?.key]
            : [];

    const doc = {
        year: input.year,
        name: input.name,
        grade: input.grade,
        percentage: input.percentage,
        consentConfirmed: input.consentConfirmed,
        isPublished: input.isPublished,
    };
    const unset = {};
    if (input.school) doc.school = input.school;
    else unset.school = 1;
    if (pair) Object.assign(doc, pair);
    else if (input.removePhoto) Object.assign(unset, { photo: 1, thumb: 1 });

    let savedId;
    try {
        if (existing) {
            if (existing.year !== input.year) doc.order = await nextOrder(input.year);
            await HonorEntry.updateOne(
                { _id: existing._id },
                Object.keys(unset).length ? { $set: doc, $unset: unset } : { $set: doc },
                { runValidators: true },
            );
            savedId = existing._id;
        } else {
            const e = await HonorEntry.create({ ...doc, order: await nextOrder(input.year) });
            savedId = e._id;
        }
    } catch (err) {
        if (pair) await removeStoredPaths([pair.photo.key, pair.thumb.key]);
        throw err;
    }
    await removeStoredPaths(oldKeys); // after the DB points at the new photo
    await audit(actor, existing ? "honor.update" : "honor.create", savedId);
    return { id: String(savedId), year: input.year };
}

/**
 * FR-HON-03: copy name/school/photo from a student record. The copy is independent
 * (FR-HON-01) and starts HIDDEN when it has a photo — consent must be ticked first.
 */
export async function addHonorFromStudent(input, actor) {
    await connectDB();
    const s = await Student.findOne({ studentId: input.studentId })
        .select("fullName institution photo")
        .lean();
    if (!s) throw new ServiceError("not_found", "No student with this ID.", "studentId");

    let pair = null;
    if (s.photo?.key) {
        const buf = await readFile(resolveKey(s.photo.key)).catch(() => null);
        if (buf) pair = await savePhotoPair(new File([buf], "photo.webp"), input.year);
    }
    try {
        const e = await HonorEntry.create({
            year: input.year,
            name: s.fullName,
            grade: input.grade,
            percentage: input.percentage,
            school: s.institution?.name || undefined,
            student: s._id,
            order: await nextOrder(input.year),
            consentConfirmed: false,
            isPublished: !pair, // no photo → nothing to consent to
            ...(pair ?? {}),
        });
        await audit(actor, "honor.create", e._id, { fromStudent: true });
        return { id: String(e._id), hasPhoto: !!pair };
    } catch (err) {
        if (pair) await removeStoredPaths([pair.photo.key, pair.thumb.key]);
        throw err;
    }
}

export async function setHonorPublished(id, isPublished, actor) {
    await connectDB();
    const e = await HonorEntry.findById(id).select("photo consentConfirmed").lean();
    if (!e) throw new ServiceError("not_found", "Entry not found.");
    assertConsent({ isPublished, consentConfirmed: e.consentConfirmed }, !!e.photo);
    await HonorEntry.updateOne({ _id: e._id }, { $set: { isPublished } });
    await audit(actor, isPublished ? "honor.publish" : "honor.unpublish", e._id);
}

export async function deleteHonorEntry(id, actor) {
    await connectDB();
    const e = await HonorEntry.findById(id).select("photo thumb year").lean();
    if (!e) throw new ServiceError("not_found", "Entry not found.");
    await HonorEntry.deleteOne({ _id: e._id });
    await removeStoredPaths([e.photo?.key, e.thumb?.key]);
    await audit(actor, "honor.delete", e._id);
    return { year: e.year };
}

/** FR-HON-06 drag-to-reorder: `ids` must be exactly the year's entries. */
export async function reorderHonor({ year, ids }, actor) {
    await connectDB();
    const current = await HonorEntry.find({ year }).select("_id").lean();
    const set = new Set(current.map((e) => String(e._id)));
    if (ids.length !== set.size || new Set(ids).size !== ids.length || ids.some((i) => !set.has(i)))
        throw new ServiceError("stale", "The list changed meanwhile — reload and try again.");
    await HonorEntry.bulkWrite(
        ids.map((id, order) => ({
            updateOne: { filter: { _id: id, year }, update: { $set: { order } } },
        })),
    );
    await audit(actor, "honor.reorder", year);
}

/** FR-HON-02 per-year heading/subheading. */
export async function saveHonorYear({ year, heading, subheading }, actor) {
    await connectDB();
    await HonorYear.updateOne(
        { year },
        { $set: { heading, subheading: subheading ?? defaultSubheading(year) } },
        { upsert: true, runValidators: true },
    );
    await audit(actor, "honor.year", year);
}
