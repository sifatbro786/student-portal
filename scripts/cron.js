// Background jobs (PRD §10) — run as its own PM2 process:
//   npm run cron
// Jobs are added per phase: mail (P3), fee generation (P7), file cleanup (P9).
import cron from "node-cron";
import { processMailQueue } from "../server/mail/worker.js";
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
guarded("mail", () => processMailQueue())(); // don't wait a minute on boot
