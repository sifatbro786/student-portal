import "server-only";
import { rm } from "node:fs/promises";
import { connectDB } from "../db.js";
import { PendingFileDeletion } from "../models/Jobs.js";
import { resolveKey } from "./paths.js";
import { log } from "../log.js";

/**
 * Delete files/folders by storage key. Call only AFTER the DB commit (PRD §6).
 * Missing paths are fine; real failures are queued for the nightly retry job.
 * @param {Array<string | null | undefined>} keys
 */
export async function removeStoredPaths(keys) {
    for (const key of keys.filter(Boolean)) {
        try {
            await rm(resolveKey(key), { recursive: true, force: true });
        } catch (err) {
            log.error("storage.delete_failed", { key, err });
            try {
                await connectDB();
                await PendingFileDeletion.create({ path: key, lastError: err.message });
            } catch (queueErr) {
                log.error("storage.queue_failed", { key, err: queueErr });
            }
        }
    }
}
