// Honor Board 2026 — the client's real list (project doc CLIENT-INFO.md, FR-HON).
//   npm run seed:honor
// Safe in production: it only adds 2026 when that year has no entries yet (never
// overwrites edits). No photos — those are added in the admin after guardian consent
// (FR-HON-05). Names are public on the client's printed board.
// The public page's cache refreshes within an hour, or immediately on any admin save.
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../server/db.js";
import { HonorEntry } from "../server/models/Honor.js";
import { saveHonorEntry, saveHonorYear } from "../server/services/honor.js";

const YEAR = 2026;
const LIST = [
    ["Ahnaf Safat", "A", 86],
    ["Anjela Rahman", "A*", 91],
    ["Azfer Zawad Raiyan", "A*", 94],
    ["Arafat Rahman Saad", "A", 85],
    ["Ariba Nur Naba", "A", 87],
    ["Aysha Afreen", "A*", 100],
    ["BM Abrar Jahin", "A", 84],
    ["Dipon Ghosh Surja", "A*", 91],
    ["Farhaan Zaman", "A", 87],
    ["Md Sifat Ullah", "A*", 90],
    ["Md Azmain Azoaf", "A*", 90],
    ["Shakib Al Hassan", "A*", 94],
    ["Sazzad Shahrar", "A*", 90],
    ["Sabria Nawal", "A", 83],
    ["Sayem Bin Salim", "A", 84],
    ["Shafin Zaman", "A", 82],
    ["Swastik Sen Sarma", "A", 86],
    ["Saima Showkat Siha", "A", 80],
    ["Tasfia Amin Zenisa", "A*", 95],
    ["Zara Khan", "A*", 96],
];
const actor = { id: undefined, role: "system" };

try {
    await connectDB();
    console.log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    if (await HonorEntry.exists({ year: YEAR })) {
        console.log(`• ${YEAR} already has entries — nothing changed.`);
    } else {
        await saveHonorYear(
            {
                year: YEAR,
                heading: "Circle of Excellence",
                subheading: `Top 20 Achievers : ${YEAR}`,
            },
            actor,
        );
        for (const [name, grade, percentage] of LIST) {
            await saveHonorEntry(
                null,
                {
                    year: YEAR,
                    name,
                    grade,
                    percentage,
                    school: undefined,
                    consentConfirmed: false,
                    isPublished: true, // no photo → no consent needed
                    removePhoto: false,
                },
                null,
                actor,
            );
        }
        console.log(`✓ ${LIST.length} entries for ${YEAR} (published, no photos)`);
    }
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
