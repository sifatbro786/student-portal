// Recommended SEO settings (titles, descriptions, keywords per public page).
//   npm run seed:seo               → only when SEO was never saved (production-safe)
//   npm run seed:seo -- --force    → overwrite what is in Admin → SEO with the defaults
// Edit the values afterwards in Admin → Website → SEO. Public pages pick them up within
// an hour, or immediately on the next save in the admin.
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../server/db.js";
import { seedSiteSeo } from "../server/services/site-content.js";

const force = process.argv.includes("--force");
const MESSAGES = {
    created: "✓ Site content (incl. SEO) created from the defaults",
    updated: force ? "✓ SEO overwritten with the recommended defaults" : "✓ SEO settings added",
    skipped: "• SEO was already set — nothing changed (use -- --force to overwrite)",
};

try {
    await connectDB();
    console.log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    console.log(MESSAGES[await seedSiteSeo({ force })]);
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
