import "server-only";
import mongoose from "mongoose";
import { trusted } from "../db.js";
import { ClassModel } from "../models/Class.js";
import { Batch } from "../models/Batch.js";
import { ServiceError } from "../errors.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));

/**
 * The ONE filter that decides what a student may see (notices, materials,
 * assignments). `scope` must come from getStudentScope() — never the client.
 * @param {{ classId: any, batchId: any }} scope
 * @param {{ includePublic?: boolean }} [opts]
 */
export function audienceFilter(scope, { includePublic = false } = {}) {
    const or = [
        { audience: "all_students" },
        { audience: "class", classes: oid(scope.classId) },
        { audience: "batches", batches: oid(scope.batchId) },
    ];
    if (includePublic) or.unshift({ audience: "public" });
    return { $or: or };
}

/** Same rule in memory, for a single loaded document. */
export function inAudience(doc, scope, { includePublic = false } = {}) {
    if (doc.audience === "public") return includePublic;
    if (doc.audience === "all_students") return true;
    if (doc.audience === "class")
        return doc.classes?.some((c) => String(c) === String(scope.classId));
    if (doc.audience === "batches")
        return doc.batches?.some((b) => String(b) === String(scope.batchId));
    return false;
}

/**
 * Validate + normalise targets for the chosen audience (admin input).
 * @returns {Promise<{ classes: any[], batches: any[] }>}
 */
export async function resolveTargets(audience, classes = [], batches = []) {
    if (audience === "class") {
        if (!classes.length)
            throw new ServiceError("targets", "Pick at least one class.", "classes");
        const n = await ClassModel.countDocuments({ _id: trusted({ $in: classes }) });
        if (n !== new Set(classes).size)
            throw new ServiceError("targets", "Unknown class selected.", "classes");
        return { classes: [...new Set(classes)], batches: [] };
    }
    if (audience === "batches") {
        if (!batches.length)
            throw new ServiceError("targets", "Pick at least one batch.", "batches");
        const n = await Batch.countDocuments({ _id: trusted({ $in: batches }) });
        if (n !== new Set(batches).size)
            throw new ServiceError("targets", "Unknown batch selected.", "batches");
        return { classes: [], batches: [...new Set(batches)] };
    }
    return { classes: [], batches: [] };
}

/** Human label for admin tables: "Everyone", "All students", "Class 9", "Class 9 A, B". */
export function audienceLabel(doc, classMap, batchMap) {
    if (doc.audience === "public") return "Public";
    if (doc.audience === "all_students") return "All students";
    if (doc.audience === "class")
        return doc.classes.map((c) => classMap.get(String(c)) ?? "?").join(", ");
    return doc.batches.map((b) => batchMap.get(String(b)) ?? "?").join(", ");
}
