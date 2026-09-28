import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { PDFDocument } from "pdf-lib";
import { resolveKey } from "./paths.js";
import { ServiceError } from "../errors.js";

// PRD §8: magic bytes decide the type, never the extension or the browser's MIME.
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

sharp.cache(false); // don't keep decoded images in memory between requests

/**
 * Read a multipart body with a hard byte cap *while streaming* — a lying or
 * missing Content-Length can't make us buffer more than `maxBytes`.
 * @param {Request} request
 * @param {number} maxBytes
 */
export async function readLimitedFormData(request, maxBytes) {
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > maxBytes) throw new ServiceError("too_large", "The upload is too large.");
    if (!request.body) throw new ServiceError("bad_request", "Empty request.");

    let seen = 0;
    const limited = request.body.pipeThrough(
        new TransformStream({
            transform(chunk, controller) {
                seen += chunk.byteLength;
                if (seen > maxBytes)
                    controller.error(new ServiceError("too_large", "The upload is too large."));
                else controller.enqueue(chunk);
            },
        }),
    );
    try {
        return await new Response(limited, {
            headers: { "content-type": request.headers.get("content-type") ?? "" },
        }).formData();
    } catch (err) {
        if (err instanceof ServiceError) throw err;
        throw new ServiceError("bad_request", "Could not read the form. Please try again.");
    }
}

/** Keep a readable, harmless original name for display only. */
function cleanName(name) {
    return (
        String(name ?? "file")
            .normalize("NFKC")
            .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
            .slice(-120) || "file"
    );
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function writeUnder(dirKey, filename, buf) {
    const key = `${dirKey}/${filename}`;
    const abs = resolveKey(key);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, buf, { flag: "wx" }); // never overwrite
    return key;
}

/**
 * Validate an uploaded image by magic bytes, strip EXIF/GPS, auto-rotate,
 * resize and store as WebP under `dirKey` with a random name.
 * @param {File} file
 * @param {{ dirKey: string, maxBytes: number, square?: number }} opts
 * @returns {Promise<{ key: string, originalName: string, mime: string, size: number, sha256: string }>}
 */
export async function saveImage(file, { dirKey, maxBytes, square }) {
    if (!file || typeof file === "string" || file.size === 0) {
        throw new ServiceError("no_file", "Please choose a photo.", "photo");
    }
    if (file.size > maxBytes) {
        throw new ServiceError(
            "too_large",
            `Photo must be ${Math.round(maxBytes / 1048576)} MB or smaller.`,
            "photo",
        );
    }
    const input = Buffer.from(await file.arrayBuffer());
    const type = await fileTypeFromBuffer(input);
    if (!type || !IMAGE_MIMES.includes(type.mime)) {
        throw new ServiceError("bad_type", "Photo must be a JPG, PNG or WebP image.", "photo");
    }

    let out;
    try {
        let img = sharp(input, { limitInputPixels: 40_000_000, failOn: "error" }).rotate();
        img = square
            ? img.resize(square, square, { fit: "cover", position: "attention" })
            : img.resize(1600, 1600, { fit: "inside", withoutEnlargement: true });
        out = await img.webp({ quality: 82 }).toBuffer(); // metadata (EXIF/GPS) is dropped by default
    } catch {
        throw new ServiceError(
            "bad_image",
            "This image could not be read. Try another photo.",
            "photo",
        );
    }

    const key = await writeUnder(dirKey, `${randomUUID()}.webp`, out);
    return {
        key,
        originalName: cleanName(file.name),
        mime: "image/webp",
        size: out.length,
        sha256: sha256(out),
    };
}

/**
 * PDF or image document (materials, notice attachments — FR-MAT-02).
 * PDFs are stored as-is after checking they open (no encryption); images are
 * re-encoded to WebP (EXIF stripped). docx/pptx are rejected on purpose.
 * @param {File} file
 * @param {{ dirKey: string, maxBytes: number, field?: string }} opts
 */
export async function saveDocument(file, { dirKey, maxBytes, field = "file" }) {
    if (!file || typeof file === "string" || file.size === 0) {
        throw new ServiceError("no_file", "Please choose a file.", field);
    }
    if (file.size > maxBytes) {
        throw new ServiceError(
            "too_large",
            `File must be ${Math.round(maxBytes / 1048576)} MB or smaller.`,
            field,
        );
    }
    const input = Buffer.from(await file.arrayBuffer());
    const type = await fileTypeFromBuffer(input);

    if (type?.mime === "application/pdf") {
        try {
            const doc = await PDFDocument.load(input, { updateMetadata: false });
            if (doc.getPageCount() < 1) throw new Error("empty");
        } catch {
            throw new ServiceError(
                "bad_pdf",
                "This PDF can’t be opened (damaged or password-protected).",
                field,
            );
        }
        const key = await writeUnder(dirKey, `${randomUUID()}.pdf`, input);
        return {
            key,
            originalName: cleanName(file.name),
            mime: "application/pdf",
            size: input.length,
            sha256: sha256(input),
        };
    }
    if (type && IMAGE_MIMES.includes(type.mime)) {
        const ref = await saveImage(file, { dirKey, maxBytes }).catch((err) => {
            if (err instanceof ServiceError) err.field = field;
            throw err;
        });
        return ref;
    }
    throw new ServiceError("bad_type", "Upload a PDF or an image (JPG, PNG, WebP).", field);
}

/** Copy a stored file into another folder (new random name). Returns a new FileRef. */
export async function copyStored(ref, toDirKey) {
    const ext = path.extname(ref.key) || "";
    const key = `${toDirKey}/${randomUUID()}${ext}`;
    const dest = resolveKey(key);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(resolveKey(ref.key), dest);
    return { ...ref, key };
}

/**
 * Stream a stored file as a Response (FR-MAT-05 headers).
 * @param {{ key: string, mime: string, originalName?: string }} ref
 * @param {{ download?: boolean }} [opts]
 */
export async function streamStored(ref, { download = false } = {}) {
    const abs = resolveKey(ref.key);
    const info = await stat(abs).catch(() => null);
    if (!info?.isFile()) return new Response("Not found", { status: 404 });
    const name = encodeURIComponent(ref.originalName ?? path.basename(ref.key));
    return new Response(Readable.toWeb(createReadStream(abs)), {
        headers: {
            "Content-Type": ref.mime,
            "Content-Length": String(info.size),
            "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${name}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
