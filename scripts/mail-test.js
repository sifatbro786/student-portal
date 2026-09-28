// Mail diagnostics:  npm run mail:test -- you@example.com
// 1) shows the queue, 2) logs in to SMTP, 3) sends one test email right now.
import { disconnectDB } from "../server/db.js";
import { mailStatus, sendDirect, verifySmtp } from "../server/mail/worker.js";

const to = process.argv[2];
try {
    const s = await mailStatus();
    console.log("\nQueue:", s.counts, "\nSMTP configured:", s.smtpConfigured);
    for (const f of s.lastFailures) {
        console.log(
            `  last error [${f.template}, ${f.status}, attempt ${f.attempts}]: ${f.lastError}`,
        );
    }

    process.stdout.write("\nSMTP login… ");
    await verifySmtp();
    console.log("OK");

    if (to) {
        process.stdout.write(`Sending a test email to ${to}… `);
        const info = await sendDirect(to, "student.account.created", {
            firstName: "Test",
            studentId: "TM-0000-0000",
            className: "Mail test",
            email: to,
            loginUrl: process.env.APP_URL + "/login",
        });
        console.log("OK", info.response ?? "");
    } else {
        console.log("(pass an email address to also send a test message)");
    }
} catch (err) {
    console.log("FAILED");
    console.error("\nReason:", err.message);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
