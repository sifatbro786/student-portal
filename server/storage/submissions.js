import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import busboy from "busboy";
import sharp from "sharp";
import { fileTypeFromFile } from "file-type";
import { resolveKey, studentFolderKey } from "./paths.js";
import { removeStoredPaths } from "./delete.js";
import { cleanName } from "./files.js";
import { ServiceError } from "../errors.js";

// FR-ASG / PRD §8. Student uploads are streamed straight to disk (never held in
// memory), then checked by magic bytes before they are moved into place.

const STAGING_DIR = "tmp/uploads";
const MB = 1024 * 1024;

/** Detected MIME (file-type) → our extension. docx/pptx are detected from the ZIP
 *  contents ([Content_Types].xml + word/ or ppt/), so a renamed .zip/.docm is rejected. */
const DETECTED = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};
const MIME_OF = Object.fromEntries(Object.entries(DETECTED).map(([m, e]) => [e, m]));

/** `private/students/<studentId>/submissions/<assignmentId>` (PRD §8 layout). */
export function submissionFolderKey(studentId, assignmentId) {
    const aid = String(assignmentId);
    if (!/^[a-f\d]{24}$/i.test(aid)) throw new Error("Invalid assignment id");
    return `${studentFolderKey(studentId)}/submissions/${aid}`;
}

/**
 * @typedef {{ tmpKey: string, originalName: string, size: number, sha256: string }} StagedFile
 */

/**
 * Stream a multipart request's files into the staging folder with hard limits.
 * Never buffers a file in memory. On any failure every staged file is removed.
 * @param {Request} request
 * @param {{ maxFiles: number, maxFileBytes: number, field?: string, timeoutMs?: number }} opts
 * @returns {Promise<StagedFile[]>}
 */
export async function receiveFiles(
    request,
    { maxFiles, maxFileBytes, field = "files", timeoutMs = 10 * 60 * 1000 },
) {
    if (!request.body) throw new ServiceError("bad_request", "Choose at least one file.");
    let bb;
    try {
        bb = busboy({
            headers: { "content-type": request.headers.get("content-type") ?? "" },
            limits: {
                files: maxFiles,
                fileSize: maxFileBytes,
                fields: 5,
                fieldSize: 1024,
                parts: maxFiles + 5,
            },
        });
    } catch {
        throw new ServiceError("bad_request", "Could not read the upload.");
    }

    await mkdir(resolveKey(STAGING_DIR), { recursive: true });
    /** @type {StagedFile[]} */
    const staged = [];
    const writes = [];
    const open = new Set(); // busboy file streams still being written
    let failure = null;
    const input = Readable.fromWeb(request.body);

    const done = new Promise((resolve, reject) => {
        /**
         * Soft failures (a limit was hit) only remember the error and keep reading:
         * busboy truncates/skips what is over its limits, so the rest is bounded, and
         * the client gets our JSON answer instead of a connection reset. The partial
         * temp files are removed below. Hard failures stop at once.
         */
        const fail = (err, hard = false) => {
            failure ??= err;
            if (!hard) return;
            clearTimeout(timer);
            input.unpipe(bb);
            input.destroy();
            // Destroy WITH an error: a plain destroy() of a busboy file stream never
            // settles its pipeline (the request would hang).
            for (const s of open) s.destroy(failure);
            reject(failure);
        };
        const timer = setTimeout(
            () =>
                fail(
                    new ServiceError("timeout", "The upload took too long. Please try again."),
                    true,
                ),
            timeoutMs,
        );

        bb.on("file", (name, stream, info) => {
            if (failure || name !== field) return stream.resume();
            const originalName = cleanName(info.filename);
            const tmpKey = `${STAGING_DIR}/${randomUUID()}`;
            const entry = { tmpKey, originalName, size: 0, sha256: "" };
            staged.push(entry);
            open.add(stream);
            stream.once("close", () => open.delete(stream));
            const hash = createHash("sha256");
            const counter = new Transform({
                transform(chunk, _enc, cb) {
                    entry.size += chunk.length;
                    hash.update(chunk);
                    cb(null, chunk);
                },
            });
            stream.on("limit", () =>
                fail(
                    new ServiceError(
                        "too_large",
                        `“${originalName}” is larger than ${Math.round(maxFileBytes / MB)} MB.`,
                        "files",
                    ),
                ),
            );
            // Staging dir exists already → the pipeline starts synchronously, so a
            // failure can never destroy the stream before it is being consumed.
            writes.push(
                pipeline(
                    stream,
                    counter,
                    createWriteStream(resolveKey(tmpKey), { flags: "wx" }),
                ).then(
                    () => {
                        entry.sha256 = hash.digest("hex");
                    },
                    (err) => fail(err, true), // disk error (or our own hard stop)
                ),
            );
        });
        bb.on("filesLimit", () =>
            fail(
                new ServiceError(
                    "too_many",
                    `You can upload at most ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`,
                    "files",
                ),
            ),
        );
        bb.on("partsLimit", () => fail(new ServiceError("bad_request", "Too many form fields.")));
        bb.on("fieldsLimit", () => fail(new ServiceError("bad_request", "Too many form fields.")));
        bb.on("error", () =>
            fail(new ServiceError("bad_request", "Could not read the upload."), true),
        );
        bb.on("close", async () => {
            await Promise.allSettled(writes);
            clearTimeout(timer);
            if (failure) reject(failure);
            else resolve();
        });
        input.on("error", () =>
            fail(new ServiceError("bad_request", "The upload was interrupted."), true),
        );
        input.pipe(bb);
    });

    try {
        await done;
    } catch (err) {
        await Promise.allSettled(writes);
        await discardStaged(staged);
        throw err;
    }

    // An empty <input type=file> still sends one part with no name and no bytes.
    const files = [];
    const empty = [];
    for (const f of staged) (f.size === 0 ? empty : files).push(f);
    await discardStaged(empty);
    return files;
}

/** Remove staged temp files (safe to call twice). */
export const discardStaged = (staged) => removeStoredPaths(staged.map((f) => f.tmpKey));

/** Make sure the display name ends with the real extension (e.g. "essay" → "essay.pdf"). */
function displayName(originalName, ext) {
    const cur = path.extname(originalName).toLowerCase().replace(".", "");
    const same = cur === ext || (ext === "jpg" && cur === "jpeg");
    return same ? originalName : `${originalName.replace(/\.+$/, "")}.${ext}`;
}

/**
 * Check every staged file by magic bytes against `allowed`, then move them into
 * `dirKey` with random names. Images are re-encoded (EXIF/GPS stripped). All or
 * nothing: on failure nothing is left in `dirKey` and the staged files are removed.
 * @param {StagedFile[]} staged
 * @param {{ allowed: string[], dirKey: string }} opts
 * @returns {Promise<Array<{ key: string, originalName: string, mime: string, size: number, sha256: string }>>}
 */
export async function finalizeFiles(staged, { allowed, dirKey }) {
    const placed = [];
    try {
        const typed = [];
        for (const f of staged) {
            const t = await fileTypeFromFile(resolveKey(f.tmpKey)).catch(() => null);
            const ext = DETECTED[t?.mime];
            if (!ext || !allowed.includes(ext)) {
                throw new ServiceError(
                    "bad_type",
                    `“${f.originalName}” isn’t an allowed file type. Allowed: ${allowed
                        .map((a) => a.toUpperCase())
                        .join(", ")}.`,
                    "files",
                );
            }
            typed.push({ ...f, ext });
        }

        await mkdir(resolveKey(dirKey), { recursive: true });
        for (const f of typed) {
            const key = `${dirKey}/${randomUUID()}.${f.ext}`;
            const ref = {
                key,
                originalName: displayName(f.originalName, f.ext),
                mime: MIME_OF[f.ext],
                size: f.size,
                sha256: f.sha256,
            };
            if (f.ext === "jpg" || f.ext === "png" || f.ext === "webp") {
                let img = sharp(resolveKey(f.tmpKey), {
                    limitInputPixels: 60_000_000,
                    failOn: "error",
                }).rotate();
                img =
                    f.ext === "jpg"
                        ? img.jpeg({ quality: 88, mozjpeg: true })
                        : f.ext === "png"
                          ? img.png()
                          : img.webp({ quality: 88 });
                const out = await img.toBuffer().catch(() => {
                    throw new ServiceError(
                        "bad_image",
                        `“${f.originalName}” could not be read as an image.`,
                        "files",
                    );
                });
                await writeFile(resolveKey(key), out, { flag: "wx" });
                ref.size = out.length;
                ref.sha256 = createHash("sha256").update(out).digest("hex");
                await rm(resolveKey(f.tmpKey), { force: true });
            } else {
                await rename(resolveKey(f.tmpKey), resolveKey(key));
            }
            placed.push(ref);
        }
        return placed;
    } catch (err) {
        await removeStoredPaths(placed.map((p) => p.key));
        await discardStaged(staged);
        throw err;
    }
}

/** For scripts (demo seed): stage an in-memory file like an upload would. */
export async function stageFromBuffer(buf, originalName) {
    const tmpKey = `${STAGING_DIR}/${randomUUID()}`;
    const abs = resolveKey(tmpKey);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, buf, { flag: "wx" });
    return {
        tmpKey,
        originalName: cleanName(originalName),
        size: buf.length,
        sha256: createHash("sha256").update(buf).digest("hex"),
    };
}
