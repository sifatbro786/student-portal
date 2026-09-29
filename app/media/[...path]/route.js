import { resolveKey } from "@/server/storage/paths.js";
import { streamStored } from "@/server/storage/files.js";

export const runtime = "nodejs";

const TYPES = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };
const notFound = () => new Response("Not found", { status: 404 });

/**
 * Fallback for PUBLIC files (honor photos) when Nginx isn't in front — local dev.
 * In production Nginx serves `/media/` straight from `UPLOAD_ROOT/public` (PRD §8, §16)
 * and never reaches this route. Only `public/` is reachable; names are random + immutable.
 */
export async function GET(_request, { params }) {
    const { path: parts } = await params;
    if (!parts?.length || parts.some((p) => !/^[a-z0-9][a-z0-9._-]{0,100}$/i.test(p)))
        return notFound();
    const key = `public/${parts.join("/")}`;
    const ext = key.split(".").pop().toLowerCase();
    if (!TYPES[ext]) return notFound();
    try {
        resolveKey(key); // path safety
    } catch {
        return notFound();
    }
    const res = await streamStored({ key, mime: TYPES[ext] });
    if (res.status !== 200) return res;
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    res.headers.delete("Content-Disposition");
    return res;
}
