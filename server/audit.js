import "server-only";
import { connectDB } from "./db.js";
import { AuditLog } from "./models/AuditLog.js";
import { log } from "./log.js";

/**
 * Append an audit entry. Never throws — auditing must not break the action.
 * `meta` must never contain PII (FR-STU-08); pass hashed IPs only.
 * @param {{ actor?: string, actorRole?: string, action: string,
 *           target?: { type: string, id: string }, meta?: object, ip?: string }} entry
 */
export async function writeAudit(entry) {
    try {
        await connectDB();
        await AuditLog.create({ ...entry, at: new Date() });
    } catch (err) {
        log.error("audit.write_failed", { action: entry.action, err });
    }
}
