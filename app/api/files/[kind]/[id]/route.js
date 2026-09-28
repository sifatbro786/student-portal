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
