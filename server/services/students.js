import "server-only";
import { connectDB, trusted, withTransaction } from "../db.js";
import { User } from "../models/User.js";
import { Student } from "../models/Student.js";
import { nextSeq } from "../models/Counter.js";
import { BatchChangeLog } from "../models/BatchChangeLog.js";
import { Submission } from "../models/Submission.js";
import { ResultEntry } from "../models/Exam.js";
import { FeeRecord } from "../models/FeeRecord.js";
import { HonorEntry } from "../models/Honor.js";
import { Admission } from "../models/Admission.js";
import { hashPassword } from "../auth/password.js";
import { assertActiveBatchOfClass } from "./academics.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { removeStoredPaths } from "../storage/delete.js";
import { admissionFolderKey, studentFolderKey } from "../storage/paths.js";
import { escapeRegex } from "../validators/common.js";
import { dhakaYear } from "../../lib/date.js";

/** @typedef {{ id: string, role: string }} Actor */

const emailTaken = () =>
    new ServiceError("email_taken", "Another account already uses this email.", "email");

function profileDoc(input) {
    return {
        fullName: input.fullName,
        email: input.email,
        whatsapp: input.whatsapp,
        father: { name: input.fatherName, phone: input.fatherPhone },
        mother: { name: input.motherName, phone: input.motherPhone },
        address: input.address,
        institution: input.institutionType
            ? { type: input.institutionType, name: input.institutionName }
            : undefined,
    };
}

async function loadStudent(id, session) {
    const s = await Student.findById(id).session(session ?? null);
    if (!s) throw new ServiceError("not_found", "Student not found.");
    return s;
}

// ------------------------------------------------------------------ create (FR-STU-01/02)
/** @param {Actor} actor */
export async function createStudent(input, actor) {
    const passwordHash = await hashPassword(input.password); // outside the txn — bcrypt is slow
    const year = dhakaYear();
    let created;
    try {
        created = await withTransaction(async (session) => {
            await assertActiveBatchOfClass(input.class, input.batch, { session });
            if (await User.exists({ email: input.email }).session(session ?? null))
                throw emailTaken();

            const [user] = await User.create(
                [
                    {
                        email: input.email,
                        name: input.fullName,
                        role: "student",
                        passwordHash,
                        mustChangePassword: true,
                    },
                ],
                { session },
            );
            const seq = await nextSeq(`student:${year}`, session);
            const studentId = `TM-${year}-${String(seq).padStart(4, "0")}`;
            const [student] = await Student.create(
                [
                    {
                        ...profileDoc(input),
                        user: user._id,
                        studentId,
                        class: input.class,
                        batch: input.batch,
                        status: "active",
                    },
                ],
                { session },
            );
            return { id: String(student._id), studentId };
        });
    } catch (err) {
        if (err?.code === 11000 && /email/.test(err.message)) throw emailTaken();
        throw err;
    }
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "student.create",
        target: { type: "student", id: created.studentId },
    });
    return created;
}

// ------------------------------------------------------------------ list (FR-STU-03)
export async function listStudents({ q, class: classId, batch, status, page, pageSize }) {
    await connectDB();
    const filter = {};
    if (status !== "all") filter.status = status;
    if (classId) filter.class = classId;
    if (batch) filter.batch = batch;
    if (q) {
        const rx = trusted({ $regex: escapeRegex(q), $options: "i" });
        const or = [{ fullName: rx }, { studentId: rx }, { email: rx }];
        const digits = q.replace(/\D/g, "");
        if (digits.length >= 4) or.push({ whatsapp: trusted({ $regex: escapeRegex(digits) }) });
        filter.$or = or;
    }
    const [total, rows] = await Promise.all([
        Student.countDocuments(filter),
        Student.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .select("studentId fullName email whatsapp status class batch createdAt")
            .populate("class", "name")
            .populate("batch", "name schedule")
            .lean(),
    ]);
    return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getStudentDetail(id) {
    await connectDB();
    const s = await Student.findById(id)
        .populate("class", "name")
        .populate("batch", "name schedule isActive")
        .populate("user", "isActive lastLoginAt mustChangePassword")
        .lean();
    if (!s) throw new ServiceError("not_found", "Student not found.");
    const [history, honorCount] = await Promise.all([
        BatchChangeLog.find({ student: s._id })
            .sort({ at: -1 })
            .limit(10)
            .populate("fromClass toClass", "name")
            .populate("fromBatch toBatch", "name")
            .populate("changedBy", "name")
            .lean(),
        HonorEntry.countDocuments({ student: s._id }),
    ]);
    return { ...s, history, honorCount };
}

// ------------------------------------------------------------------ update profile
/** @param {Actor} actor */
export async function updateStudent(id, input, actor) {
    try {
        await withTransaction(async (session) => {
            const s = await loadStudent(id, session);
            if (input.email !== s.email) {
                const clash = await User.exists({
                    email: input.email,
                    _id: trusted({ $ne: s.user }),
                }).session(session ?? null);
                if (clash) throw emailTaken();
            }
            await User.updateOne(
                { _id: s.user },
                { $set: { email: input.email, name: input.fullName } },
                { session },
            );
            const doc = profileDoc(input);
            const $unset = doc.institution ? undefined : { institution: 1 };
            if (!doc.institution) delete doc.institution;
            await Student.updateOne(
                { _id: s._id },
                { $set: doc, ...($unset && { $unset }) },
                { session, runValidators: true },
            );
        });
    } catch (err) {
        if (err?.code === 11000 && /email/.test(err.message)) throw emailTaken();
        throw err;
    }
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "student.update",
        target: { type: "student", id: String(id) },
    });
}

// ------------------------------------------------------------------ batch change (FR-STU-04)
/** @param {Actor} actor */
export async function changeStudentBatch(id, { class: toClass, batch: toBatch, reason }, actor) {
    const studentId = await withTransaction(async (session) => {
        const s = await loadStudent(id, session);
        if (String(s.batch) === toBatch)
            throw new ServiceError("same_batch", "The student is already in this batch.", "batch");
        await assertActiveBatchOfClass(toClass, toBatch, { session });
        await BatchChangeLog.create(
            [
                {
                    student: s._id,
                    fromClass: s.class,
                    fromBatch: s.batch,
                    toClass,
                    toBatch,
                    reason,
                    changedBy: actor.id,
                },
            ],
            { session },
        );
        await Student.updateOne(
            { _id: s._id },
            { $set: { class: toClass, batch: toBatch } },
            { session },
        );
        return s.studentId;
    });
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "student.batch_change",
        target: { type: "student", id: studentId },
    });
}

// ------------------------------------------------------------------ deactivate / reactivate (FR-STU-05)
/** @param {Actor} actor */
export async function setStudentActive(id, active, actor) {
    const studentId = await withTransaction(async (session) => {
        const s = await loadStudent(id, session);
        if (active) {
            if (s.status === "active") return s.studentId;
            try {
                await assertActiveBatchOfClass(String(s.class), String(s.batch), { session });
            } catch {
                throw new ServiceError(
                    "inactive_batch",
                    "Their batch is inactive. Change the batch first, then reactivate.",
                );
            }
            await Student.updateOne({ _id: s._id }, { $set: { status: "active" } }, { session });
            await User.updateOne({ _id: s.user }, { $set: { isActive: true } }, { session });
            // P7: upsert the current period's FeeRecord here (FR-PAY-03).
        } else {
            if (s.status === "inactive") return s.studentId;
            await Student.updateOne({ _id: s._id }, { $set: { status: "inactive" } }, { session });
            await User.updateOne(
                { _id: s.user },
                { $set: { isActive: false }, $inc: { tokenVersion: 1 } },
                { session },
            );
        }
        return s.studentId;
    });
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: active ? "student.reactivate" : "student.deactivate",
        target: { type: "student", id: studentId },
    });
}

// ------------------------------------------------------------------ password reset (FR-AUTH-06)
/** @param {Actor} actor */
export async function resetStudentPassword(id, password, actor) {
    await connectDB();
    const s = await Student.findById(id).select("user studentId").lean();
    if (!s) throw new ServiceError("not_found", "Student not found.");
    const passwordHash = await hashPassword(password);
    await User.updateOne(
        { _id: s.user, role: "student" },
        { $set: { passwordHash, mustChangePassword: true }, $inc: { tokenVersion: 1 } },
    );
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "student.password_reset",
        target: { type: "student", id: s.studentId },
    });
}

// ------------------------------------------------------------------ permanent delete (FR-STU-06/07/08)
/** @param {Actor} actor */
export async function purgeStudent(id, { confirmStudentId, honorAction }, actor) {
    await connectDB();
    const s = await Student.findById(id).select("user studentId admission").lean();
    if (!s) throw new ServiceError("not_found", "Student not found.");
    if (confirmStudentId !== s.studentId) {
        throw new ServiceError(
            "confirm_mismatch",
            `Type ${s.studentId} exactly to confirm.`,
            "confirmStudentId",
        );
    }

    const fileKeys = [studentFolderKey(s.studentId)]; // profile photo + all submissions live here

    await withTransaction(async (session) => {
        const opts = { session };
        if (s.admission) {
            const adm = await Admission.findById(s.admission)
                .select("refNo")
                .session(session ?? null)
                .lean();
            if (adm) {
                fileKeys.push(admissionFolderKey(adm.refNo));
                await Admission.deleteOne({ _id: adm._id }, opts);
            }
        }
        if (honorAction === "delete") {
            const entries = await HonorEntry.find({ student: s._id })
                .select("photo")
                .session(session ?? null)
                .lean();
            for (const e of entries) if (e.photo?.key) fileKeys.push(e.photo.key);
            await HonorEntry.deleteMany({ student: s._id }, opts);
        } else {
            // The entry keeps its own copy of name/photo (FR-HON-01) — just unlink.
            await HonorEntry.updateMany({ student: s._id }, { $unset: { student: 1 } }, opts);
        }
        // Sequential on purpose: parallel ops on one transaction session are unsafe.
        await Submission.deleteMany({ student: s._id }, opts);
        await ResultEntry.deleteMany({ student: s._id }, opts);
        await FeeRecord.deleteMany({ student: s._id }, opts);
        await BatchChangeLog.deleteMany({ student: s._id }, opts);
        await Student.deleteOne({ _id: s._id }, opts);
        await User.deleteOne({ _id: s.user }, opts);
    });

    await removeStoredPaths(fileKeys); // after commit only
    // FR-STU-08: no PII — only the non-personal student code.
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "student.purge",
        target: { type: "student", id: s.studentId },
    });
    return { studentId: s.studentId };
}

/** Count for dashboard cards. */
export async function countStudents() {
    await connectDB();
    const [active, inactive] = await Promise.all([
        Student.countDocuments({ status: "active" }),
        Student.countDocuments({ status: "inactive" }),
    ]);
    return { active, inactive };
}
