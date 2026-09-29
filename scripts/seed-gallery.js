// TEMPORARY gallery photos from Unsplash (free licence) until the client sends real
// class photos. They are flagged "placeholder" in the admin so they're easy to replace.
//   npm run seed:gallery               → download + add them (skips if placeholders exist)
//   npm run seed:gallery -- --reset    → remove every placeholder photo
//   npm run seed:gallery -- --dir <folder>   → use local .jpg/.png/.webp files instead
// Needs internet access (unsplash.com). Photos go through the same pipeline as admin
// uploads (magic bytes, EXIF stripped, WebP). The public page refreshes within an hour,
// or immediately on the next gallery save in the admin.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../server/db.js";
import { GalleryImage } from "../server/models/GalleryImage.js";
import { addGalleryImage, removeGalleryPlaceholders } from "../server/services/gallery.js";

// [unsplash id, category, caption, alt, featured on homepage]
const PHOTOS = [
    [
        "zFSo6bnZJTw",
        "classroom",
        "A focused lesson",
        "Students in a classroom while the teacher presents",
        true,
    ],
    [
        "BCBGahg0MH0",
        "students",
        "Reading together",
        "Students reading from open textbooks at their desks",
        true,
    ],
    ["NTur2_QKpg0", "students", "Questions welcome", "A student raising a hand in class", true],
    [
        "Z-fq3wBVfMU",
        "classroom",
        "Before the bell",
        "Students sitting in front of a chalkboard",
        false,
    ],
    [
        "lsyl3kpQgIU",
        "students",
        "Group practice",
        "Young people working together around a table",
        true,
    ],
    ["GDokEYnOfnE", "students", "Writing practice", "A student writing on paper", false],
    [
        "PDRFeeDniCk",
        "classroom",
        "Our classroom",
        "A quiet classroom with desks and a chalkboard",
        true,
    ],
    [
        "333oj7zFsdg",
        "events",
        "Marking and feedback",
        "A red pen correcting written work in a notebook",
        true,
    ],
    [
        "KXtTWJZgw8g",
        "students",
        "Study circle",
        "Students sitting together looking at a book",
        false,
    ],
    ["omeaHbEFlN4", "students", "Revision session", "Two students reading and taking notes", false],
    [
        "dFohf_GUZJ0",
        "classroom",
        "Morning light",
        "An empty classroom with wooden desks and windows",
        false,
    ],
    [
        "TB5HpfJf7mA",
        "events",
        "Between classes",
        "Students talking and laughing in a lecture hall",
        false,
    ],
];

const args = process.argv.slice(2);
const dirArg = args.includes("--dir") ? args[args.indexOf("--dir") + 1] : null;
const actor = { id: undefined, role: "system" };

async function fromUnsplash(id) {
    const res = await fetch(`https://unsplash.com/photos/${id}/download?force=true&w=1600`, {
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return new File([buf], `${id}.jpg`, { type: res.headers.get("content-type") ?? "" });
}

try {
    await connectDB();
    console.log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    if (args.includes("--reset")) {
        console.log(`✓ Removed ${await removeGalleryPlaceholders(actor)} placeholder photos`);
    } else if (await GalleryImage.exists({ isPlaceholder: true })) {
        console.log("• Placeholder photos already exist — nothing changed (use --reset first)");
    } else {
        const local = dirArg
            ? (await readdir(dirArg)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
            : null;
        let added = 0;
        // Oldest first: each new photo goes to the top, so reverse to keep the list order.
        for (const [i, [id, category, caption, alt, isFeatured]] of [
            ...PHOTOS.entries(),
        ].reverse()) {
            try {
                let file;
                if (local) {
                    if (!local[i]) continue;
                    const buf = await readFile(path.join(dirArg, local[i]));
                    file = new File([buf], local[i]);
                } else file = await fromUnsplash(id);
                await addGalleryImage(
                    file,
                    {
                        category,
                        caption,
                        alt,
                        isFeatured,
                        consentConfirmed: true, // stock photo — model release by Unsplash
                        isPublished: true,
                        isPlaceholder: true,
                        credit: local ? "Placeholder photo" : `Photo: Unsplash (${id})`,
                    },
                    actor,
                );
                added++;
                process.stdout.write(".");
            } catch (err) {
                console.log(`\n• ${id}: ${err?.message ?? err} — skipped`);
            }
        }
        console.log(`\n✓ ${added} placeholder photos added (replace them with real class photos)`);
    }
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
