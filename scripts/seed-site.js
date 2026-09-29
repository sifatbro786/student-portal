// Website content (FR-CMS-01) from the client's info (project doc CLIENT-INFO.md).
//   npm run seed:site
// Safe in production: it only writes when the content has never been saved, so it
// never overwrites edits made in Admin → Site content. The public pages pick it up
// within an hour, or immediately on the next save in the admin.
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../server/db.js";
import { seedSiteContent } from "../server/services/site-content.js";

try {
    await connectDB();
    console.log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    console.log(
        (await seedSiteContent())
            ? "✓ Site content created from the client's info"
            : "• Site content already exists — nothing changed (edit it in Admin → Site content)",
    );
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
