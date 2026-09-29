import "server-only";
import mongoose from "mongoose";
import { connectDB, trusted, withTransaction } from "../db.js";
import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js";
import { Student } from "../models/Student.js";
import { ClassModel } from "../models/Class.js";
import { Batch } from "../models/Batch.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { sanitizeRichText } from "../sanitize.js";
import { saveDocument } from "../storage/files.js";
import { removeStoredPaths } from "../storage/delete.js";
import { finalizeFiles, submissionFolderKey } from "../storage/submissions.js";
import { audienceFilter, audienceLabel, inAudience, resolveTargets } from "./audience.js";
import { escapeRegex } from "../validators/common.js";

export const ASSIGNMENT_ATTACHMENT_MAX = 20 * 1024 * 1024;
const MB = 1024 * 1024;
const folderOf = (id) => `private/assignments/${id}`;
const oid = (v) => new mongoose.Types.ObjectId(String(v));

// ------------------------------------------------------------------ shared rules
/**
 * FR-ASG-03: can a submission received at `at` (SERVER time) be accepted?
 * Before the deadline → on time. After it → only when allowLate, marked late.
 * @returns {{ open: boolean, isLate: boolean }}
 */
export function submissionWindow(a, at = new Date()) {
    if (at <= a.deadline) return { open: true, isLate: false };
    return a.allowLate ? { open: true, isLate: true } : { open: false, isLate: true };
}

/** Admin-side state of an assignment. */
export function assignmentState(a, now = new Date()) {
    if (!a.isPublished) return "draft";
    if (now <= a.deadline) return "open";
    return a.allowLate ? "late" : "closed";
}

/**
 * FR-ASG-02 student status: not_submitted | submitted | late | closed.
 * A submission always wins over "closed" (they did hand it in).
 */
export function studentStatus(a, sub, now = new Date()) {
    if (sub) return sub.isLate ? "late" : "submitted";
    return submissionWindow(a, now).open ? "not_submitted" : "closed";
}

async function labelMaps() {
    const [classes, batches] = await Promise.all([
        ClassModel.find().select("name order").lean(),
        Batch.find().select("name class").lean(),
    ]);
    const classMap = new Map(classes.map((c) => [String(c._id), c.name]));
    const classOrder = new Map(classes.map((c) => [String(c._id), c.order ?? 0]));
    const batchMap = new Map(
        batches.map((b) => [String(b._id), `${classMap.get(String(b.class)) ?? "?"} ${b.name}`]),
    );
    return { classMap, batchMap, classOrder };
}

// ------------------------------------------------------------------ admin: CRUD
export async function listAssignmentsAdmin({ q, status, page, pageSize }) {
    await connectDB();
    const now = new Date();
    const filter = {};
    if (q) filter.title = trusted({ $regex: escapeRegex(q), $options: "i" });
    if (status === "draft") filter.isPublished = false;
    if (status === "open")
        Object.assign(filter, { isPublished: true, deadline: trusted({ $gt: now }) });
    if (status === "closed")
        Object.assign(filter, { isPublished: true, deadline: trusted({ $lte: now }) });

    const [total, rows, maps] = await Promise.all([
        Assignment.countDocuments(filter),
        Assignment.find(filter)
            .sort({ deadline: -1, _id: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .select("title type audience classes batches deadline allowLate isPublished")
            .lean(),
        labelMaps(),
    ]);
    const counts = rows.length
        ? await Submission.aggregate([
              { $match: { assignment: { $in: rows.map((r) => r._id) } } }, // ObjectIds (not cast)
              { $group: { _id: "$assignment", n: { $sum: 1 } } },
          ])
        : [];
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
    return {
        rows: rows.map((a) => ({
            ...a,
            audienceText: audienceLabel(a, maps.classMap, maps.batchMap),
            state: assignmentState(a, now),
            submissions: countMap.get(String(a._id)) ?? 0,
        })),
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export async function getAssignmentAdmin(id) {
    await connectDB();
    const a = await Assignment.findById(id).lean();
    if (!a) throw new ServiceError("not_found", "Assignment not found.");
    return a;
}

/**
 * Create (id null) or update. `file` = optional new attachment (PDF/image).
 * FR-ASG-08: changing the audience never touches existing submissions.
 * @param {{ id: string, role: string }} actor
 */
export async function saveAssignment(id, input, file, actor) {
    await connectDB();
    const existing = id ? await Assignment.findById(id).lean() : null;
    if (id && !existing) throw new ServiceError("not_found", "Assignment not found.");
    const assignmentId = existing?._id ?? new mongoose.Types.ObjectId();
    const targets = await resolveTargets(input.audience, input.classes, input.batches);

    let attachment = existing?.attachment;
    const oldKeys = [];
    if (file && typeof file !== "string" && file.size > 0) {
        attachment = await saveDocument(file, {
            dirKey: folderOf(assignmentId),
            maxBytes: ASSIGNMENT_ATTACHMENT_MAX,
            field: "attachment",
        });
        if (existing?.attachment?.key) oldKeys.push(existing.attachment.key);
    } else if (input.removeAttachment && existing?.attachment?.key) {
        oldKeys.push(existing.attachment.key);
        attachment = undefined;
    }

    const doc = {
        title: input.title,
        instructions: sanitizeRichText(input.instructions),
        type: input.type,
        audience: input.audience,
        ...targets,
        deadline: input.deadline,
        allowLate: input.allowLate,
        maxFiles: input.maxFiles,
        maxFileSizeMB: input.maxFileSizeMB,
        allowedTypes: input.allowedTypes,
        isPublished: input.isPublished,
    };
    const isNewFile = attachment && attachment !== existing?.attachment;
    try {
        if (existing) {
            await Assignment.updateOne(
                { _id: assignmentId },
                attachment
                    ? { $set: { ...doc, attachment } }
                    : { $set: doc, $unset: { attachment: 1 } },
                { runValidators: true },
            );
        } else {
            await Assignment.create({ _id: assignmentId, ...doc, attachment, createdBy: actor.id });
        }
    } catch (err) {
        if (isNewFile) await removeStoredPaths([attachment.key]);
        throw err;
    }
    await removeStoredPaths(oldKeys); // after the DB points at the new file

    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: existing ? "assignment.update" : "assignment.create",
        target: { type: "assignment", id: String(assignmentId) },
    });
    return { id: String(assignmentId) };
}

export async function setAssignmentPublished(id, isPublished, actor) {
    await connectDB();
    const res = await Assignment.updateOne({ _id: id }, { $set: { isPublished } });
    if (!res.matchedCount) throw new ServiceError("not_found", "Assignment not found.");
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: isPublished ? "assignment.publish" : "assignment.unpublish",
        target: { type: "assignment", id: String(id) },
    });
}

/** Deletes the assignment, all its submissions and every submitted file. */
export async function deleteAssignment(id, actor) {
    await connectDB();
    const a = await Assignment.findById(id).select("_id").lean();
    if (!a) throw new ServiceError("not_found", "Assignment not found.");
    const subs = await Submission.find({ assignment: a._id }).select("student").lean();
    const students = subs.length
        ? await Student.find({ _id: trusted({ $in: subs.map((s) => s.student) }) })
              .select("studentId")
              .lean()
        : [];

    await withTransaction(async (session) => {
        await Submission.deleteMany({ assignment: a._id }, { session });
        await Assignment.deleteOne({ _id: a._id }, { session });
    });
    await removeStoredPaths([
        folderOf(a._id),
        ...students.map((s) => submissionFolderKey(s.studentId, a._id)),
    ]);
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "assignment.delete",
        target: { type: "assignment", id: String(a._id) },
        meta: { submissions: subs.length },
    });
    return { submissions: subs.length };
}

// ------------------------------------------------------------------ admin: review (FR-ASG-05/06)
/**
 * Every ACTIVE student currently in the assignment's audience, plus anyone who
 * already submitted (even if they changed batch or were deactivated since —
 * FR-ASG-08 keeps their work). Status: submitted | late | missing.
 */
export async function getAssignmentReview(id) {
    await connectDB();
    const a = await getAssignmentAdmin(id);
    const subs = await Submission.find({ assignment: a._id }).lean();
    const scopeFilter =
        a.audience === "class"
            ? { class: trusted({ $in: a.classes }) }
            : { batch: trusted({ $in: a.batches }) };
    const or = [{ status: "active", ...scopeFilter }];
    if (subs.length) or.push({ _id: trusted({ $in: subs.map((s) => s.student) }) });

    const [students, maps] = await Promise.all([
        Student.find({ $or: or }).select("studentId fullName class batch status").lean(),
        labelMaps(),
    ]);
    const subMap = new Map(subs.map((s) => [String(s.student), s]));
    const inScope = (st) =>
        st.status === "active" &&
        (a.audience === "class"
            ? a.classes.some((c) => String(c) === String(st.class))
            : a.batches.some((b) => String(b) === String(st.batch)));

    const rows = students
        .map((st) => {
            const sub = subMap.get(String(st._id));
            return {
                studentObjectId: String(st._id),
                studentId: st.studentId,
                fullName: st.fullName,
                batchLabel: maps.batchMap.get(String(st.batch)) ?? "—",
                classOrder: maps.classOrder.get(String(st.class)) ?? 0,
                inScope: inScope(st),
                inactive: st.status !== "active",
                status: sub ? (sub.isLate ? "late" : "submitted") : "missing",
                submission: sub
                    ? {
                          id: String(sub._id),
                          submittedAt: sub.submittedAt,
                          isLate: sub.isLate,
                          files: sub.files.map((f, i) => ({
                              index: i,
                              originalName: f.originalName,
                              mime: f.mime,
                              size: f.size,
                          })),
                          feedback: sub.feedback ?? "",
                          marks: sub.marks ?? null,
                          reviewedAt: sub.reviewedAt ?? null,
                      }
                    : null,
            };
        })
        .sort(
            (x, y) =>
                x.classOrder - y.classOrder ||
                x.batchLabel.localeCompare(y.batchLabel) ||
                x.fullName.localeCompare(y.fullName),
        );

    const stats = { expected: 0, submitted: 0, late: 0, missing: 0, reviewed: 0 };
    for (const r of rows) {
        if (r.inScope) stats.expected++;
        if (r.status === "submitted") stats.submitted++;
        if (r.status === "late") stats.late++;
        if (r.status === "missing") stats.missing++;
        if (r.submission?.reviewedAt) stats.reviewed++;
    }
    return {
        assignment: a,
        audienceText: audienceLabel(a, maps.classMap, maps.batchMap),
        state: assignmentState(a),
        rows,
        stats,
    };
}

/** FR-ASG-06: feedback + marks on one submission of this assignment. */
export async function reviewSubmission(assignmentId, submissionId, input, actor) {
    await connectDB();
    const $set = { reviewedBy: actor.id, reviewedAt: new Date() };
    const $unset = {};
    if (input.feedback !== undefined) $set.feedback = input.feedback;
    else $unset.feedback = 1;
    if (input.marks !== undefined) $set.marks = input.marks;
    else $unset.marks = 1;
    const res = await Submission.updateOne(
        { _id: submissionId, assignment: assignmentId },
        Object.keys($unset).length ? { $set, $unset } : { $set },
        { runValidators: true },
    );
    if (!res.matchedCount) throw new ServiceError("not_found", "Submission not found.");
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "submission.review",
        target: { type: "submission", id: String(submissionId) },
    });
}

/** Submissions with their students, for the ZIP download. */
export async function listSubmissionFilesForZip(id) {
    await connectDB();
    const a = await Assignment.findById(id).select("title").lean();
    if (!a) return null;
    const subs = await Submission.find({ assignment: a._id }).select("student files").lean();
    const students = subs.length
        ? await Student.find({ _id: trusted({ $in: subs.map((s) => s.student) }) })
              .select("studentId fullName")
              .lean()
        : [];
    const byId = new Map(students.map((s) => [String(s._id), s]));
    return {
        assignment: a,
        entries: subs
            .map((s) => ({ student: byId.get(String(s.student)), files: s.files }))
            .filter((e) => e.student)
            .sort((x, y) => x.student.studentId.localeCompare(y.student.studentId)),
    };
}

// ------------------------------------------------------------------ student (FR-ASG-02/03/07)
const STUDENT_FIELDS =
    "title type instructions attachment deadline allowLate maxFiles maxFileSizeMB allowedTypes audience classes batches isPublished createdAt";

/** Published assignments in scope + the student's OWN submission status. */
export async function listAssignmentsForStudent(scope, { limit = 200 } = {}) {
    await connectDB();
    const now = new Date();
    const rows = await Assignment.find({ isPublished: true, ...audienceFilter(scope) })
        .sort({ deadline: -1 })
        .limit(limit)
        .select("title type deadline allowLate")
        .lean();
    const subs = rows.length
        ? await Submission.find({
              student: scope.studentObjectId,
              assignment: trusted({ $in: rows.map((r) => r._id) }),
          })
              .select("assignment submittedAt isLate marks reviewedAt")
              .lean()
        : [];
    const subMap = new Map(subs.map((s) => [String(s.assignment), s]));
    const list = rows.map((a) => {
        const sub = subMap.get(String(a._id));
        return {
            ...a,
            status: studentStatus(a, sub, now),
            upcoming: a.deadline > now,
            submittedAt: sub?.submittedAt ?? null,
            marks: sub?.marks ?? null,
            reviewed: !!sub?.reviewedAt,
        };
    });
    // Upcoming first (soonest deadline on top), then past ones (most recent first).
    const upcoming = list.filter((a) => a.upcoming).sort((x, y) => x.deadline - y.deadline);
    const past = list.filter((a) => !a.upcoming);
    return [...upcoming, ...past];
}

/** null (→ 404) unless published and inside the student's scope. */
export async function getAssignmentForStudent(id, scope) {
    await connectDB();
    const a = await Assignment.findById(id).select(STUDENT_FIELDS).lean();
    if (!a || !a.isPublished || !inAudience(a, scope)) return null;
    return a;
}

/** The student's own submission (never anyone else's — FR-ASG-07). */
export async function getOwnSubmission(assignmentId, scope) {
    await connectDB();
    return Submission.findOne({ assignment: oid(assignmentId), student: scope.studentObjectId })
        .select(
            "files.originalName files.size files.sha256 submittedAt isLate feedback marks reviewedAt",
        )
        .lean();
}

const LOCKED_MESSAGE =
    "Your teacher has already reviewed this submission, so it can’t be changed any more.";

/** [DECIDED 2026-09-29] A reviewed submission is final — the student can't replace it. */
export async function isSubmissionLocked(assignmentId, scope) {
    await connectDB();
    return !!(await Submission.exists({
        assignment: oid(assignmentId),
        student: scope.studentObjectId,
        reviewedAt: trusted({ $exists: true }),
    }));
}

/**
 * FR-ASG-03/04: validate staged files and (re)place the student's submission.
 * Order: new files saved → DB updated → old files deleted.
 * @param {string} assignmentId
 * @param {{ studentObjectId: any, studentId: string, classId: any, batchId: any }} scope DB-derived
 * @param {import('../storage/submissions.js').StagedFile[]} staged
 * @param {Date} receivedAt server time the request arrived
 */
export async function submitAssignment(assignmentId, scope, staged, receivedAt = new Date()) {
    const discard = () => removeStoredPaths(staged.map((f) => f.tmpKey));
    const a = await getAssignmentForStudent(assignmentId, scope);
    if (!a) {
        await discard();
        throw new ServiceError("not_found", "Not found.");
    }
    const win = submissionWindow(a, receivedAt);
    if (!win.open) {
        await discard();
        throw new ServiceError("closed", "The deadline has passed — submissions are closed.");
    }
    if (!staged.length) throw new ServiceError("no_file", "Choose at least one file.", "files");
    if (staged.length > a.maxFiles) {
        await discard();
        throw new ServiceError("too_many", `You can upload at most ${a.maxFiles} files.`, "files");
    }
    const tooBig = staged.find((f) => f.size > a.maxFileSizeMB * MB);
    if (tooBig) {
        await discard();
        throw new ServiceError(
            "too_large",
            `“${tooBig.originalName}” is larger than ${a.maxFileSizeMB} MB.`,
            "files",
        );
    }

    if (await isSubmissionLocked(a._id, scope)) {
        await discard();
        throw new ServiceError("locked", LOCKED_MESSAGE);
    }

    const files = await finalizeFiles(staged, {
        allowed: a.allowedTypes,
        dirKey: submissionFolderKey(scope.studentId, a._id),
    });

    // `reviewedAt` must still be missing: a review locks the submission, atomically —
    // a review saved while this upload was running wins (the upsert then hits E11000).
    const upsert = () =>
        Submission.findOneAndUpdate(
            {
                assignment: a._id,
                student: scope.studentObjectId,
                reviewedAt: trusted({ $exists: false }),
            },
            { $set: { files, submittedAt: receivedAt, isLate: win.isLate } },
            { upsert: true, returnDocument: "before", runValidators: true },
        ).lean();
    let previous;
    try {
        try {
            previous = await upsert();
        } catch (err) {
            // E11000 = two first submissions racing on the unique (assignment, student)
            // index, or the existing submission was reviewed (locked). Retry once to tell.
            if (err?.code !== 11000) throw err;
            try {
                previous = await upsert();
            } catch (err2) {
                if (err2?.code === 11000) throw new ServiceError("locked", LOCKED_MESSAGE);
                throw err2;
            }
        }
    } catch (err) {
        await removeStoredPaths(files.map((f) => f.key));
        throw err;
    }
    await removeStoredPaths((previous?.files ?? []).map((f) => f.key)); // only after the DB switch

    return {
        submittedAt: receivedAt,
        isLate: win.isLate,
        replaced: !!previous,
        files: files.map((f) => ({ originalName: f.originalName, size: f.size })),
    };
}

/** Next deadlines the student hasn't handled yet (dashboard). */
export async function upcomingForStudent(scope, n = 3) {
    const list = await listAssignmentsForStudent(scope, { limit: 50 });
    return list.filter((a) => a.upcoming && a.status === "not_submitted").slice(0, n);
}
