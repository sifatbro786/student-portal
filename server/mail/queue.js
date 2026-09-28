import "server-only";
import { connectDB } from "../db.js";
import { MailJob } from "../models/Jobs.js";
import { templates } from "./templates.js";
import { log } from "../log.js";

/**
 * Queue an email (non-blocking, PRD §9). Never throws — a mail problem must
 * not fail the user's action. The cron worker sends it.
 * @param {{ to: string[] | string, bcc?: string[], template: keyof typeof templates, data: object }} job
 */
export async function enqueueMail({ to, bcc, template, data }) {
    const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
    if (!recipients.length) return;
    if (!templates[template]) {
        log.error("mail.unknown_template", { template });
        return;
    }
    try {
        await connectDB();
        await MailJob.create({ to: recipients, bcc, template, data });
    } catch (err) {
        log.error("mail.enqueue_failed", { template, err });
    }
}
