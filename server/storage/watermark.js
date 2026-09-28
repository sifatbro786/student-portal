import "server-only";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { resolveKey } from "./paths.js";
import { removeStoredPaths } from "./delete.js";
import { formatDate } from "../../lib/date.js";

// FR-MAT-04: every copy a student opens carries their name + ID. Screenshots
// can't be prevented; the watermark makes a leaked copy traceable.

/** Helvetica only encodes WinAnsi — fold anything else to ASCII. */
const ascii = (s) =>
    String(s)
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\x20-\x7e]/g, "?");

const cacheDir = (materialId) => `cache/watermarked/${materialId}`;

/** Delete every watermarked copy of a material (on replace/delete). */
export const purgeWatermarks = (materialId) => removeStoredPaths([cacheDir(materialId)]);

async function stampPdf(buf, text) {
    const doc = await PDFDocument.load(buf, { updateMetadata: false });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const size = Math.max(14, Math.min(width, height) / 22);
        const tw = font.widthOfTextAtSize(text, size);
        // Big diagonal line through the centre + two smaller repeats.
        for (const [dx, dy, scale] of [
            [0, 0, 1],
            [-width / 3, -height / 3, 0.6],
            [width / 3, height / 3, 0.6],
        ]) {
            const s = size * scale;
            const w = (tw * s) / size;
            const cx = width / 2 + dx;
            const cy = height / 2 + dy;
            const a = Math.atan2(height, width);
            page.drawText(text, {
                x: cx - (w / 2) * Math.cos(a),
                y: cy - (w / 2) * Math.sin(a),
                size: s,
                font,
                color: rgb(0.48, 0.12, 0.17),
                opacity: 0.14,
                rotate: degrees((a * 180) / Math.PI),
            });
        }
        // Small footer line (survives cropping of the middle).
        page.drawText(text, {
            x: 24,
            y: 14,
            size: 8,
            font,
            color: rgb(0.4, 0.38, 0.35),
            opacity: 0.6,
        });
    }
    return Buffer.from(await doc.save());
}

async function stampImage(buf, text) {
    const img = sharp(buf);
    const { width, height } = await img.metadata();
    const size = Math.round(Math.max(14, Math.min(width, height) / 22));
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const rows = [];
    for (let y = -height; y < height * 2; y += size * 7) {
        rows.push(`<text x="${width / 2}" y="${y}" text-anchor="middle">${esc}</text>`);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<g transform="rotate(-30 ${width / 2} ${height / 2})" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${size}" fill="#7a1e2b" fill-opacity="0.16">${rows.join("")}</g></svg>`;
    return img
        .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
        .webp({ quality: 85 })
        .toBuffer();
}

/**
 * Return a FileRef for this student's watermarked copy, creating + caching it on
 * first access. Cache key = (materialId, studentId, file hash) per FR-MAT-04.
 * @param {{ _id: any, file: { key: string, mime: string, sha256: string, originalName: string } }} material
 * @param {{ studentId: string, fullName: string }} student
 */
export async function watermarkedCopy(material, student) {
    const pdf = material.file.mime === "application/pdf";
    const key = `${cacheDir(material._id)}/${student.studentId}-${material.file.sha256.slice(0, 12)}.${pdf ? "pdf" : "webp"}`;
    const abs = resolveKey(key);
    const exists = await stat(abs).then(
        (s) => s.isFile(),
        () => false,
    );
    if (!exists) {
        const text = ascii(
            `${student.fullName}  |  ${student.studentId}  |  ${formatDate(new Date())}`,
        );
        const source = await readFile(resolveKey(material.file.key));
        const out = pdf ? await stampPdf(source, text) : await stampImage(source, text);
        await mkdir(path.dirname(abs), { recursive: true });
        await writeFile(abs, out);
    }
    return {
        key,
        mime: pdf ? "application/pdf" : "image/webp",
        originalName: material.file.originalName,
    };
}
