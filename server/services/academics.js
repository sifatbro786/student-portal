import "server-only";
import { connectDB } from "../db.js";
import { ClassModel } from "../models/Class.js";
import { Batch } from "../models/Batch.js";
import { Student } from "../models/Student.js";
import { FeeRecord } from "../models/FeeRecord.js";
import { ServiceError } from "../errors.js";

const isDup = (err) => err?.code === 11000;

// ------------------------------------------------------------------ classes
/** All classes with batch + active-student counts, ordered for display. */
export async function listClassesWithStats() {
    await connectDB();
    const [classes, batchCounts, studentCounts] = await Promise.all([
        ClassModel.find().sort({ order: 1, name: 1 }).lean(),
        Batch.aggregate([{ $group: { _id: "$class", n: { $sum: 1 } } }]),
        Student.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: "$class", n: { $sum: 1 } } },
        ]),
    ]);
    const bc = new Map(batchCounts.map((r) => [String(r._id), r.n]));
    const sc = new Map(studentCounts.map((r) => [String(r._id), r.n]));
    return classes.map((c) => ({
        ...c,
        batchCount: bc.get(String(c._id)) ?? 0,
        activeStudents: sc.get(String(c._id)) ?? 0,
    }));
}

export async function getClass(id) {
    await connectDB();
    const c = await ClassModel.findById(id).lean();
    if (!c) throw new ServiceError("not_found", "Class not found.");
    return c;
}

export async function createClass(input) {
    await connectDB();
    try {
        return (await ClassModel.create(input)).toObject();
    } catch (err) {
        if (isDup(err))
            throw new ServiceError("duplicate", "A class with this name already exists.", "name");
        throw err;
    }
}

export async function updateClass(id, input) {
    await connectDB();
    try {
        const c = await ClassModel.findByIdAndUpdate(
            id,
            { $set: input },
            { returnDocument: "after", runValidators: true },
        ).lean();
        if (!c) throw new ServiceError("not_found", "Class not found.");
        return c;
    } catch (err) {
        if (isDup(err))
            throw new ServiceError("duplicate", "A class with this name already exists.", "name");
        throw err;
    }
}

/** FR-BAT-03: never hard-delete a class that has batches or any history. */
export async function deleteClass(id) {
    await connectDB();
    const [batches, students] = await Promise.all([
        Batch.countDocuments({ class: id }),
        Student.countDocuments({ class: id }),
    ]);
    if (batches || students) {
        throw new ServiceError(
            "in_use",
            "This class still has batches or students. Deactivate it instead, or remove its empty batches first.",
        );
    }
    await ClassModel.deleteOne({ _id: id });
}

// ------------------------------------------------------------------ batches
/** Batches of one class with active-student counts. */
export async function listBatchesOfClass(classId) {
    const cls = await getClass(classId); // aggregation does not cast strings → use the ObjectId
    const [batches, counts] = await Promise.all([
        Batch.find({ class: cls._id }).sort({ name: 1 }).lean(),
        Student.aggregate([
            { $match: { class: cls._id, status: "active" } },
            { $group: { _id: "$batch", n: { $sum: 1 } } },
        ]),
    ]);
    const m = new Map(counts.map((r) => [String(r._id), r.n]));
    return batches.map((b) => ({ ...b, activeStudents: m.get(String(b._id)) ?? 0 }));
}

export async function getBatch(id) {
    await connectDB();
    const b = await Batch.findById(id).populate("class", "name isActive").lean();
    if (!b) throw new ServiceError("not_found", "Batch not found.");
    return b;
}

/** Active classes with their active batches — for selects (student form, P3 admission form). */
export async function classBatchOptions({ includeInactive = false } = {}) {
    await connectDB();
    const filter = includeInactive ? {} : { isActive: true };
    const [classes, batches] = await Promise.all([
        ClassModel.find(filter).sort({ order: 1, name: 1 }).select("name isActive").lean(),
        Batch.find(filter).sort({ name: 1 }).select("class name schedule isActive").lean(),
    ]);
    return classes.map((c) => ({
        id: String(c._id),
        name: c.name,
        isActive: c.isActive,
        batches: batches
            .filter((b) => String(b.class) === String(c._id))
            .map((b) => ({
                id: String(b._id),
                name: b.name,
                schedule: b.schedule,
                isActive: b.isActive,
            })),
    }));
}

function toBatchDoc(input) {
    const { days, startTime, endTime, ...rest } = input;
    return { ...rest, schedule: { days, startTime, endTime } };
}

export async function createBatch(input) {
    await connectDB();
    const cls = await getClass(input.class);
    if (!cls.isActive) throw new ServiceError("inactive_class", "This class is inactive.", "class");
    try {
        return (await Batch.create(toBatchDoc(input))).toObject();
    } catch (err) {
        if (isDup(err))
            throw new ServiceError(
                "duplicate",
                `Batch ${input.name} already exists in ${cls.name}.`,
                "name",
            );
        throw err;
    }
}

/** A batch cannot move to another class (it would silently move its students). */
export async function updateBatch(id, input) {
    await connectDB();
    const current = await Batch.findById(id).select("class").lean();
    if (!current) throw new ServiceError("not_found", "Batch not found.");
    if (String(current.class) !== input.class) {
        throw new ServiceError(
            "class_locked",
            "A batch cannot be moved to another class.",
            "class",
        );
    }
    const { class: _cls, ...rest } = toBatchDoc(input);
    try {
        return await Batch.findByIdAndUpdate(
            id,
            { $set: rest },
            { returnDocument: "after", runValidators: true },
        ).lean();
    } catch (err) {
        if (isDup(err))
            throw new ServiceError(
                "duplicate",
                "Another batch in this class has that name.",
                "name",
            );
        throw err;
    }
}

/** FR-BAT-03 — any student (active or not) or fee history blocks a hard delete. */
export async function deleteBatch(id) {
    await connectDB();
    const [students, fees] = await Promise.all([
        Student.countDocuments({ batch: id }),
        FeeRecord.countDocuments({ batchSnapshot: id }),
    ]);
    if (students || fees) {
        throw new ServiceError(
            "in_use",
            "This batch has students or history. Deactivate it instead.",
        );
    }
    const res = await Batch.deleteOne({ _id: id });
    if (!res.deletedCount) throw new ServiceError("not_found", "Batch not found.");
}

/** Throws unless `batchId` is an active batch of active class `classId`. */
export async function assertActiveBatchOfClass(classId, batchId, { session } = {}) {
    const b = await Batch.findOne({ _id: batchId, class: classId, isActive: true })
        .populate({ path: "class", select: "isActive", match: { isActive: true } })
        .session(session ?? null)
        .lean();
    if (!b || !b.class)
        throw new ServiceError("bad_batch", "Pick an active batch of the chosen class.", "batch");
    return b;
}
