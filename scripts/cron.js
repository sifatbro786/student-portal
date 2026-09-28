// Background jobs (PRD §10) — run as its own PM2 process:
//   npm run cron
// Jobs are added per phase: mail (P3), fee generation (P7), file cleanup (P9).
import cron from "node-cron";
import { mailStatus, processMailQueue, verifySmtp } from "../server/mail/worker.js";
import { log } from "../server/log.js";

const TZ = "Asia/Dhaka";

/** Wrap a job so a slow run never overlaps the next tick. */
function guarded(name, fn) {
    let running = false;
    return async () => {
        if (running) return;
        running = true;
        try {
            await fn();
        } catch (err) {
            log.error(`cron.${name}.failed`, { err });
        } finally {
            running = false;
        }
    };
}

cron.schedule(
    "* * * * *",
    guarded("mail", () => processMailQueue()),
    { timezone: TZ },
);

log.info("cron.started", { jobs: ["mail (every minute)"], tz: TZ });

// Boot diagnostics: say clearly whether mail can actually go out.
try {
    const status = await mailStatus();
    log.info("mail.queue", { ...status.counts, smtpConfigured: status.smtpConfigured });
    if (status.smtpConfigured) {
        await verifySmtp()
            .then(() => log.info("mail.smtp_ok"))
            .catch((err) => log.error("mail.smtp_login_failed", { reason: err.message }));
    } else {
        log.warn("mail.smtp_missing", { note: "mails are only logged (dev outbox), not sent" });
    }
} catch (err) {
    log.error("mail.status_failed", { err });
}
guarded("mail", () => processMailQueue())(); // don't wait a minute on boot
