import "server-only";
import { readdir, rm, rmdir, stat } from "node:fs/promises";
import path from "node:path";
import { connectDB, trusted } from "../db.js";
import { PendingFileDeletion } from "../models/Jobs.js";
import { resolveKey } from "../storage/paths.js";
import { log } from "../log.js";

// PRD §10 "File cleanup" (03:00 daily, scripts/cron.js; also `npm run cleanup:files`).
// Script-safe: no next/cache. Only ever touches three places:
//   1. keys queued in PendingFileDeletion (a delete failed after a DB commit)
//   2. UPLOAD_ROOT/tmp/uploads    — staged submissions left by a crash mid-upload
//   3. UPLOAD_ROOT/cache/watermarked — per-student copies, rebuilt on demand

const DAY = 24 * 60 * 60 * 1000;
const STAGED_MAX_AGE = DAY;
const WATERMARK_MAX_AGE = 30 * DAY;
const MAX_ATTEMPTS = 10;

/** Retry queued deletions; give up (keep the row, log loudly) after 10 tries. */
async function retryPendingDeletions() {
    await connectDB();
    const rows = await PendingFileDeletion.find({ attempts: trusted({ $lt: MAX_ATTEMPTS }) })
        .limit(500)
        .lean();
    let removed = 0;
    for (const row of rows) {
        try {
            await rm(resolveKey(row.path), { recursive: true, force: true });
            await PendingFileDeletion.deleteOne({ _id: row._id });
            removed++;
        } catch (err) {
            const attempts = (row.attempts ?? 0) + 1;
            await PendingFileDeletion.updateOne(
                { _id: row._id },
                { $set: { attempts, lastError: String(err.message).slice(0, 300) } },
            );
            if (attempts >= MAX_ATTEMPTS)
                log.error("cleanup.pending_gave_up", { key: row.path, err });
        }
    }
    return { removed, tried: rows.length };
}

/**
 * Delete files older than `maxAge` under a storage folder (recursively), then any
 * folders left empty. The folder itself is kept. Missing folder = nothing to do.
 */
async function pruneOlderThan(key, maxAge, now = Date.now()) {
    let root;
    try {
        root = resolveKey(key);
    } catch {
        return { files: 0 };
    }
    let files = 0;
    async function walk(dir, isRoot) {
        let entries;
        try {
            entries = await readdir(dir, { withFileTypes: true });
        } catch (err) {
            if (err.code === "ENOENT") return true;
            throw err;
        }
        let empty = true;
        for (const e of entries) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) {
                if (!(await walk(p, false))) empty = false;
            } else {
                const s = await stat(p).catch(() => null);
                if (s && now - s.mtimeMs > maxAge) {
                    await rm(p, { force: true });
                    files++;
                } else empty = false;
            }
        }
        if (empty && !isRoot) await rmdir(dir).catch(() => {});
        return empty;
    }
    await walk(root, true);
    return { files };
}

/** Run all three passes; each one is independent so one failure doesn't stop the rest. */
export async function runFileCleanup() {
    const result = {};
    for (const [name, fn] of [
        ["pending", () => retryPendingDeletions()],
        ["staged", () => pruneOlderThan("tmp/uploads", STAGED_MAX_AGE)],
        ["watermarks", () => pruneOlderThan("cache/watermarked", WATERMARK_MAX_AGE)],
    ]) {
        try {
            result[name] = await fn();
        } catch (err) {
            result[name] = { failed: true };
            log.error(`cleanup.${name}_failed`, { err });
        }
    }
    log.info("cleanup.done", result);
    return result;
}
