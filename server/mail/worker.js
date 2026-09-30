import "server-only";
import nodemailer from "nodemailer";
import { connectDB, trusted } from "../db.js";
import { MailJob } from "../models/Jobs.js";
import { templates } from "./templates.js";
import { env } from "../env.js";
import { log } from "../log.js";

const MAX_ATTEMPTS = 5;
const STALE_LOCK_MS = 10 * 60 * 1000;

let transport;
function getTransport() {
    const e = env();
    if (!e.SMTP_HOST || !e.SMTP_USER || !e.SMTP_PASS) return null; // dev: log instead of send
    transport ??= nodemailer.createTransport({
        host: e.SMTP_HOST,
        port: e.SMTP_PORT,
        secure: e.SMTP_PORT === 465,
        requireTLS: e.SMTP_PORT !== 465, // 587 → STARTTLS, never plain text
        auth: { user: e.SMTP_USER, pass: e.SMTP_PASS },
        pool: true,
        maxConnections: 2,
        // Fail in seconds, not minutes, when the port is blocked or the host is wrong.
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
    });
    return transport;
}

/**
 * Send due mail jobs (PRD §9): claim one job at a time atomically, exponential
 * backoff (1, 2, 4, 8 min), give up after 5 attempts.
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<{ sent: number, failed: number }>}
 */
export async function processMailQueue({ limit = 20 } = {}) {
    await connectDB();
    const now = new Date();
    // Recover jobs from a crashed run.
    await MailJob.updateMany(
        { status: "sending", lockedAt: trusted({ $lt: new Date(now - STALE_LOCK_MS) }) },
        { $set: { status: "queued" } },
    );

    const t = getTransport();
    const from = env().MAIL_FROM ?? env().SMTP_USER;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < limit; i++) {
        const job = await MailJob.findOneAndUpdate(
            { status: "queued", nextAttemptAt: trusted({ $lte: new Date() }) },
            { $set: { status: "sending", lockedAt: new Date() }, $inc: { attempts: 1 } },
            { sort: { nextAttemptAt: 1 }, returnDocument: "after" },
        ).lean();
        if (!job) break;

        try {
            const msg = templates[job.template]?.(job.data ?? {});
            if (!msg) throw new Error(`Unknown template ${job.template}`);
            if (t) {
                await t.sendMail({ from, to: job.to, bcc: job.bcc, ...msg });
            } else {
                log.info("mail.dev_outbox", {
                    template: job.template,
                    to: job.to.length,
                    subject: msg.subject,
                });
            }
            await MailJob.updateOne(
                { _id: job._id },
                { $set: { status: "sent", sentAt: new Date() }, $unset: { lastError: 1 } },
            );
            sent++;
        } catch (err) {
            const giveUp = job.attempts >= MAX_ATTEMPTS;
            await MailJob.updateOne(
                { _id: job._id },
                {
                    $set: {
                        status: giveUp ? "failed" : "queued",
                        lastError: String(err?.message ?? err).slice(0, 500),
                        nextAttemptAt: new Date(Date.now() + 60_000 * 2 ** (job.attempts - 1)),
                    },
                },
            );
            log.error("mail.send_failed", {
                template: job.template,
                attempt: job.attempts,
                giveUp,
                err,
            });
            failed++;
        }
    }
    if (sent || failed) log.info("mail.batch", { sent, failed });
    return { sent, failed };
}

/** Queue health + SMTP config, for `npm run cron` boot and `npm run mail:test`. */
export async function mailStatus() {
    await connectDB();
    const rows = await MailJob.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
    const counts = Object.fromEntries(rows.map((r) => [r._id, r.n]));
    const lastFailures = await MailJob.find({ lastError: trusted({ $exists: true }) })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("template status attempts lastError updatedAt")
        .lean();
    return { counts, smtpConfigured: !!getTransport(), lastFailures };
}

/** Log in to the SMTP server without sending anything. Throws with the server's reason. */
export async function verifySmtp() {
    const t = getTransport();
    if (!t) throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASS are not all set");
    await t.verify();
}

/** Send one message immediately (bypasses the queue) — diagnostics only. */
export async function sendDirect(to, template, data) {
    const t = getTransport();
    if (!t) throw new Error("SMTP is not configured");
    const msg = templates[template](data);
    return t.sendMail({ from: env().MAIL_FROM ?? env().SMTP_USER, to, ...msg });
}
