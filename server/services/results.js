import "server-only";
import mongoose from "mongoose";
import { connectDB, trusted, withTransaction } from "../db.js";
import { Exam, ResultEntry } from "../models/Exam.js";
import { Student } from "../models/Student.js";
import { ClassModel } from "../models/Class.js";
import { Batch } from "../models/Batch.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { escapeRegex } from "../validators/common.js";
import { parseResultsCsv } from "../validators/results.js";
import { GRADES } from "../../lib/constants.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const pct = (marks, fullMarks) => Math.round((marks / fullMarks) * 10000) / 100;

async function batchLabels(ids) {
    const batches = await Batch.find(ids ? { _id: trusted({ $in: ids }) } : {})
        .select("name class")
        .populate("class", "name order")
        .lean();
    return new Map(
        batches.map((b) => [
            String(b._id),
            {
                label: `${b.class?.name ?? "?"} ${b.name}`,
                name: b.name,
                order: b.class?.order ?? 0,
            },
        ]),
    );
}

// ------------------------------------------------------------------ admin: exams (FR-RES-01)
export async function listExamsAdmin({ classId, status, q, page, pageSize }) {
    await connectDB();
    const filter = {};
    if (classId) filter.class = classId;
    if (status === "published") filter.isPublished = true;
    if (status === "draft") filter.isPublished = false;
    if (q) filter.title = trusted({ $regex: escapeRegex(q), $options: "i" });

    const [total, rows, classes] = await Promise.all([
        Exam.countDocuments(filter),
        Exam.find(filter)
            .sort({ date: -1, _id: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .select("title class batches date fullMarks isPublished")
            .lean(),
        ClassModel.find().select("name").lean(),
    ]);
    const classMap = new Map(classes.map((c) => [String(c._id), c.name]));
    const labels = await batchLabels(rows.flatMap((r) => r.batches));
    const counts = rows.length
        ? await ResultEntry.aggregate([
              { $match: { exam: { $in: rows.map((r) => r._id) } } }, // ObjectIds (not cast)
              // $sum only (no $avg): portable, and avg = sum / n anyway.
              { $group: { _id: "$exam", n: { $sum: 1 }, sum: { $sum: "$percentage" } } },
          ])
        : [];
    const countMap = new Map(counts.map((c) => [String(c._id), c]));
    return {
        rows: rows.map((e) => ({
            ...e,
            className: classMap.get(String(e.class)) ?? "?",
            batchText: e.batches.map((b) => labels.get(String(b))?.name ?? "?").join(", "),
            results: countMap.get(String(e._id))?.n ?? 0,
            avg: countMap.has(String(e._id))
                ? Math.round(
                      (countMap.get(String(e._id)).sum / countMap.get(String(e._id)).n) * 100,
                  ) / 100
                : null,
        })),
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export async function getExamAdmin(id) {
    await connectDB();
    const e = await Exam.findById(id).lean();
    if (!e) throw new ServiceError("not_found", "Exam not found.");
    return e;
}

/**
 * Create (id null) or update. Batches must belong to the class. Changing the class
 * is blocked once results exist; changing full marks recomputes every percentage.
 */
export async function saveExam(id, input, actor) {
    await connectDB();
    const existing = id ? await Exam.findById(id).lean() : null;
    if (id && !existing) throw new ServiceError("not_found", "Exam not found.");

    const cls = await ClassModel.findById(input.class).select("_id").lean();
    if (!cls) throw new ServiceError("targets", "Unknown class.", "class");
    const batchIds = [...new Set(input.batches)];
    const ok = await Batch.countDocuments({ _id: trusted({ $in: batchIds }), class: cls._id });
    if (ok !== batchIds.length)
        throw new ServiceError("targets", "Pick batches of the selected class.", "batches");

    const doc = {
        title: input.title,
        class: cls._id,
        batches: batchIds,
        date: input.date,
        fullMarks: input.fullMarks,
        isPublished: input.isPublished,
    };

    if (!existing) {
        const e = await Exam.create({ ...doc, createdBy: actor.id });
        await audit(actor, "exam.create", e._id);
        return { id: String(e._id) };
    }

    const entries = await ResultEntry.find({ exam: existing._id }).select("marks").lean();
    if (entries.length && String(existing.class) !== String(cls._id)) {
        throw new ServiceError(
            "class_locked",
            "This exam already has results — its class can’t change.",
            "class",
        );
    }
    const maxMarks = Math.max(0, ...entries.map((e) => e.marks));
    if (maxMarks > input.fullMarks) {
        throw new ServiceError(
            "full_marks",
            `A student already has ${maxMarks} marks — full marks can’t be lower.`,
            "fullMarks",
        );
    }
    await Exam.updateOne({ _id: existing._id }, { $set: doc }, { runValidators: true });
    if (existing.fullMarks !== input.fullMarks && entries.length) {
        await ResultEntry.bulkWrite(
            entries.map((e) => ({
                updateOne: {
                    filter: { _id: e._id },
                    update: { $set: { percentage: pct(e.marks, input.fullMarks) } },
                },
            })),
        );
    }
    await audit(actor, "exam.update", existing._id);
    return { id: String(existing._id) };
}

export async function setExamPublished(id, isPublished, actor) {
    await connectDB();
    const res = await Exam.updateOne({ _id: id }, { $set: { isPublished } });
    if (!res.matchedCount) throw new ServiceError("not_found", "Exam not found.");
    await audit(actor, isPublished ? "exam.publish" : "exam.unpublish", id);
}

export async function deleteExam(id, actor) {
    await connectDB();
    const e = await Exam.findById(id).select("_id").lean();
    if (!e) throw new ServiceError("not_found", "Exam not found.");
    await withTransaction(async (session) => {
        await ResultEntry.deleteMany({ exam: e._id }, { session });
        await Exam.deleteOne({ _id: e._id }, { session });
    });
    await audit(actor, "exam.delete", e._id);
}

function audit(actor, action, id, meta) {
    return writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action,
        target: { type: "exam", id: String(id) },
        meta,
    });
}

// ------------------------------------------------------------------ admin: result grid (FR-RES-02/05)
/** Students the grid shows: ACTIVE students of the exam's batches + anyone with a result already. */
async function gridStudents(exam) {
    const withResult = await ResultEntry.find({ exam: exam._id }).select("student").lean();
    const or = [{ status: "active", batch: trusted({ $in: exam.batches }) }];
    if (withResult.length) or.push({ _id: trusted({ $in: withResult.map((r) => r.student) }) });
    return Student.find({ $or: or }).select("studentId fullName batch status").lean();
}

export async function getResultGrid(id) {
    await connectDB();
    const exam = await getExamAdmin(id);
    const [students, entries, labels, stats] = await Promise.all([
        gridStudents(exam),
        ResultEntry.find({ exam: exam._id }).lean(),
        batchLabels(),
        examStats(exam._id),
    ]);
    const byStudent = new Map(entries.map((e) => [String(e.student), e]));
    const inExam = new Set(exam.batches.map(String));
    const rows = students
        .map((s) => {
            const e = byStudent.get(String(s._id));
            const b = labels.get(String(s.batch));
            return {
                studentObjectId: String(s._id),
                studentId: s.studentId,
                fullName: s.fullName,
                batchLabel: b?.label ?? "—",
                batchOrder: `${b?.order ?? 0}-${b?.name ?? ""}`,
                note:
                    s.status !== "active"
                        ? "Inactive"
                        : inExam.has(String(s.batch))
                          ? null
                          : "Moved to another batch",
                marks: e?.marks ?? null,
                percentage: e?.percentage ?? null,
                grade: e?.grade ?? "",
                remark: e?.remark ?? "",
            };
        })
        .sort(
            (a, b) =>
                a.batchOrder.localeCompare(b.batchOrder) || a.fullName.localeCompare(b.fullName),
        );
    return { exam, rows, stats };
}

/**
 * FR-RES-02 bulk save. `rows` are already syntax-checked (parseResultGrid).
 * marks null → the student's entry is removed. Unknown students → error (never trust ids).
 * @returns {Promise<{ saved: number, removed: number }>}
 */
export async function saveResults(id, rows, actor) {
    await connectDB();
    const exam = await getExamAdmin(id);
    const allowed = new Set((await gridStudents(exam)).map((s) => String(s._id)));
    const rowErrors = {};
    for (const r of rows) {
        if (!allowed.has(r.student)) rowErrors[r.student] = "Not a student of this exam.";
        else if (r.marks !== null && r.marks > exam.fullMarks)
            rowErrors[r.student] = `Max ${exam.fullMarks}.`;
    }
    if (Object.keys(rowErrors).length) {
        const err = new ServiceError("rows", "Some rows need fixing.");
        err.rowErrors = rowErrors;
        throw err;
    }

    const ops = rows.map((r) =>
        r.marks === null
            ? { deleteOne: { filter: { exam: exam._id, student: oid(r.student) } } }
            : {
                  updateOne: {
                      filter: { exam: exam._id, student: oid(r.student) },
                      update: {
                          $set: {
                              marks: r.marks,
                              percentage: pct(r.marks, exam.fullMarks),
                              ...(r.grade && { grade: r.grade }),
                              ...(r.remark && { remark: r.remark }),
                          },
                          $unset: {
                              ...(!r.grade && { grade: 1 }),
                              ...(!r.remark && { remark: 1 }),
                          },
                      },
                      upsert: true,
                  },
              },
    );
    // An empty $unset is invalid — drop it.
    for (const op of ops)
        if (op.updateOne && !Object.keys(op.updateOne.update.$unset).length)
            delete op.updateOne.update.$unset;
    if (ops.length) await ResultEntry.bulkWrite(ops, { ordered: false });

    const saved = rows.filter((r) => r.marks !== null).length;
    await audit(actor, "results.save", exam._id, { saved, cleared: rows.length - saved });
    return { saved, removed: rows.length - saved };
}

/**
 * FR-RES-03: all-or-nothing CSV import with a row-level report.
 * @returns {Promise<{ ok: boolean, report: Array<{ line: number, studentId: string, ok: boolean, message: string }>, saved?: number }>}
 */
export async function importResultsCsv(id, text, actor) {
    await connectDB();
    const exam = await getExamAdmin(id);
    const parsed = parseResultsCsv(text);
    if (!parsed.length) throw new ServiceError("empty", "The file has no rows.", "file");

    const students = await gridStudents(exam);
    const byCode = new Map(students.map((s) => [s.studentId, s]));
    const seen = new Set();
    const report = parsed.map((r) => {
        if (r.error) return { line: r.line, studentId: r.studentId, ok: false, message: r.error };
        const s = byCode.get(r.studentId);
        if (!s)
            return {
                line: r.line,
                studentId: r.studentId,
                ok: false,
                message: "Not a student of this exam’s batches.",
            };
        if (seen.has(r.studentId))
            return { line: r.line, studentId: r.studentId, ok: false, message: "Listed twice." };
        seen.add(r.studentId);
        if (r.marks > exam.fullMarks)
            return {
                line: r.line,
                studentId: r.studentId,
                ok: false,
                message: `Marks above full marks (${exam.fullMarks}).`,
            };
        return {
            line: r.line,
            studentId: r.studentId,
            ok: true,
            message: `${s.fullName}: ${r.marks}`,
            row: { student: String(s._id), marks: r.marks, grade: r.grade, remark: r.remark },
        };
    });
    const clean = report.map(({ row: _row, ...rest }) => rest);
    if (report.some((r) => !r.ok)) return { ok: false, report: clean };
    const { saved } = await saveResults(
        id,
        report.map((r) => r.row),
        actor,
    );
    return { ok: true, report: clean, saved };
}

/**
 * FR-RES-05: average / highest / lowest percentage + grade distribution.
 * One indexed read of a single exam's entries (a class is at most a few hundred rows),
 * computed in JS — simpler and portable across Mongo versions.
 */
export async function examStats(examId) {
    const entries = await ResultEntry.find({ exam: oid(examId) })
        .select("marks percentage grade")
        .lean();
    const n = entries.length;
    const counts = new Map();
    for (const e of entries) counts.set(e.grade ?? "", (counts.get(e.grade ?? "") ?? 0) + 1);
    const round = (v) => Math.round(v * 100) / 100;
    const ps = entries.map((e) => e.percentage);
    return {
        count: n,
        avg: n ? round(ps.reduce((a, b) => a + b, 0) / n) : null,
        max: n ? Math.max(...ps) : null,
        min: n ? Math.min(...ps) : null,
        avgMarks: n ? round(entries.reduce((a, e) => a + e.marks, 0) / n) : null,
        grades: [
            ...GRADES.map((g) => ({ grade: g, n: counts.get(g) ?? 0 })),
            { grade: "—", n: counts.get("") ?? 0 },
        ],
    };
}

// ------------------------------------------------------------------ student (FR-RES-04)
/** Own results of PUBLISHED exams only, newest first. No merit list, no other students. */
export async function listResultsForStudent(scope, { limit = 100 } = {}) {
    await connectDB();
    const entries = await ResultEntry.find({ student: scope.studentObjectId })
        .select("exam marks percentage grade remark")
        .lean();
    if (!entries.length) return [];
    const exams = await Exam.find({
        _id: trusted({ $in: entries.map((e) => e.exam) }),
        isPublished: true,
    })
        .select("title date fullMarks")
        .lean();
    const examMap = new Map(exams.map((e) => [String(e._id), e]));
    return entries
        .filter((e) => examMap.has(String(e.exam)))
        .map((e) => {
            const x = examMap.get(String(e.exam));
            return {
                id: String(e._id),
                title: x.title,
                date: x.date,
                fullMarks: x.fullMarks,
                marks: e.marks,
                percentage: e.percentage,
                grade: e.grade ?? null,
                remark: e.remark ?? null,
            };
        })
        .sort((a, b) => b.date - a.date)
        .slice(0, limit);
}
