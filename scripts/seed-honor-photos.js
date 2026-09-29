// Honor Board 2026 photos, cropped from the client's printed "Circle of Excellence"
// board (scripts/data/honor-2026/NN.webp, same order as seed-honor.js).
//   npm run seed:honor-photos
// Run after `npm run seed:honor`. Only fills entries that have NO photo yet — never
// replaces a photo added in the admin. Consent: the client supplied this board for
// public display (decision 2026-09-29), so these entries are marked consentConfirmed.
// Better originals can replace them any time in Admin → Honor board.
import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../server/db.js";
import { HonorEntry } from "../server/models/Honor.js";
import { saveHonorEntry } from "../server/services/honor.js";

const YEAR = 2026;
const NAMES = [
    "Ahnaf Safat",
    "Anjela Rahman",
    "Azfer Zawad Raiyan",
    "Arafat Rahman Saad",
    "Ariba Nur Naba",
    "Aysha Afreen",
    "BM Abrar Jahin",
    "Dipon Ghosh Surja",
    "Farhaan Zaman",
    "Md Sifat Ullah",
    "Md Azmain Azoaf",
    "Shakib Al Hassan",
    "Sazzad Shahrar",
    "Sabria Nawal",
    "Sayem Bin Salim",
    "Shafin Zaman",
    "Swastik Sen Sarma",
    "Saima Showkat Siha",
    "Tasfia Amin Zenisa",
    "Zara Khan",
];
const actor = { id: undefined, role: "system" };

try {
    await connectDB();
    console.log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    let added = 0;
    let skipped = 0;
    for (const [i, name] of NAMES.entries()) {
        const e = await HonorEntry.findOne({ year: YEAR, name }).lean();
        if (!e) {
            console.log(`• ${name}: no ${YEAR} entry (run npm run seed:honor first) — skipped`);
            skipped++;
            continue;
        }
        if (e.photo) {
            skipped++;
            continue;
        }
        const n = String(i + 1).padStart(2, "0");
        const buf = await readFile(new URL(`./data/honor-${YEAR}/${n}.webp`, import.meta.url));
        await saveHonorEntry(
            String(e._id),
            {
                year: e.year,
                name: e.name,
                grade: e.grade,
                percentage: e.percentage,
                school: e.school,
                consentConfirmed: true,
                isPublished: e.isPublished,
                removePhoto: false,
            },
            new File([buf], `${n}.webp`, { type: "image/webp" }),
            actor,
        );
        added++;
    }
    console.log(`✓ Photos added: ${added} · already had a photo / skipped: ${skipped}`);
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
