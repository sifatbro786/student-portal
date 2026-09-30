// File cleanup (PRD §10) — also runs daily at 03:00 inside `npm run cron`.
//   npm run cleanup:files
// Retries failed deletions, removes staged uploads older than a day and watermark
// copies older than 30 days. Never touches anything else in UPLOAD_ROOT.
import { disconnectDB } from "../server/db.js";
import { runFileCleanup } from "../server/services/cleanup.js";

try {
    const r = await runFileCleanup();
    console.log("\n✓ Cleanup finished:", JSON.stringify(r));
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
