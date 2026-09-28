import "server-only";
import mongoose from "mongoose";
import { connectDB, trusted } from "../db.js";
import { Material } from "../models/Material.js";
import { ClassModel } from "../models/Class.js";
import { Batch } from "../models/Batch.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { saveDocument } from "../storage/files.js";
import { removeStoredPaths } from "../storage/delete.js";
import { purgeWatermarks } from "../storage/watermark.js";
import { audienceFilter, audienceLabel, inAudience, resolveTargets } from "./audience.js";
import { escapeRegex } from "../validators/common.js";

export const MATERIAL_MAX = 25 * 1024 * 1024; // FR-MAT-02
const folderOf = (id) => `private/materials/${id}`;

export const MATERIAL_TYPE_LABELS = {
    note: "Notes",
    question_paper: "Question papers",
    routine: "Routine",
    other: "Other",
};

// ------------------------------------------------------------------ admin
export async function listMaterialsAdmin({ type, q, page, pageSize }) {
    await connectDB();
    const filter = { type };
    if (q) filter.title = trusted({ $regex: escapeRegex(q), $options: "i" });
    const [total, rows, classes, batches] = await Promise.all([
        Material.countDocuments(filter),
        Material.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .select("title type audience classes batches isPublished file createdAt")
            .lean(),
        ClassModel.find().select("name").lean(),
        Batch.find().select("name class").lean(),
    ]);
    const classMap = new Map(classes.map((c) => [String(c._id), c.name]));
    const batchMap = new Map(
        batches.map((b) => [String(b._id), `${classMap.get(String(b.class)) ?? "?"} ${b.name}`]),
    );
    return {
        rows: rows.map((m) => ({ ...m, audienceText: audienceLabel(m, classMap, batchMap) })),
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export async function getMaterialAdmin(id) {
    await connectDB();
    const m = await Material.findById(id).lean();
    if (!m) throw new ServiceError("not_found", "Material not found.");
    return m;
}

/**
 * Create (id null, file required) or update (file optional → replaces + purges watermarks).
 * @param {{ id: string, role: string }} actor
 */
export async function saveMaterial(id, input, file, actor) {
    await connectDB();
    const existing = id ? await Material.findById(id).lean() : null;
    if (id && !existing) throw new ServiceError("not_found", "Material not found.");
    const materialId = existing?._id ?? new mongoose.Types.ObjectId();
    const targets = await resolveTargets(input.audience, input.classes, input.batches);

    const hasFile = file && typeof file !== "string" && file.size > 0;
    if (!existing && !hasFile) throw new ServiceError("no_file", "Please choose a file.", "file");
    const newFile = hasFile
        ? await saveDocument(file, {
              dirKey: folderOf(materialId),
              maxBytes: MATERIAL_MAX,
              field: "file",
          })
        : null;

    const doc = {
        title: input.title,
        description: input.description,
        type: input.type,
        audience: input.audience,
        ...targets,
        isPublished: input.isPublished,
        ...(newFile && { file: newFile }),
    };
    try {
        if (existing) await Material.updateOne({ _id: materialId }, { $set: doc });
        else await Material.create({ _id: materialId, ...doc, createdBy: actor.id });
    } catch (err) {
        if (newFile) await removeStoredPaths([newFile.key]);
        throw err;
    }
    if (newFile && existing?.file?.key) {
        await removeStoredPaths([existing.file.key]);
        await purgeWatermarks(String(materialId)); // FR-MAT-04: stale stamped copies
    }
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: existing ? "material.update" : "material.create",
        target: { type: "material", id: String(materialId) },
    });
    return { id: String(materialId) };
}

export async function setMaterialPublished(id, isPublished, actor) {
    await connectDB();
    const res = await Material.updateOne({ _id: id }, { $set: { isPublished } });
    if (!res.matchedCount) throw new ServiceError("not_found", "Material not found.");
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: isPublished ? "material.publish" : "material.unpublish",
        target: { type: "material", id: String(id) },
    });
}

export async function deleteMaterial(id, actor) {
    await connectDB();
    const m = await Material.findById(id).select("_id").lean();
    if (!m) throw new ServiceError("not_found", "Material not found.");
    await Material.deleteOne({ _id: m._id });
    await removeStoredPaths([folderOf(m._id)]);
    await purgeWatermarks(String(m._id));
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "material.delete",
        target: { type: "material", id: String(m._id) },
    });
}

// ------------------------------------------------------------------ student (FR-MAT-03/05)
export async function listMaterialsForStudent(scope, type) {
    await connectDB();
    return Material.find({ type, isPublished: true, ...audienceFilter(scope) })
        .sort({ createdAt: -1 })
        .limit(200)
        .select("title description type file.mime file.size createdAt")
        .lean();
}

/** null (→ 404) unless published and inside the student's scope. */
export async function getMaterialForStudent(id, scope) {
    await connectDB();
    const m = await Material.findById(id).lean();
    if (!m || !m.isPublished || !inAudience(m, scope)) return null;
    return m;
}
