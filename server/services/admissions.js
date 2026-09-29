import "server-only";
import { connectDB, trusted } from "../db.js";
import { Admission } from "../models/Admission.js";
import { ClassModel } from "../models/Class.js";
import { Batch } from "../models/Batch.js";
import { Student } from "../models/Student.js";
import { nextSeq } from "../models/Counter.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { enqueueMail } from "../mail/queue.js";
import { saveImage } from "../storage/files.js";
import { removeStoredPaths } from "../storage/delete.js";
import { admissionFolderKey } from "../storage/paths.js";
import { escapeRegex } from "../validators/common.js";
import { env } from "../env.js";
import { dhakaYear } from "../../lib/date.js";
import { formatPhone, localPhone } from "../../lib/format.js";
import { getSiteContent } from "./site-content.js";
import { TZDate } from "@date-fns/tz";
import { APP_TZ } from "../../lib/constants.js";

export const ADMISSION_PHOTO_MAX = 3 * 1024 * 1024; // FR-ADM-02

/** Public: active classes + active batches for the form. Plain values only. */
export async function admissionFormOptions() {
    await connectDB();
    const [classes, batches] = await Promise.all([
        ClassModel.find({ isActive: true }).sort({ order: 1, name: 1 }).select("name").lean(),
        Batch.find({ isActive: true }).sort({ name: 1 }).select("class name schedule").lean(),
    ]);
    return classes.map((c) => ({
        id: String(c._id),
        name: c.name,
        batches: batches
            .filter((b) => String(b.class) === String(c._id))
            .map((b) => ({ id: String(b._id), name: b.name, schedule: { ...b.schedule } })),
    }));
}

// ------------------------------------------------------------------ public submit (FR-ADM-01..07)
/**
 * @param {ReturnType<import('../validators/admissions.js').admissionSchema['parse']>} input
 * @param {File} photo
 * @param {{ ipHash: string, userAgent: string }} meta
 */
export async function submitAdmission(input, photo, meta) {
    await connectDB();
    const cls = await ClassModel.findOne({ _id: input.class, isActive: true })
        .select("name")
        .lean();
    if (!cls) throw new ServiceError("bad_class", "Please choose a class.", "class");

    let batch = null;
    if (input.preferredBatch) {
        batch = await Batch.findOne({ _id: input.preferredBatch, class: cls._id, isActive: true })
            .select("name")
            .lean();
        if (!batch)
            throw new ServiceError(
                "bad_batch",
                "Pick a batch of the chosen class.",
                "preferredBatch",
            );
    }

    // FR-ADM-06 duplicate guard
    const dup = await Admission.exists({
        class: cls._id,
        status: "pending",
        $or: [{ email: input.email }, { whatsapp: input.whatsapp }],
    });
    if (dup) {
        throw new ServiceError(
            "duplicate",
            "An application for this class with the same email or WhatsApp number is already waiting for review. The office will contact you soon.",
        );
    }

    const year = dhakaYear();
    const refNo = `ADM-${year}-${String(await nextSeq(`admission:${year}`)).padStart(4, "0")}`;
    const folder = admissionFolderKey(refNo);
    const photoRef = await saveImage(photo, { dirKey: folder, maxBytes: ADMISSION_PHOTO_MAX });

    let doc;
    try {
        doc = await Admission.create({
            refNo,
            fullName: input.fullName,
            class: cls._id,
            institution: {
                type: input.institutionType,
                name: input.institutionType === "school" ? input.institutionName : undefined,
            },
            whatsapp: input.whatsapp,
            email: input.email,
            address: input.address,
            father: { name: input.fatherName, phone: input.fatherPhone },
            mother: { name: input.motherName, phone: input.motherPhone },
            photo: photoRef,
            scoreSubmitted: input.score,
            preferredBatch: batch?._id,
            meta: { ip: meta.ipHash, userAgent: String(meta.userAgent ?? "").slice(0, 300) },
        });
    } catch (err) {
        await removeStoredPaths([folder]); // don't leave an orphan photo
        throw err;
    }

    const { APP_URL, ADMIN_NOTIFY_EMAILS } = env();
    const common = { refNo, fullName: input.fullName, className: cls.name };
    await enqueueMail({
        to: ADMIN_NOTIFY_EMAILS,
        template: "admission.received.admin",
        data: {
            ...common,
            batchName: batch ? `Batch ${batch.name}` : "",
            whatsapp: formatPhone(input.whatsapp),
            score: input.score,
            link: `${APP_URL}/admin/admissions/${doc._id}`,
        },
    });
    await enqueueMail({
        to: input.email,
        template: "admission.received.applicant",
        data: {
            ...common,
            firstName: input.fullName.split(" ")[0],
            phone: formatPhone((await getSiteContent()).contact.phone),
        },
    });

    return { refNo };
}

// ------------------------------------------------------------------ admin (FR-ADM-08..11)
function dhakaDayStart(isoDate, addDays = 0) {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(new TZDate(y, m - 1, d + addDays, APP_TZ).getTime());
}

export async function listAdmissions({ status, class: classId, from, to, q, page, pageSize }) {
    await connectDB();
    const filter = {};
    if (status !== "all") filter.status = status;
    if (classId) filter.class = classId;
    if (from || to) {
        const range = {};
        if (from) range.$gte = dhakaDayStart(from);
        if (to) range.$lt = dhakaDayStart(to, 1);
        filter.createdAt = trusted(range);
    }
    if (q) {
        const rx = trusted({ $regex: escapeRegex(q), $options: "i" });
        const or = [{ fullName: rx }, { email: rx }, { refNo: rx }];
        const digits = q.replace(/\D/g, "");
        if (digits.length >= 4) or.push({ whatsapp: trusted({ $regex: escapeRegex(digits) }) });
        filter.$or = or;
    }
    const [total, rows] = await Promise.all([
        Admission.countDocuments(filter),
        Admission.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .select(
                "refNo fullName class whatsapp scoreSubmitted scoreVerified status student createdAt",
            )
            .populate("class", "name")
            .lean(),
    ]);
    return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAdmission(id) {
    await connectDB();
    const a = await Admission.findById(id)
        .populate("class", "name")
        .populate("preferredBatch", "name schedule")
        .populate("reviewedBy", "name")
        .populate("student", "studentId fullName")
        .lean();
    if (!a) throw new ServiceError("not_found", "Application not found.");
    return a;
}

export const countPendingAdmissions = async () => {
    await connectDB();
    return Admission.countDocuments({ status: "pending" });
};

/** @param {{ id: string, role: string }} actor */
export async function reviewAdmission(id, { status, note }, actor) {
    await connectDB();
    const a = await Admission.findById(id).select("status student refNo").lean();
    if (!a) throw new ServiceError("not_found", "Application not found.");
    if (a.student)
        throw new ServiceError("converted", "This application is already a student account.");
    await Admission.updateOne(
        { _id: a._id },
        { $set: { status, statusNote: note, reviewedBy: actor.id, reviewedAt: new Date() } },
    );
    if (a.status !== status) {
        await writeAudit({
            actor: actor.id,
            actorRole: actor.role,
            action: "admission.status",
            target: { type: "admission", id: a.refNo },
            meta: { from: a.status, to: status },
        });
    }
}

/** FR-ADM-03: keep the applicant's value, store the verified one next to it. */
export async function verifyAdmissionScore(id, scoreVerified, actor) {
    await connectDB();
    const res = await Admission.updateOne({ _id: id }, { $set: { scoreVerified } });
    if (!res.matchedCount) throw new ServiceError("not_found", "Application not found.");
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "admission.score_verified",
        target: { type: "admission", id: String(id) },
    });
}

/** FR-ADM-11 */
export async function deleteAdmission(id, actor) {
    await connectDB();
    const a = await Admission.findById(id).select("refNo student").lean();
    if (!a) throw new ServiceError("not_found", "Application not found.");
    await Admission.deleteOne({ _id: a._id });
    if (a.student) await Student.updateOne({ _id: a.student }, { $unset: { admission: 1 } });
    await removeStoredPaths([admissionFolderKey(a.refNo)]);
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "admission.delete",
        target: { type: "admission", id: a.refNo },
    });
}

/**
 * FR-ADM-10: plain values to pre-fill the "Create student" form.
 * Only approved, not-yet-converted applications.
 */
export async function admissionPrefill(id) {
    const a = await getAdmission(id);
    if (a.status !== "approved")
        throw new ServiceError("not_approved", "Approve the application first.");
    if (a.student)
        throw new ServiceError("converted", "This application is already a student account.");
    return {
        admissionId: String(a._id),
        refNo: a.refNo,
        values: {
            fullName: a.fullName,
            email: a.email,
            whatsapp: localPhone(a.whatsapp),
            fatherName: a.father?.name ?? "",
            fatherPhone: localPhone(a.father?.phone),
            motherName: a.mother?.name ?? "",
            motherPhone: localPhone(a.mother?.phone),
            address: a.address ?? "",
            institutionType: a.institution?.type ?? "",
            institutionName: a.institution?.name ?? "",
            class: String(a.class?._id ?? ""),
            batch: a.preferredBatch ? String(a.preferredBatch._id) : "",
        },
    };
}
