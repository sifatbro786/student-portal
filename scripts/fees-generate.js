// Create the month's `due` fee records by hand (back-fill or a missed cron run).
//   npm run fees:generate                → current month (Asia/Dhaka)
//   npm run fees:generate -- 2026-10     → a specific month
// Idempotent: existing records (and their paid/waived status) are never touched.
import { connectDB, disconnectDB } from "../server/db.js";
import { generateFeeRecords } from "../server/services/payments.js";

const period = process.argv[2];
try {
    await connectDB();
    const r = await generateFeeRecords(period || undefined);
    console.log(`✓ ${r.period}: ${r.created} new record(s) for ${r.students} active student(s)`);
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
