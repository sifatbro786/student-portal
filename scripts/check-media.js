// Which database records point at files that are NOT on this server's disk?
//   npm run check:media
// Read-only. Typical cause: a seed or an upload ran on another computer that shares the
// same database (e.g. a laptop using the production Atlas URI), so the files stayed there.
import { access } from "node:fs/promises";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../server/db.js";
import { resolveKey, uploadRoot } from "../server/storage/paths.js";
import { HonorEntry } from "../server/models/Honor.js";
import { GalleryImage } from "../server/models/GalleryImage.js";
import { Testimonial } from "../server/models/Testimonial.js";
import { SiteContent } from "../server/models/SiteContent.js";
import { Admission } from "../server/models/Admission.js";
import { Student } from "../server/models/Student.js";
import { Material } from "../server/models/Material.js";
import { Notice } from "../server/models/Notice.js";
import { Assignment } from "../server/models/Assignment.js";
import { Submission } from "../server/models/Submission.js";

const CHECKS = [
    ["Honor board", HonorEntry, ["photo", "thumb"], (d) => `${d.year} · ${d.name}`],
    ["Gallery", GalleryImage, ["image", "thumb"], (d) => d.caption || String(d._id)],
    ["Reviews", Testimonial, ["photo", "publicPhoto"], (d) => String(d._id)],
    ["Hero photo", SiteContent, ["hero.photo"], () => "site"],
    ["Admissions", Admission, ["photo"], (d) => d.refNo],
    ["Students", Student, ["photo"], (d) => d.studentId],
    ["Materials", Material, ["file"], (d) => d.title],
    ["Notices", Notice, ["attachment"], (d) => d.title],
    ["Assignments", Assignment, ["attachment"], (d) => d.title],
    ["Submissions", Submission, ["files"], (d) => String(d._id)],
];

const get = (doc, path) => path.split(".").reduce((v, k) => v?.[k], doc);
const exists = async (key) => {
    try {
        await access(resolveKey(key));
        return true;
    } catch {
        return false;
    }
};

let totalMissing = 0;
try {
    await connectDB();
    console.log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    console.log(`Files:    ${uploadRoot()}\n`);
    for (const [label, Model, fields, name] of CHECKS) {
        const docs = await Model.find().lean();
        let refs = 0;
        const missing = [];
        for (const d of docs) {
            for (const f of fields) {
                const v = get(d, f);
                for (const ref of Array.isArray(v) ? v : v ? [v] : []) {
                    if (!ref?.key) continue;
                    refs++;
                    if (!(await exists(ref.key))) missing.push(`${name(d)} → ${ref.key}`);
                }
            }
        }
        totalMissing += missing.length;
        console.log(
            `${missing.length ? "✗" : "✓"} ${label.padEnd(12)} ${refs} files, ${missing.length} missing`,
        );
        for (const m of missing.slice(0, 5)) console.log(`    ${m}`);
        if (missing.length > 5) console.log(`    … and ${missing.length - 5} more`);
    }
    console.log(
        totalMissing
            ? "\nMissing files: re-upload them in the admin, or for the 2026 honor board run `npm run seed:honor-photos` (it repairs missing photos).\n"
            : "\nAll files are on this server.\n",
    );
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
