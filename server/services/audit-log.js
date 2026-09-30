import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDB, trusted } from "../db.js";
import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/User.js";

// FR-AUD: read-only audit trail for super admins. Entries expire after 12 months (TTL).

/** Filter groups → action prefixes (`<prefix>.<verb>`). */
export const AUDIT_GROUPS = {
    auth: { label: "Sign-in & passwords", prefixes: ["auth"] },
    students: { label: "Students", prefixes: ["student"] },
    admissions: { label: "Admissions", prefixes: ["admission"] },
    payments: { label: "Payments", prefixes: ["fee"] },
    academics: {
        label: "Classes, exams & results",
        prefixes: ["class", "batch", "exam", "results"],
    },
    content: {
        label: "Notices, materials & assignments",
        prefixes: ["notice", "material", "assignment", "submission"],
    },
    website: {
        label: "Website",
        prefixes: ["site", "honor", "gallery", "review", "testimonial"],
    },
    admins: { label: "Admins", prefixes: ["admin"] },
};

export const AUDIT_PAGE_SIZE = 50;

/**
 * @param {{ group?: string, actor?: string, from?: Date | null, to?: Date | null, page?: number }} q
 *   `to` is exclusive (start of the day after the chosen end date).
 */
export async function listAuditLog({ group, actor, from, to, page = 1 } = {}) {
    await connectDB();
    const filter = {};
    const g = AUDIT_GROUPS[group];
    if (g) filter.action = new RegExp(`^(${g.prefixes.join("|")})\\.`);
    if (actor && isValidObjectId(actor)) filter.actor = actor;
    if (from || to) {
        filter.at = trusted({ ...(from && { $gte: from }), ...(to && { $lt: to }) });
    }
    const skip = (Math.max(1, page) - 1) * AUDIT_PAGE_SIZE;
    const [rows, total] = await Promise.all([
        AuditLog.find(filter).sort({ at: -1 }).skip(skip).limit(AUDIT_PAGE_SIZE).lean(),
        AuditLog.countDocuments(filter),
    ]);

    // One lookup for every person named on this page (actors + admin/user targets).
    const ids = new Set();
    for (const r of rows) {
        if (r.actor) ids.add(String(r.actor));
        if (r.target?.id && isValidObjectId(r.target.id)) ids.add(r.target.id);
    }
    const users = ids.size
        ? await User.find({ _id: trusted({ $in: [...ids] }) })
              .select("name role")
              .lean()
        : [];
    const byId = new Map(users.map((u) => [String(u._id), u]));

    return {
        total,
        page: Math.max(1, page),
        pages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
        rows: rows.map((r) => {
            const who = r.actor ? byId.get(String(r.actor)) : null;
            const targetUser = r.target?.id ? byId.get(r.target.id) : null;
            return {
                id: String(r._id),
                at: r.at.toISOString(),
                action: r.action,
                actorName: who?.name ?? (r.actor ? "Deleted user" : "System"),
                actorRole: r.actorRole ?? who?.role ?? null,
                targetType: r.target?.type ?? null,
                targetLabel: targetUser?.name ?? r.target?.id ?? null,
                meta: summariseMeta(r.meta),
            };
        }),
    };
}

/** Actors for the filter dropdown: every admin / super admin (students never act here). */
export async function listAuditActors() {
    await connectDB();
    const rows = await User.find({ role: trusted({ $in: ["super_admin", "admin"] }) })
        .sort({ name: 1 })
        .select("name")
        .lean();
    return rows.map((u) => ({ id: String(u._id), name: u.name }));
}

/** meta → short "key: value · key: value" text (meta never holds PII — FR-STU-08). */
function summariseMeta(meta) {
    if (!meta || typeof meta !== "object") return "";
    return Object.entries(meta)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .slice(0, 6)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(" · ")
        .slice(0, 240);
}
