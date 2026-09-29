import { isValidObjectId } from "mongoose";
import { findStudentScope, getCurrentUser } from "@/server/auth/guards.js";
import { connectDB } from "@/server/db.js";
import { Admission } from "@/server/models/Admission.js";
import { Student } from "@/server/models/Student.js";
import { Material } from "@/server/models/Material.js";
import { streamStored } from "@/server/storage/files.js";
import { watermarkedCopy } from "@/server/storage/watermark.js";
import { getMaterialForStudent } from "@/server/services/materials.js";
import { getNoticeForStudent } from "@/server/services/notices.js";
import { Notice } from "@/server/models/Notice.js";
import { Assignment } from "@/server/models/Assignment.js";
import { Submission } from "@/server/models/Submission.js";
import { getAssignmentForStudent } from "@/server/services/assignments.js";
import { testimonialPhotoFor } from "@/server/services/testimonials.js";
import { log } from "@/server/log.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () =>
    new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
const isAdmin = (u) => u?.role === "admin" || u?.role === "super_admin";

/**
 * Private files are only ever served here, after auth + scope checks (PRD §8).
 * Anything the caller may not see is a 404 — never reveal that it exists (SEC-10).
 */
export async function GET(request, { params }) {
    const { kind, id } = await params;
    if (!isValidObjectId(id) || !/^[a-f\d]{24}$/i.test(id)) return notFound();
    const download = new URL(request.url).searchParams.get("download") === "1";
    await connectDB();

    try {
        // ---------------------------------------------------------- materials (FR-MAT-05/07)
        if (kind === "material") {
            const user = await getCurrentUser();
            if (isAdmin(user)) {
                const m = await Material.findById(id).select("file").lean();
                return m?.file?.key ? streamStored(m.file, { download }) : notFound();
            }
            const scope = await findStudentScope();
            if (!scope) return notFound();
            const m = await getMaterialForStudent(id, scope);
            if (!m?.file?.key) return notFound();
            // Students only ever get their own watermarked copy, inline.
            return streamStored(await watermarkedCopy(m, scope));
        }

        // ---------------------------------------------------------- notice attachments
        if (kind === "notice-attachment") {
            const n = await Notice.findById(id)
                .select("attachment audience publishAt expiresAt classes batches")
                .lean();
            if (!n?.attachment?.key) return notFound();
            const user = await getCurrentUser();
            if (isAdmin(user)) return streamStored(n.attachment, { download });
            const now = new Date();
            const live = n.publishAt <= now && (!n.expiresAt || n.expiresAt > now);
            if (live && n.audience === "public") return streamStored(n.attachment, { download });
            const scope = await findStudentScope();
            if (!scope || !(await getNoticeForStudent(id, scope))) return notFound();
            return streamStored(n.attachment, { download });
        }

        // ---------------------------------------------------------- assignment attachments
        if (kind === "assignment-attachment") {
            const user = await getCurrentUser();
            if (isAdmin(user)) {
                const a = await Assignment.findById(id).select("attachment").lean();
                return a?.attachment?.key ? streamStored(a.attachment, { download }) : notFound();
            }
            const scope = await findStudentScope();
            if (!scope) return notFound();
            const a = await getAssignmentForStudent(id, scope); // published + in scope
            return a?.attachment?.key ? streamStored(a.attachment, { download }) : notFound();
        }

        // ---------------------------------------------------------- submitted files (FR-ASG-05/07)
        // `id` = submission id, `?i=` = file index. Students only ever reach their own.
        if (kind === "submission-file") {
            const i = Number(new URL(request.url).searchParams.get("i") ?? "0");
            if (!Number.isInteger(i) || i < 0 || i > 9) return notFound();
            const user = await getCurrentUser();
            let filter = null;
            if (isAdmin(user)) filter = { _id: id };
            else {
                const scope = await findStudentScope();
                if (scope) filter = { _id: id, student: scope.studentObjectId };
            }
            if (!filter) return notFound();
            const sub = await Submission.findOne(filter).select("files").lean();
            const ref = sub?.files?.[i];
            if (!ref?.key) return notFound();
            // Uploaded by students → never rendered inline except PDFs/images the admin opens.
            const inline =
                !download && /^(application\/pdf|image\/(jpeg|png|webp))$/.test(ref.mime);
            return streamStored(ref, { download: !inline });
        }

        // ---------------------------------------------------------- review photo (P8)
        // Private until approved (the public copy lives under /media). Admin or the author.
        if (kind === "testimonial-photo") {
            const user = await getCurrentUser();
            const admin = isAdmin(user);
            const scope = admin ? null : await findStudentScope();
            const ref = await testimonialPhotoFor(id, { isAdmin: admin, scope });
            return ref?.key ? streamStored(ref) : notFound();
        }

        const user = await getCurrentUser();
        if (!user) return notFound();

        let ref = null;
        if (kind === "admission-photo" && isAdmin(user)) {
            ref = (await Admission.findById(id).select("photo").lean())?.photo;
        } else if (kind === "student-photo") {
            const filter = isAdmin(user)
                ? { _id: id }
                : { _id: id, user: user.id, status: "active" };
            ref = (await Student.findOne(filter).select("photo").lean())?.photo;
        }
        if (!ref?.key) return notFound();
        return streamStored(ref);
    } catch (err) {
        log.error("files.serve_failed", { kind, err });
        return notFound();
    }
}
