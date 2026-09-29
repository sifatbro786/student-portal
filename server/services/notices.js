import "server-only";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { connectDB, trusted } from "../db.js";
import { Notice } from "../models/Notice.js";
import { Student } from "../models/Student.js";
import { ClassModel } from "../models/Class.js";
import { Batch } from "../models/Batch.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";
import { enqueueMail } from "../mail/queue.js";
import { env } from "../env.js";
import { log } from "../log.js";
import { sanitizeRichText, htmlToText } from "../sanitize.js";
import { saveDocument } from "../storage/files.js";
import { removeStoredPaths } from "../storage/delete.js";
import { audienceFilter, audienceLabel, inAudience, resolveTargets } from "./audience.js";
import { escapeRegex } from "../validators/common.js";

export const NOTICE_ATTACHMENT_MAX = 10 * 1024 * 1024;
const BCC_CHUNK = 50; // FR-NOT-04 / PRD §9 Gmail limits
const GMAIL_DAILY_SOFT_LIMIT = 450;

const folderOf = (id) => `private/notices/${id}`;

function slugify(title) {
    const base = title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    return `${base || "notice"}-${randomBytes(3).toString("hex")}`;
}

/** Visible right now: published and not expired (FR-NOT-03). */
const liveFilter = (now = new Date()) => ({
    publishAt: trusted({ $lte: now }),
    $and: [
        {
            $or: [
                { expiresAt: trusted({ $exists: false }) },
                { expiresAt: null },
                { expiresAt: trusted({ $gt: now }) },
            ],
        },
    ],
});

const ORDER = { isPinned: -1, publishAt: -1 };

// ------------------------------------------------------------------ admin
async function labelMaps() {
    const [classes, batches] = await Promise.all([
        ClassModel.find().select("name").lean(),
        Batch.find().select("name class").lean(),
    ]);
    const classMap = new Map(classes.map((c) => [String(c._id), c.name]));
    const batchMap = new Map(
        batches.map((b) => [String(b._id), `${classMap.get(String(b.class)) ?? "?"} ${b.name}`]),
    );
    return { classMap, batchMap };
}

export function noticeState(n, now = new Date()) {
    if (n.publishAt > now) return "scheduled";
    if (n.expiresAt && n.expiresAt <= now) return "expired";
    return "live";
}

export async function listNoticesAdmin({ q, audience, page, pageSize }) {
    await connectDB();
    const filter = {};
    if (audience && audience !== "all") filter.audience = audience;
    if (q) filter.title = trusted({ $regex: escapeRegex(q), $options: "i" });
    const [total, rows, maps] = await Promise.all([
        Notice.countDocuments(filter),
        Notice.find(filter)
            .sort(ORDER)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .select(
                "title audience classes batches isPinned publishAt expiresAt attachment emailedAt",
            )
            .lean(),
        labelMaps(),
    ]);
    return {
        rows: rows.map((n) => ({
            ...n,
            audienceText: audienceLabel(n, maps.classMap, maps.batchMap),
            state: noticeState(n),
        })),
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

export async function getNoticeAdmin(id) {
    await connectDB();
    const n = await Notice.findById(id).lean();
    if (!n) throw new ServiceError("not_found", "Notice not found.");
    return n;
}

/**
 * Create or update (id given). `file` is an optional new attachment.
 * @param {{ id: string, role: string }} actor
 */
export async function saveNotice(id, input, file, actor) {
    await connectDB();
    const existing = id ? await Notice.findById(id).lean() : null;
    if (id && !existing) throw new ServiceError("not_found", "Notice not found.");
    const noticeId = existing?._id ?? new mongoose.Types.ObjectId();
    const targets = await resolveTargets(input.audience, input.classes, input.batches);

    let attachment = existing?.attachment;
    const oldKeys = [];
    if (file && typeof file !== "string" && file.size > 0) {
        attachment = await saveDocument(file, {
            dirKey: folderOf(noticeId),
            maxBytes: NOTICE_ATTACHMENT_MAX,
            field: "attachment",
        });
        if (existing?.attachment?.key) oldKeys.push(existing.attachment.key);
    } else if (input.removeAttachment && existing?.attachment?.key) {
        oldKeys.push(existing.attachment.key);
        attachment = undefined;
    }

    const doc = {
        title: input.title,
        body: sanitizeRichText(input.body),
        audience: input.audience,
        ...targets,
        isPinned: input.isPinned,
        publishAt: input.publishAt ?? existing?.publishAt ?? new Date(),
        expiresAt: input.expiresAt ?? null,
    };

    try {
        if (existing) {
            await Notice.updateOne(
                { _id: noticeId },
                attachment
                    ? { $set: { ...doc, attachment } }
                    : { $set: doc, $unset: { attachment: 1 } },
            );
        } else {
            await Notice.create({
                _id: noticeId,
                ...doc,
                attachment,
                slug: slugify(input.title),
                createdBy: actor.id,
            });
        }
    } catch (err) {
        if (!existing && attachment?.key) await removeStoredPaths([attachment.key]);
        throw err;
    }
    await removeStoredPaths(oldKeys); // after the DB points at the new file

    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: existing ? "notice.update" : "notice.create",
        target: { type: "notice", id: String(noticeId) },
    });

    let emailed = 0;
    if (input.emailAudience) emailed = await broadcastNotice(String(noticeId));
    return { id: String(noticeId), emailed };
}

export async function deleteNotice(id, actor) {
    await connectDB();
    const n = await Notice.findById(id).select("_id").lean();
    if (!n) throw new ServiceError("not_found", "Notice not found.");
    await Notice.deleteOne({ _id: n._id });
    await removeStoredPaths([folderOf(n._id)]);
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "notice.delete",
        target: { type: "notice", id: String(n._id) },
    });
}

/**
 * FR-NOT-04: email the notice to its audience (active students), BCC in chunks
 * of 50, via the mail queue. Returns the recipient count.
 */
export async function broadcastNotice(id) {
    const n = await Notice.findById(id).lean();
    if (!n) return 0;
    const filter = { status: "active" };
    if (n.audience === "class") filter.class = trusted({ $in: n.classes });
    if (n.audience === "batches") filter.batch = trusted({ $in: n.batches });
    const emails = [
        ...new Set(
            (await Student.find(filter).select("email").lean()).map((s) => s.email).filter(Boolean),
        ),
    ];
    if (!emails.length) return 0;
    if (emails.length > GMAIL_DAILY_SOFT_LIMIT) {
        log.warn("notice.broadcast_near_gmail_limit", { recipients: emails.length });
    }
    const { APP_URL, MAIL_FROM, SMTP_USER } = env();
    const self = (MAIL_FROM?.match(/<([^>]+)>/)?.[1] ?? MAIL_FROM ?? SMTP_USER) || undefined;
    const data = {
        title: n.title,
        excerpt: htmlToText(n.body, 500),
        link: `${APP_URL}${n.audience === "public" ? `/notices/${n.slug}` : `/dashboard/notices/${n._id}`}`,
    };
    for (let i = 0; i < emails.length; i += BCC_CHUNK) {
        await enqueueMail({
            to: self ?? "undisclosed-recipients:;",
            bcc: emails.slice(i, i + BCC_CHUNK),
            template: "notice.broadcast",
            data,
        });
    }
    await Notice.updateOne({ _id: n._id }, { $set: { emailedAt: new Date() } });
    log.info("notice.broadcast_queued", {
        recipients: emails.length,
        chunks: Math.ceil(emails.length / BCC_CHUNK),
    });
    return emails.length;
}

// ------------------------------------------------------------------ student (FR-NOT-02/03)
export async function listNoticesForStudent(scope, { page = 1, pageSize = 20 } = {}) {
    await connectDB();
    const filter = { $and: [audienceFilter(scope, { includePublic: true }), liveFilter()] };
    const [total, rows] = await Promise.all([
        Notice.countDocuments(filter),
        Notice.find(filter)
            .sort(ORDER)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .select("title body isPinned publishAt attachment audience")
            .lean(),
    ]);
    return {
        rows: rows.map((n) => ({ ...n, excerpt: htmlToText(n.body, 160), body: undefined })),
        total,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize)),
    };
}

/** 404 (null) unless live and inside the student's scope. */
export async function getNoticeForStudent(id, scope) {
    await connectDB();
    const n = await Notice.findById(id).lean();
    const now = new Date();
    if (!n || n.publishAt > now || (n.expiresAt && n.expiresAt <= now)) return null;
    return inAudience(n, scope, { includePublic: true }) ? n : null;
}

// ------------------------------------------------------------------ public (P8 pages use these)
export async function listPublicNotices({ limit = 5 } = {}) {
    await connectDB();
    return Notice.find({ audience: "public", ...liveFilter() })
        .sort(ORDER)
        .limit(limit)
        .select("title slug body isPinned publishAt")
        .lean();
}

/** One public, live notice by slug (public /notices/[slug]). */
export async function getPublicNoticeBySlug(slug) {
    if (typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
    await connectDB();
    return Notice.findOne({ slug, audience: "public", ...liveFilter() })
        .select("title slug body isPinned publishAt expiresAt attachment updatedAt")
        .lean();
}
