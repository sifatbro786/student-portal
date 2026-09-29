import "server-only";
import mongoose from "mongoose";
import { connectDB, trusted } from "../db.js";
import { FeeRecord } from "../models/FeeRecord.js";
import { Student } from "../models/Student.js";
import { Batch } from "../models/Batch.js";
import { ClassModel } from "../models/Class.js";
import { AuditLog } from "../models/AuditLog.js";
import { ServiceError } from "../errors.js";
import { log } from "../log.js";
import { escapeRegex } from "../validators/common.js";
import { periodOf } from "../../lib/date.js";
import { scheduleLabel } from "../../lib/format.js";

// FR-PAY: status only (due / paid / waived) — no amounts, never shown to students.

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

async function batchInfo() {
    const [classes, batches] = await Promise.all([
        ClassModel.find().select("name order").lean(),
        Batch.find().select("name class schedule").lean(),
    ]);
    const cls = new Map(classes.map((c) => [String(c._id), c]));
    return new Map(
        batches.map((b) => [
            String(b._id),
            {
                label: `${cls.get(String(b.class))?.name ?? "?"} ${b.name}`,
                classOrder: cls.get(String(b.class))?.order ?? 0,
                name: b.name,
                time: scheduleLabel(b.schedule),
            },
        ]),
    );
}

// ------------------------------------------------------------------ generation (FR-PAY-02/03/04)
/**
 * Upsert a `due` record for every ACTIVE student for `period`. Idempotent: the unique
 * (student, period) index + $setOnInsert mean re-running never duplicates or overwrites
 * a status. Class / batch / batch time are snapshotted so old months stay correct.
 * @param {string} period "YYYY-MM" (Asia/Dhaka)
 * @param {{ studentIds?: any[] }} [opts] limit to some students (create / reactivate hooks)
 * @returns {Promise<{ period: string, created: number, students: number }>}
 */
export async function generateFeeRecords(period = periodOf(), { studentIds } = {}) {
    if (!PERIOD_RE.test(period)) throw new ServiceError("bad_period", "Invalid month.");
    await connectDB();
    const filter = { status: "active" };
    if (studentIds) filter._id = trusted({ $in: studentIds.map(oid) });
    const students = await Student.find(filter).select("class batch").lean();
    if (!students.length) return { period, created: 0, students: 0 };

    const batches = await Batch.find({
        _id: trusted({ $in: [...new Set(students.map((s) => String(s.batch)))].map(oid) }),
    })
        .select("schedule")
        .lean();
    const timeOf = new Map(batches.map((b) => [String(b._id), scheduleLabel(b.schedule)]));

    let created = 0;
    try {
        const res = await FeeRecord.bulkWrite(
            students.map((s) => ({
                updateOne: {
                    filter: { student: s._id, period },
                    update: {
                        $setOnInsert: {
                            status: "due",
                            classSnapshot: s.class,
                            batchSnapshot: s.batch,
                            batchTimeSnapshot: timeOf.get(String(s.batch)) ?? "",
                        },
                    },
                    upsert: true,
                },
            })),
            { ordered: false },
        );
        created = res.upsertedCount ?? 0;
    } catch (err) {
        // Two generators racing (cron + a manual run): the unique index wins, nothing
        // is duplicated. Anything else is a real error.
        if (err?.code !== 11000 && !err?.writeErrors?.every?.((e) => e.code === 11000)) throw err;
        created = err?.result?.upsertedCount ?? 0;
    }
    log.info("fees.generated", { period, created, students: students.length });
    return { period, created, students: students.length };
}

/** FR-PAY-03 hook: create / reactivate → current month right away. Never throws. */
export async function ensureCurrentFeeRecord(studentObjectId) {
    try {
        await generateFeeRecords(periodOf(), { studentIds: [studentObjectId] });
    } catch (err) {
        log.error("fees.ensure_failed", { err });
    }
}

// ------------------------------------------------------------------ status changes (FR-PAY-07)
const STATUS_SET = (status, note, actor) => {
    const $set = { status, updatedBy: actor.id };
    const $unset = {};
    if (status === "paid") $set.paidAt = new Date();
    else $unset.paidAt = 1;
    if (note) $set.note = note;
    return Object.keys($unset).length ? { $set, $unset } : { $set };
};

async function auditChanges(before, status, actor) {
    const at = new Date();
    const docs = before
        .filter((r) => r.status !== status)
        .map((r) => ({
            actor: actor.id,
            actorRole: actor.role,
            action: "fee.status",
            target: { type: "fee", id: String(r._id) },
            meta: { period: r.period, from: r.status, to: status }, // no PII
            at,
        }));
    if (!docs.length) return;
    try {
        await AuditLog.insertMany(docs, { ordered: false });
    } catch (err) {
        log.error("audit.write_failed", { action: "fee.status", err });
    }
}

/** One cell. Paid → Due is allowed (a correction). */
export async function setFeeStatus(id, { status, note }, actor) {
    await connectDB();
    const before = await FeeRecord.findById(id).select("status period").lean();
    if (!before) throw new ServiceError("not_found", "Record not found.");
    await FeeRecord.updateOne({ _id: before._id }, STATUS_SET(status, note, actor), {
        runValidators: true,
    });
    await auditChanges([before], status, actor);
    return { from: before.status, to: status };
}

/** FR-PAY-06 bulk "mark paid" (or any status) for up to 200 records. */
export async function bulkSetFeeStatus(ids, { status, note }, actor) {
    await connectDB();
    const before = await FeeRecord.find({ _id: trusted({ $in: ids.map(oid) }) })
        .select("status period")
        .lean();
    if (!before.length) throw new ServiceError("not_found", "Nothing selected.");
    await FeeRecord.updateMany(
        { _id: trusted({ $in: before.map((r) => r._id) }) },
        STATUS_SET(status, note, actor),
        { runValidators: true },
    );
    await auditChanges(before, status, actor);
    return { changed: before.filter((r) => r.status !== status).length, total: before.length };
}

// ------------------------------------------------------------------ matrix (FR-PAY-05)
/**
 * Rows = students with records in `year` (filtered by the SNAPSHOT class/batch, so a
 * student who changed batch shows the months they spent in the filtered batch).
 * One indexed query for the year's records + one for the students — no N+1.
 * (FerretDB, the test DB, lacks $push; on real Mongo this could be a single $group.)
 */
export async function getPaymentMatrix({ year, classId, batchId }) {
    await connectDB();
    const filter = {
        period: trusted({ $gte: `${year}-01`, $lte: `${year}-12` }),
    };
    if (batchId) filter.batchSnapshot = batchId;
    else if (classId) filter.classSnapshot = classId;

    const [records, info] = await Promise.all([
        FeeRecord.find(filter)
            .select("student period status batchSnapshot batchTimeSnapshot note paidAt")
            .sort({ period: 1 })
            .lean(),
        batchInfo(),
    ]);
    const byStudent = new Map();
    for (const r of records) {
        const k = String(r.student);
        if (!byStudent.has(k)) byStudent.set(k, { cells: {}, last: r });
        const row = byStudent.get(k);
        row.cells[r.period] = {
            id: String(r._id),
            status: r.status,
            note: r.note ?? "",
            paidAt: r.paidAt ?? null,
        };
        row.last = r; // latest month in range → batch/time label
    }
    const students = byStudent.size
        ? await Student.find({ _id: trusted({ $in: [...byStudent.keys()].map(oid) }) })
              .select("studentId fullName status")
              .lean()
        : [];
    const months = Array.from(
        { length: 12 },
        (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
    );
    const rows = students
        .map((s) => {
            const { cells, last } = byStudent.get(String(s._id));
            const b = info.get(String(last.batchSnapshot));
            return {
                studentObjectId: String(s._id),
                studentId: s.studentId,
                fullName: s.fullName,
                inactive: s.status !== "active",
                batchLabel: b?.label ?? "—",
                classOrder: b?.classOrder ?? 0,
                time: last.batchTimeSnapshot || b?.time || "",
                cells,
                due: Object.values(cells).filter((c) => c.status === "due").length,
            };
        })
        .sort(
            (a, b) =>
                a.classOrder - b.classOrder ||
                a.batchLabel.localeCompare(b.batchLabel) ||
                a.fullName.localeCompare(b.fullName),
        );
    const dueByMonth = Object.fromEntries(
        months.map((m) => [m, rows.filter((r) => r.cells[m]?.status === "due").length]),
    );
    return {
        year,
        months,
        rows,
        dueByMonth,
        totalDue: rows.reduce((n, r) => n + r.due, 0),
    };
}

// ------------------------------------------------------------------ list (FR-PAY-06)
async function listFilter({ period, status, classId, batchId, q }) {
    const filter = {};
    if (period) filter.period = period;
    if (status && status !== "all") filter.status = status;
    if (batchId) filter.batchSnapshot = batchId;
    else if (classId) filter.classSnapshot = classId;
    if (q) {
        const rx = trusted({ $regex: escapeRegex(q), $options: "i" });
        const ids = await Student.find({ $or: [{ fullName: rx }, { studentId: rx }] })
            .select("_id")
            .limit(500)
            .lean();
        filter.student = trusted({ $in: ids.map((s) => s._id) });
    }
    return filter;
}

export async function listFeeRecords({ period, status, classId, batchId, q, page, pageSize }) {
    await connectDB();
    const filter = await listFilter({ period, status, classId, batchId, q });
    const [total, records, info] = await Promise.all([
        FeeRecord.countDocuments(filter),
        FeeRecord.find(filter)
            .sort({ period: -1, batchSnapshot: 1, _id: 1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        batchInfo(),
    ]);
    const students = records.length
        ? await Student.find({ _id: trusted({ $in: records.map((r) => r.student) }) })
              .select("studentId fullName status")
              .lean()
        : [];
    const sm = new Map(students.map((s) => [String(s._id), s]));
    return {
        rows: records.map((r) => {
            const s = sm.get(String(r.student));
            return {
                id: String(r._id),
                period: r.period,
                status: r.status,
                note: r.note ?? "",
                paidAt: r.paidAt ?? null,
                studentObjectId: String(r.student),
                studentId: s?.studentId ?? "—",
                fullName: s?.fullName ?? "(deleted)",
                inactive: s?.status !== "active",
                batchLabel: info.get(String(r.batchSnapshot))?.label ?? "—",
                time: r.batchTimeSnapshot,
            };
        }),
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

/** CSV export: an async generator of rows, read in pages (never all in memory). */
export async function* exportFeeRows(query) {
    await connectDB();
    const filter = await listFilter(query);
    const info = await batchInfo();
    const cursor = FeeRecord.find(filter).sort({ period: -1, batchSnapshot: 1 }).lean().cursor();
    let chunk = [];
    const flush = async () => {
        const students = await Student.find({
            _id: trusted({ $in: chunk.map((r) => r.student) }),
        })
            .select("studentId fullName status")
            .lean();
        const sm = new Map(students.map((s) => [String(s._id), s]));
        const out = chunk.map((r) => {
            const s = sm.get(String(r.student));
            return [
                s?.studentId ?? "",
                s?.fullName ?? "",
                info.get(String(r.batchSnapshot))?.label ?? "",
                r.batchTimeSnapshot ?? "",
                r.period,
                r.status,
                r.paidAt ? r.paidAt.toISOString() : "",
                r.note ?? "",
                s?.status ?? "deleted",
            ];
        });
        chunk = [];
        return out;
    };
    for await (const r of cursor) {
        chunk.push(r);
        if (chunk.length === 500) for (const row of await flush()) yield row;
    }
    if (chunk.length) for (const row of await flush()) yield row;
}

// ------------------------------------------------------------------ dashboard (FR-PAY-09)
export async function countDueThisMonth() {
    await connectDB();
    const due = await FeeRecord.find({ period: periodOf(), status: "due" })
        .select("student")
        .lean();
    if (!due.length) return 0;
    // Only students who are still active count as "due" on the dashboard.
    return Student.countDocuments({
        _id: trusted({ $in: due.map((d) => d.student) }),
        status: "active",
    });
}
