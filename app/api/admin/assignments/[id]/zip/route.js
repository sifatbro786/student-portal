import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { getCurrentUser } from "@/server/auth/guards.js";
import { objectId } from "@/server/validators/common.js";
import { resolveKey } from "@/server/storage/paths.js";
import { listSubmissionFilesForZip } from "@/server/services/assignments.js";
import { log } from "@/server/log.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () =>
    new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/** Safe single path segment for a ZIP entry / download name. */
function safe(s, max = 80) {
    return (
        String(s ?? "")
            .normalize("NFKC")
            .replace(/[\\/:*?"<>|\p{Cc}]+/gu, "_")
            .replace(/\s+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^[._]+/, "")
            .slice(0, max) || "file"
    );
}

/**
 * FR-ASG-05 "Download all": streamed ZIP. Files are added lazily and read one at
 * a time (archiver queue + lazystream), so memory stays flat whatever the total size.
 */
export async function GET(request, { params }) {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role) || user.mustChangePassword)
        return notFound();
    const id = objectId.safeParse((await params).id);
    if (!id.success) return notFound();
    const data = await listSubmissionFilesForZip(id.data);
    if (!data) return notFound();

    // Already-compressed formats (pdf/docx/pptx/jpg/png/webp) → store, don't deflate.
    const archive = new ZipArchive({ store: true });
    const out = new PassThrough();
    archive.on("warning", (err) =>
        log.warn("zip.warning", { code: err.code, message: err.message }),
    );
    archive.on("error", (err) => {
        log.error("zip.failed", { err });
        out.destroy(err);
    });
    archive.pipe(out);
    request.signal.addEventListener("abort", () => archive.abort());

    const used = new Set();
    for (const { student, files } of data.entries) {
        for (const f of files) {
            const ext = path.extname(f.originalName);
            const base = `${student.studentId}_${safe(student.fullName, 60)}_${safe(path.basename(f.originalName, ext), 90)}`;
            const cleanExt = /^\.[a-z0-9]{1,8}$/i.test(ext) ? ext.toLowerCase() : "";
            let name = `${base}${cleanExt}`;
            for (let n = 2; used.has(name.toLowerCase()); n++) name = `${base}_(${n})${cleanExt}`;
            used.add(name.toLowerCase());
            archive.file(resolveKey(f.key), { name, date: new Date() });
        }
    }
    if (!used.size) archive.append("No submissions yet.\n", { name: "README.txt" });
    archive.finalize().catch(() => {}); // errors surface via the "error" handler

    const zipName = `${safe(data.assignment.title, 60)}_submissions.zip`;
    return new Response(Readable.toWeb(out), {
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
