import "server-only";
import { connectDB } from "../db.js";
import { Testimonial } from "../models/Testimonial.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { copyStored, saveImage } from "../storage/files.js";
import { studentFolderKey } from "../storage/paths.js";
import { removeStoredPaths } from "../storage/delete.js";
import { mediaUrl } from "./honor.js";

// [P8 addition] Student reviews → admin approval → homepage.
export const TESTIMONIAL_TAG = "testimonials";
/** Client rule (2026-09-29): a student's own photo may be at most 1 MB. */
export const TESTIMONIAL_PHOTO_MAX = 1024 * 1024;
const PUBLIC_DIR = "public/testimonials";

const audit = (actor, action, id, meta) =>
    writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action,
        target: { type: "testimonial", id: String(id) },
        meta,
    });

// ------------------------------------------------------------------ student
/** The student's own review as plain values (or null). The photo is served privately. */
export async function getOwnTestimonial(scope) {
    await connectDB();
    const t = await Testimonial.findOne({ student: scope.studentObjectId }).lean();
    if (!t) return null;
    return {
        id: String(t._id),
        quote: t.quote,
        rating: t.rating,
        resultLine: t.resultLine ?? "",
        hasPhoto: !!t.photo,
        photoVersion: t.photo?.sha256?.slice(0, 8) ?? null,
        status: t.status,
        statusNote: t.statusNote ?? "",
        submittedAt: t.submittedAt.toISOString(),
    };
}

/**
 * Create or edit the student's review. Any edit goes back to "pending" and leaves the
 * homepage until an admin approves it again. Order: new photo → DB → delete old files.
 * @param {File | null} file optional new photo (≤ 1 MB, checked by magic bytes)
 */
export async function saveOwnTestimonial(scope, input, file) {
    await connectDB();
    const existing = await Testimonial.findOne({ student: scope.studentObjectId }).lean();
    const hasNewFile = file && typeof file !== "string" && file.size > 0;

    const photo = hasNewFile
        ? await saveImage(file, {
              dirKey: `${studentFolderKey(scope.studentId)}/testimonial`,
              maxBytes: TESTIMONIAL_PHOTO_MAX,
              square: 400,
          })
        : null;

    const oldKeys = [existing?.publicPhoto?.key]; // any edit unpublishes the old version
    if (existing?.photo && (photo || input.removePhoto)) oldKeys.push(existing.photo.key);

    const set = {
        name: scope.fullName,
        quote: input.quote,
        rating: input.rating,
        consent: input.consent,
        status: "pending",
        submittedAt: new Date(),
    };
    const unset = { publicPhoto: 1, statusNote: 1, reviewedBy: 1, reviewedAt: 1 };
    if (input.resultLine) set.resultLine = input.resultLine;
    else unset.resultLine = 1;
    if (photo) set.photo = photo;
    else if (input.removePhoto) unset.photo = 1;

    try {
        await Testimonial.updateOne(
            { student: scope.studentObjectId },
            { $set: set, $unset: unset, $setOnInsert: { student: scope.studentObjectId } },
            { upsert: true, runValidators: true },
        );
    } catch (err) {
        if (photo) await removeStoredPaths([photo.key]);
        throw err;
    }
    await removeStoredPaths(oldKeys);
    return { wasApproved: existing?.status === "approved" };
}

export async function deleteOwnTestimonial(scope) {
    await connectDB();
    const t = await Testimonial.findOneAndDelete({ student: scope.studentObjectId }).lean();
    if (t) await removeStoredPaths([t.photo?.key, t.publicPhoto?.key]);
    return { wasApproved: t?.status === "approved" };
}

// ------------------------------------------------------------------ admin
export const TESTIMONIAL_STATUSES = ["pending", "approved", "rejected"];

export async function countPendingTestimonials() {
    await connectDB();
    return Testimonial.countDocuments({ status: "pending" });
}

/** Moderation queue, newest first. Plain JSON. */
export async function listTestimonialsAdmin({ status = "pending", page = 1, pageSize = 20 }) {
    await connectDB();
    const filter = TESTIMONIAL_STATUSES.includes(status) ? { status } : {};
    const [rows, total, counts] = await Promise.all([
        Testimonial.find(filter)
            .sort(status === "approved" ? { isPinned: -1, reviewedAt: -1 } : { submittedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("student", "studentId")
            .lean(),
        Testimonial.countDocuments(filter),
        Testimonial.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
    return {
        total,
        counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
        rows: rows.map((t) => ({
            id: String(t._id),
            name: t.name,
            studentId: t.student?.studentId ?? null,
            resultLine: t.resultLine ?? "",
            quote: t.quote,
            rating: t.rating,
            hasPhoto: !!t.photo,
            status: t.status,
            statusNote: t.statusNote ?? "",
            isPinned: !!t.isPinned,
            submittedAt: t.submittedAt.toISOString(),
            reviewedAt: t.reviewedAt ? t.reviewedAt.toISOString() : null,
        })),
    };
}

/**
 * Approve / reject / send back to pending, with optional typo fixes by the admin.
 * Approval publishes a COPY of the photo; anything else removes that copy.
 */
export async function moderateTestimonial(input, actor) {
    await connectDB();
    const t = await Testimonial.findById(input.id).lean();
    if (!t) throw new ServiceError("not_found", "Review not found.");
    if (input.decision === "approve" && !t.consent) {
        throw new ServiceError("consent", "The student hasn’t agreed to public display.");
    }

    let publicPhoto = t.publicPhoto ?? null;
    const toRemove = [];
    if (input.decision === "approve" && t.photo && !publicPhoto) {
        publicPhoto = await copyStored(t.photo, PUBLIC_DIR);
    } else if (input.decision !== "approve" && publicPhoto) {
        toRemove.push(publicPhoto.key);
        publicPhoto = null;
    }

    const set = {
        name: input.name,
        quote: input.quote,
        status: input.decision === "approve" ? "approved" : input.decision,
        isPinned: input.decision === "approve" ? input.isPinned : false,
        reviewedBy: actor.id,
        reviewedAt: new Date(),
    };
    const unset = {};
    if (input.resultLine) set.resultLine = input.resultLine;
    else unset.resultLine = 1;
    if (input.statusNote) set.statusNote = input.statusNote;
    else unset.statusNote = 1;
    if (publicPhoto) set.publicPhoto = publicPhoto;
    else unset.publicPhoto = 1;

    try {
        // Only moderate the version the admin actually read: a student edit in between
        // (new submittedAt) must not be approved with the admin's stale text.
        const res =
            t.submittedAt.toISOString() !== input.version
                ? { matchedCount: 0 }
                : await Testimonial.updateOne(
                      { _id: t._id, submittedAt: t.submittedAt },
                      Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set },
                      { runValidators: true },
                  );
        if (res.matchedCount === 0) {
            throw new ServiceError(
                "changed",
                "The student just edited this review. Reload and check it again.",
            );
        }
    } catch (err) {
        if (publicPhoto && publicPhoto.key !== t.publicPhoto?.key) {
            await removeStoredPaths([publicPhoto.key]);
        }
        throw err;
    }
    await removeStoredPaths(toRemove);
    await audit(actor, `testimonial.${input.decision}`, t._id);
}

export async function deleteTestimonial(id, actor) {
    await connectDB();
    const t = await Testimonial.findByIdAndDelete(id).lean();
    if (!t) throw new ServiceError("not_found", "Review not found.");
    await removeStoredPaths([t.photo?.key, t.publicPhoto?.key]);
    await audit(actor, "testimonial.delete", id);
}

/** Admin preview of the (private) photo. Returns the FileRef or null. */
export async function testimonialPhotoFor(id, { isAdmin, scope }) {
    await connectDB();
    const filter = isAdmin ? { _id: id } : { _id: id, student: scope?.studentObjectId };
    if (!isAdmin && !scope) return null;
    const t = await Testimonial.findOne(filter).select("photo").lean();
    return t?.photo ?? null;
}

// ------------------------------------------------------------------ public
/** Approved reviews for the homepage (pinned first). Plain JSON. */
export async function listApprovedTestimonials(limit = 6) {
    await connectDB();
    const rows = await Testimonial.find({ status: "approved", consent: true })
        .sort({ isPinned: -1, reviewedAt: -1 })
        .limit(limit)
        .select("name resultLine quote rating publicPhoto")
        .lean();
    return rows.map((t) => ({
        id: String(t._id),
        name: t.name,
        resultLine: t.resultLine ?? "",
        quote: t.quote,
        rating: t.rating,
        photoUrl: t.publicPhoto ? mediaUrl(t.publicPhoto.key) : null,
    }));
}

/** For student purge: the public copy lives outside the student folder. */
export async function testimonialKeysForStudent(studentObjectId) {
    const t = await Testimonial.findOne({ student: studentObjectId }).select("publicPhoto").lean();
    return [t?.publicPhoto?.key];
}
