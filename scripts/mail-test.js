// Mail diagnostics:  npm run mail:test -- you@example.com
// Runs each check on its own, so one failure (e.g. the database) never hides another
// (e.g. SMTP). Secrets are never printed — only whether they look right.
//   1) .env values   2) SMTP login   3) send one test email   4) database + mail queue
import { disconnectDB } from "../server/db.js";
import { mailStatus, sendDirect, verifySmtp } from "../server/mail/worker.js";

const to = process.argv[2];
const e = process.env;
let failed = false;

const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg, hint) => {
    failed = true;
    console.log(`  ✗ ${msg}`);
    if (hint) console.log(`    → ${hint}`);
};

/** Human hint for the usual SMTP / Gmail failures. */
function smtpHint(err) {
    const m = `${err.code ?? ""} ${err.responseCode ?? ""} ${err.message}`;
    if (/EAUTH|535|534|Username and Password not accepted|Application-specific password/i.test(m))
        return "Gmail rejected the login. Use a 16-letter App Password (Google Account → Security → 2-Step Verification must be ON → App passwords), not the normal Gmail password. SMTP_USER must be that same Gmail address.";
    if (/ETIMEDOUT|ECONNREFUSED|ESOCKET|ENETUNREACH|timeout/i.test(m))
        return `Could not reach ${e.SMTP_HOST}:${e.SMTP_PORT}. The network/ISP/firewall may block port 465 — try SMTP_PORT=587 (the app then uses STARTTLS).`;
    if (/ENOTFOUND|EAI_AGAIN/i.test(m))
        return "SMTP_HOST can't be resolved — check spelling (smtp.gmail.com) and internet.";
    if (/self.signed|certificate/i.test(m))
        return "TLS certificate problem — an antivirus/proxy may be intercepting mail. Try another network.";
    return null;
}

/** Human hint for the usual MongoDB / Atlas failures. */
function dbHint(err) {
    const m = err.message ?? "";
    if (/querySrv|ESERVFAIL|ECONNREFUSED.*_mongodb\._tcp/i.test(m))
        return "The mongodb+srv:// DNS lookup failed. Change the PC's DNS to 8.8.8.8 / 1.1.1.1, or use Atlas → Connect → Drivers → the older 'standard connection string' (mongodb://…, no +srv).";
    if (/bad auth|Authentication failed/i.test(m))
        return "Wrong database user or password in MONGODB_URI (Atlas → Database Access). Special characters in the password must be URL-encoded.";
    if (/Server selection timed out|ReplicaSetNoPrimary|whitelist|IP.*not allowed/i.test(m))
        return "Atlas refused the connection. Atlas → Network Access → add this computer's IP (and later the VPS IP).";
    return null;
}

console.log("\n1) .env");
for (const k of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MONGODB_URI"]) {
    if (!e[k]) bad(`${k} is empty`);
}
if (e.SMTP_PASS) {
    const p = e.SMTP_PASS;
    if (/\s/.test(p))
        bad(
            "SMTP_PASS contains spaces",
            "Remove the spaces Google shows between the 4-letter groups.",
        );
    else if (p.length !== 16 && /gmail\.com$/i.test(e.SMTP_HOST ?? "gmail.com"))
        bad(`SMTP_PASS is ${p.length} characters`, "A Gmail App Password is exactly 16 letters.");
    else ok("SMTP_PASS looks like an App Password (16 letters)");
}
const fromAddr = /<([^>]+)>/.exec(e.MAIL_FROM ?? "")?.[1] ?? e.MAIL_FROM;
if (fromAddr && e.SMTP_USER && fromAddr.toLowerCase() !== e.SMTP_USER.toLowerCase())
    console.log(
        "  ! MAIL_FROM address differs from SMTP_USER — Gmail will replace it with SMTP_USER.",
    );
if (!(e.ADMIN_NOTIFY_EMAILS ?? "").trim())
    console.log("  ! ADMIN_NOTIFY_EMAILS is empty — nobody gets the admission alerts.");

console.log("\n2) SMTP login");
let smtpOk = false;
try {
    await verifySmtp();
    smtpOk = true;
    ok(`logged in to ${e.SMTP_HOST}:${e.SMTP_PORT}`);
} catch (err) {
    bad(`SMTP login failed: ${err.message}`, smtpHint(err));
}

console.log("\n3) Test email");
if (!to) console.log("  – skipped (run: npm run mail:test -- you@example.com)");
else if (!smtpOk) console.log("  – skipped (fix the SMTP login first)");
else {
    try {
        const info = await sendDirect(to, "student.account.created", {
            firstName: "Test",
            studentId: "TM-0000-0000",
            className: "Mail test",
            email: to,
            loginUrl: `${e.APP_URL}/login`,
        });
        ok(`sent to ${to} (${info.response ?? "accepted"}) — also check Spam`);
    } catch (err) {
        bad(`sending failed: ${err.message}`, smtpHint(err));
    }
}

console.log("\n4) Database + mail queue");
try {
    const s = await mailStatus();
    ok("database reachable");
    console.log("    queue:", Object.keys(s.counts).length ? s.counts : "empty");
    for (const f of s.lastFailures) {
        console.log(
            `    last error [${f.template}, ${f.status}, try ${f.attempts}]: ${f.lastError}`,
        );
    }
    if (s.counts.queued)
        console.log(
            "  ! Queued mails are sent ONLY while `npm run cron` is running (separate terminal).",
        );
} catch (err) {
    bad(`database: ${err.message}`, dbHint(err));
}

console.log(failed ? "\nResult: something needs fixing (see ✗ above).\n" : "\nResult: all good.\n");
process.exitCode = failed ? 1 : 0;
await disconnectDB().catch(() => {});
