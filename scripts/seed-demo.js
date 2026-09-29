// Demo data for local testing.
//   npm run seed:demo              → create/refresh demo data
//   npm run seed:demo -- --reset   → remove all demo data (classes/batches are kept)
// Refuses to run when NODE_ENV=production unless you add --allow-production.
//
// Everything goes through the real services (validation, files, counters, audit),
// so the data looks exactly like data created from the admin panel.
// Demo people use the reserved ".test" domain — no email can ever be delivered.
import sharp from "sharp";
import mongoose from "mongoose";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { connectDB, disconnectDB, trusted } from "../server/db.js";
import { hashPassword } from "../server/auth/password.js";
import { User } from "../server/models/User.js";
import { Student } from "../server/models/Student.js";
import { Admission } from "../server/models/Admission.js";
import { Notice } from "../server/models/Notice.js";
import { Material } from "../server/models/Material.js";
import { Assignment } from "../server/models/Assignment.js";
import { Exam } from "../server/models/Exam.js";
import { ClassModel } from "../server/models/Class.js";
import { Batch } from "../server/models/Batch.js";
import { MailJob } from "../server/models/Jobs.js";
import { Submission } from "../server/models/Submission.js";
import { createStudent, purgeStudent, setStudentActive } from "../server/services/students.js";
import {
    submitAdmission,
    reviewAdmission,
    deleteAdmission,
} from "../server/services/admissions.js";
import { saveNotice, deleteNotice } from "../server/services/notices.js";
import { saveMaterial, deleteMaterial } from "../server/services/materials.js";
import {
    saveAssignment,
    deleteAssignment,
    submitAssignment,
    reviewSubmission,
} from "../server/services/assignments.js";
import { stageFromBuffer } from "../server/storage/submissions.js";
import { saveExam, saveResults, deleteExam } from "../server/services/results.js";
import { generateFeeRecords, bulkSetFeeStatus } from "../server/services/payments.js";
import { FeeRecord } from "../server/models/FeeRecord.js";
import { Testimonial } from "../server/models/Testimonial.js";
import { moderateTestimonial, saveOwnTestimonial } from "../server/services/testimonials.js";
import { periodOf } from "../lib/date.js";
import { SUBMISSION_FILE_TYPES } from "../lib/constants.js";

const DEMO_DOMAIN = "@demo.test";
const PASSWORD = "Demo@1234";
const ADMIN_EMAIL = `staff${DEMO_DOMAIN}`;
const args = new Set(process.argv.slice(2));

if (process.env.NODE_ENV === "production" && !args.has("--allow-production")) {
    console.error(
        "\n✗ NODE_ENV=production. Refusing to seed. Use --allow-production if this really is a test database.\n",
    );
    process.exit(1);
}

// ------------------------------------------------------------------ helpers
const log = (m) => console.log(m);

async function avatar(name, hue) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
<rect width="600" height="600" fill="hsl(${hue} 35% 82%)"/>
<circle cx="300" cy="245" r="120" fill="hsl(${hue} 30% 62%)"/>
<rect x="120" y="390" width="360" height="260" rx="180" fill="hsl(${hue} 30% 55%)"/>
<text x="300" y="560" font-family="Georgia" font-size="64" text-anchor="middle" fill="#fff">${initials}</text></svg>`;
    const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
    return new File([buf], `${initials}.jpg`, { type: "image/jpeg" });
}

async function pdf(title, sections, pages = 2) {
    const doc = await PDFDocument.create();
    const serif = await doc.embedFont(StandardFonts.TimesRoman);
    const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
    for (let p = 0; p < pages; p++) {
        const page = doc.addPage([595, 842]);
        page.drawText("O LEVEL ENGLISH LANGUAGE  -  TAUHID MOSTAFA", {
            x: 56,
            y: 800,
            size: 9,
            font: bold,
            color: rgb(0.48, 0.12, 0.17),
        });
        page.drawText(title, { x: 56, y: 760, size: 20, font: bold });
        let y = 720;
        for (const [h, body] of sections) {
            page.drawText(h, { x: 56, y, size: 13, font: bold });
            y -= 20;
            for (const line of body) {
                page.drawText(line, { x: 56, y, size: 11, font: serif, color: rgb(0.2, 0.2, 0.2) });
                y -= 16;
            }
            y -= 14;
        }
        page.drawText(`Page ${p + 1} of ${pages}`, { x: 500, y: 40, size: 9, font: serif });
    }
    return new File(
        [Buffer.from(await doc.save())],
        `${title.replace(/\W+/g, "-").toLowerCase()}.pdf`,
        { type: "application/pdf" },
    );
}

async function routineImage(label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#fbf9f4"/>
<text x="60" y="110" font-family="Georgia" font-size="56" fill="#7a1e2b">${label}</text>
${["Fri 9:00 - Paper 1 practice", "Sat 9:00 - Paper 2 reading", "Fri 11:00 - Mock test review"].map((t, i) => `<text x="60" y="${240 + i * 110}" font-family="Arial" font-size="40" fill="#1f1a17">${t}</text>`).join("")}</svg>`;
    return new File([await sharp(Buffer.from(svg)).png().toBuffer()], "routine.png", {
        type: "image/png",
    });
}

// ------------------------------------------------------------------ reset
async function reset() {
    const admin = await User.findOne({ email: ADMIN_EMAIL }).lean();
    const actor = { id: String(admin?._id ?? new mongoose.Types.ObjectId()), role: "super_admin" };
    if (admin) {
        for (const a of await Assignment.find({ createdBy: admin._id }).select("_id").lean())
            await deleteAssignment(String(a._id), actor);
        for (const e of await Exam.find({ createdBy: admin._id }).select("_id").lean())
            await deleteExam(String(e._id), actor);
    }
    const students = await Student.find({
        email: trusted({ $regex: `${DEMO_DOMAIN.replace(".", "\\.")}$` }),
    }).lean();
    for (const s of students)
        await purgeStudent(
            String(s._id),
            { confirmStudentId: s.studentId, honorAction: "keep" },
            actor,
        );
    const adms = await Admission.find({
        email: trusted({ $regex: `${DEMO_DOMAIN.replace(".", "\\.")}$` }),
    }).lean();
    for (const a of adms) await deleteAdmission(String(a._id), actor);
    if (admin) {
        for (const n of await Notice.find({ createdBy: admin._id }).select("_id").lean())
            await deleteNotice(String(n._id), actor);
        for (const m of await Material.find({ createdBy: admin._id }).select("_id").lean())
            await deleteMaterial(String(m._id), actor);
        await User.deleteOne({ _id: admin._id });
    }
    log(
        `✓ Removed ${students.length} students, ${adms.length} applications, demo notices/materials/assignments/exams and the demo admin.`,
    );
}

// ------------------------------------------------------------------ seed
const STRUCTURE = [
    { name: "Class 8", order: 1 },
    { name: "Class 9", order: 2 },
    { name: "Class 10", order: 3 },
];
const BATCHES = [
    { name: "A", days: ["fri"], startTime: "09:00", endTime: "11:00", room: "Dhanmondi 13A" },
    { name: "B", days: ["sat"], startTime: "09:00", endTime: "11:00", room: "Dhanmondi 13A" },
    { name: "C", days: ["sun", "tue"], startTime: "17:00", endTime: "19:00", room: "Uttara 2" },
];
const STUDENTS = [
    ["Rafi Hasan", "Class 8", "A"],
    ["Nabila Karim", "Class 8", "B"],
    ["Tahmid Chowdhury", "Class 8", "C"],
    ["Sadia Islam", "Class 9", "A"],
    ["Arian Mahmud", "Class 9", "A"],
    ["Maisha Rahman", "Class 9", "B"],
    ["Ishraq Ahmed", "Class 9", "C"],
    ["Nusrat Jahan", "Class 10", "A"],
    ["Farhan Kabir", "Class 10", "B"],
    ["Samiha Haque", "Class 10", "B"],
    ["Adnan Sarkar", "Class 10", "C"],
    ["Lamia Sultana", "Class 10", "C"],
];

async function seed() {
    const started = new Date();

    // demo admin (plain admin role — handy for testing permissions)
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
        admin = await User.create({
            email: ADMIN_EMAIL,
            name: "Demo Staff",
            role: "admin",
            passwordHash: await hashPassword(PASSWORD),
            mustChangePassword: false,
        });
    }
    const actor = { id: String(admin._id), role: "admin" };

    // classes + batches (upsert; never deleted by --reset)
    const ids = {};
    for (const c of STRUCTURE) {
        const cls = await ClassModel.findOneAndUpdate(
            { name: c.name },
            { $setOnInsert: { name: c.name, order: c.order, isActive: true } },
            { upsert: true, returnDocument: "after" },
        ).lean();
        ids[c.name] = { id: String(cls._id), batches: {} };
        for (const b of BATCHES) {
            const bt = await Batch.findOneAndUpdate(
                { class: cls._id, name: b.name },
                {
                    $setOnInsert: {
                        class: cls._id,
                        name: b.name,
                        schedule: { days: b.days, startTime: b.startTime, endTime: b.endTime },
                        room: b.room,
                        isActive: true,
                    },
                },
                { upsert: true, returnDocument: "after" },
            ).lean();
            ids[c.name].batches[b.name] = String(bt._id);
        }
    }
    log("✓ Classes 8–10 with batches A, B, C");

    // students
    const created = [];
    for (const [i, [name, cls, b]] of STUDENTS.entries()) {
        const email = `${name.split(" ")[0].toLowerCase()}${DEMO_DOMAIN}`;
        if (await User.exists({ email })) continue;
        const s = await createStudent(
            {
                fullName: name,
                email,
                whatsapp: `8801711${String(100000 + i).slice(-6)}`,
                fatherName: `${name.split(" ")[1]} Senior`,
                fatherPhone: `8801811${String(100000 + i).slice(-6)}`,
                motherName: "Mother of " + name.split(" ")[0],
                motherPhone: `8801911${String(100000 + i).slice(-6)}`,
                address: "Dhanmondi, Dhaka",
                institutionType: i % 3 ? "school" : "private",
                institutionName: i % 3 ? "Sunnydale" : undefined,
                class: ids[cls].id,
                batch: ids[cls].batches[b],
                password: PASSWORD,
            },
            actor,
        );
        created.push({ ...s, email, name, cls, b });
    }
    await User.updateMany(
        { email: trusted({ $regex: `${DEMO_DOMAIN.replace(".", "\\.")}$` }), role: "student" },
        { $set: { mustChangePassword: false } },
    );
    const lamia = await Student.findOne({ email: `lamia${DEMO_DOMAIN}` }).lean();
    if (lamia?.status === "active") await setStudentActive(String(lamia._id), false, actor);
    log(
        created.length
            ? `✓ ${created.length} students (password ${PASSWORD}); Lamia is inactive`
            : "• Students already seeded — skipped (use --reset to start over)",
    );

    // admissions
    const APPS = [
        ["Zayan Hossain", "Class 9", 82.5, "pending"],
        ["Tasnim Akter", "Class 9", 91, "pending"],
        ["Rizwan Ali", "Class 8", 74, "pending"],
        ["Mehreen Faruque", "Class 10", 88, "pending"],
        ["Omar Siddique", "Class 10", 79.5, "approved"],
        ["Priya Das", "Class 8", 58, "rejected"],
    ];
    let apps = 0;
    for (const [i, [name, cls, score, status]] of APPS.entries()) {
        const email = `${name.split(" ")[0].toLowerCase()}.apply${DEMO_DOMAIN}`;
        if (await Admission.exists({ email })) continue;
        const { refNo } = await submitAdmission(
            {
                fullName: name,
                class: ids[cls].id,
                preferredBatch: ids[cls].batches[["A", "B", "C"][i % 3]],
                institutionType: "school",
                institutionName: ["Scholastica", "Sunnydale", "Mastermind"][i % 3],
                whatsapp: `8801555${String(200000 + i).slice(-6)}`,
                email,
                address: "House 12, Road 5, Dhanmondi, Dhaka",
                fatherName: `Mr ${name.split(" ")[1]}`,
                fatherPhone: `8801666${String(200000 + i).slice(-6)}`,
                motherName: `Mrs ${name.split(" ")[1]}`,
                motherPhone: `8801777${String(200000 + i).slice(-6)}`,
                score,
            },
            await avatar(name, 10 + i * 50),
            { ipHash: "demo", userAgent: "seed-demo" },
        );
        if (status !== "pending") {
            const a = await Admission.findOne({ refNo }).lean();
            await reviewAdmission(
                String(a._id),
                {
                    status,
                    note:
                        status === "approved"
                            ? "Called parent — joining Batch B"
                            : "Score below cut-off",
                },
                actor,
            );
        }
        apps++;
    }
    log(
        apps
            ? `✓ ${apps} admission applications (4 pending, 1 approved, 1 rejected)`
            : "• Admissions already seeded — skipped",
    );

    // notices
    if (!(await Notice.exists({ createdBy: admin._id }))) {
        const base = {
            classes: [],
            batches: [],
            isPinned: false,
            publishAt: undefined,
            expiresAt: undefined,
            emailAudience: false,
            removeAttachment: false,
        };
        const day = 24 * 60 * 60 * 1000;
        const N = [
            {
                ...base,
                title: "Puja holiday — no classes this Friday",
                audience: "public",
                isPinned: true,
                body: "<p>Classes resume on <strong>Saturday</strong>. Happy holidays!</p>",
            },
            {
                ...base,
                title: "Mock test schedule for October",
                audience: "public",
                body: "<h2>Paper 1</h2><p>Friday, 10 October — 9:00 AM</p><h2>Paper 2</h2><p>Saturday, 11 October — 9:00 AM</p>",
            },
            {
                ...base,
                title: "Bring your past papers folder",
                audience: "all_students",
                body: "<p>Please bring all marked past papers to the next class. We’ll go through common mistakes.</p>",
            },
            {
                ...base,
                title: "Class 9: directed writing workshop",
                audience: "class",
                classes: [ids["Class 9"].id],
                body: "<p>Extra 30 minutes after class on Saturday. <em>Optional but recommended.</em></p>",
            },
            {
                ...base,
                title: "Batch 9A: homework for next week",
                audience: "batches",
                batches: [ids["Class 9"].batches.A],
                body: "<ul><li>Summary writing — 2019 Paper 1</li><li>Vocabulary list 4</li></ul>",
                attach: true,
            },
            {
                ...base,
                title: "Results day announcement",
                audience: "all_students",
                publishAt: new Date(Date.now() + 5 * day),
                body: "<p>This notice is scheduled — students can’t see it yet.</p>",
            },
            {
                ...base,
                title: "Old: registration deadline",
                audience: "all_students",
                publishAt: new Date(Date.now() - 40 * day),
                expiresAt: new Date(Date.now() - 10 * day),
                body: "<p>This one has expired.</p>",
            },
        ];
        for (const { attach, ...n } of N) {
            const file = attach
                ? await pdf(
                      "Homework sheet — Batch 9A",
                      [
                          ["Task 1", ["Summarise the passage in 150 words."]],
                          ["Task 2", ["Learn vocabulary list 4."]],
                      ],
                      1,
                  )
                : null;
            await saveNotice(null, n, file, actor);
        }
        log(
            `✓ ${N.length} notices (public, all students, class, batch + attachment, scheduled, expired)`,
        );
    } else log("• Notices already seeded — skipped");

    // materials
    if (!(await Material.exists({ createdBy: admin._id }))) {
        const m = (o) => ({
            description: undefined,
            classes: [],
            batches: [],
            isPublished: true,
            ...o,
        });
        const M = [
            [
                m({
                    title: "Paper 1 — directed writing notes",
                    type: "note",
                    audience: "batches",
                    batches: [ids["Class 9"].batches.A],
                }),
                await pdf(
                    "Directed writing",
                    [
                        [
                            "Purpose & audience",
                            [
                                "Identify who you are writing to and why.",
                                "Match your tone to the reader.",
                            ],
                        ],
                        ["Structure", ["Opening, 3 developed points, closing."]],
                    ],
                    3,
                ),
            ],
            [
                m({
                    title: "Summary writing — step by step",
                    type: "note",
                    audience: "class",
                    classes: [ids["Class 9"].id],
                }),
                await pdf(
                    "Summary writing",
                    [
                        ["Step 1", ["Read the question twice. Underline the focus."]],
                        ["Step 2", ["Pick 10-12 content points."]],
                    ],
                    2,
                ),
            ],
            [
                m({
                    title: "Narrative writing checklist",
                    type: "note",
                    audience: "class",
                    classes: [ids["Class 10"].id],
                }),
                await pdf(
                    "Narrative checklist",
                    [["Before you write", ["Plan a clear beginning, middle and end."]]],
                    1,
                ),
            ],
            [
                m({
                    title: "2024 Paper 1 (practice)",
                    type: "question_paper",
                    audience: "all_students",
                }),
                await pdf(
                    "Practice Paper 1",
                    [
                        ["Section A", ["Read the passage and answer questions 1-5."]],
                        ["Section B", ["Write a letter of 200-300 words."]],
                    ],
                    2,
                ),
            ],
            [
                m({
                    title: "Class 8 weekly routine",
                    type: "routine",
                    audience: "class",
                    classes: [ids["Class 8"].id],
                }),
                await routineImage("Class 8 - weekly plan"),
            ],
            [
                m({
                    title: "Draft: Paper 2 answers (hidden)",
                    type: "question_paper",
                    audience: "all_students",
                    isPublished: false,
                }),
                await pdf("Paper 2 answers", [["Answers", ["Not yet released."]]], 1),
            ],
        ];
        for (const [input, file] of M) await saveMaterial(null, input, file, actor);
        log(`✓ ${M.length} materials (notes, question papers, routine image, one hidden draft)`);
    } else log("• Materials already seeded — skipped");

    // assignments + submissions (P5)
    if (!(await Assignment.exists({ createdBy: admin._id }))) {
        const HOUR = 60 * 60 * 1000;
        const DAY = 24 * HOUR;
        const now = Date.now();
        const base = {
            instructions: "",
            classes: [],
            batches: [],
            allowLate: false,
            maxFiles: 5,
            maxFileSizeMB: 20,
            allowedTypes: [...SUBMISSION_FILE_TYPES],
            isPublished: true,
            removeAttachment: false,
        };
        const A = {
            open: {
                ...base,
                title: "Summary writing — 2019 Paper 1",
                type: "homework",
                audience: "batches",
                batches: [ids["Class 9"].batches.A],
                deadline: new Date(now + 3 * DAY),
                instructions:
                    "<p>Read the passage on the attached sheet and write a summary of <strong>150 words</strong>.</p><ul><li>Handwritten photos are fine — make sure they are sharp.</li><li>Or upload a PDF / Word file.</li></ul>",
            },
            lateOk: {
                ...base,
                title: "Directed writing: letter to the editor",
                type: "assignment",
                audience: "class",
                classes: [ids["Class 9"].id],
                deadline: new Date(now - 2 * DAY),
                allowLate: true,
                instructions:
                    "<p>Write a letter to the editor about traffic near your school (250–350 words).</p>",
            },
            closed: {
                ...base,
                title: "Vocabulary list 4 — sentences",
                type: "homework",
                audience: "batches",
                batches: [ids["Class 9"].batches.A, ids["Class 9"].batches.B],
                deadline: new Date(now - 5 * DAY),
                instructions: "<p>Use each word from list 4 in a sentence of your own.</p>",
            },
            draft: {
                ...base,
                title: "Presentation: a person who inspires you",
                type: "presentation",
                audience: "class",
                classes: [ids["Class 10"].id],
                deadline: new Date(now + 10 * DAY),
                allowedTypes: ["pptx", "pdf"],
                maxFiles: 2,
                isPublished: false,
                instructions:
                    "<p>5 minutes, 6–8 slides. Hidden until the teacher publishes it.</p>",
            },
            soon: {
                ...base,
                title: "Narrative writing — first draft",
                type: "homework",
                audience: "batches",
                batches: [ids["Class 10"].batches.C],
                deadline: new Date(now + 26 * HOUR),
                instructions:
                    "<p>Write the opening 200 words of a story titled <em>The Visit</em>.</p>",
            },
        };
        const aid = {};
        for (const [k, input] of Object.entries(A)) {
            const file =
                k === "open"
                    ? await pdf(
                          "Summary passage — 2019",
                          [["Passage", ["Read carefully, then summarise in 150 words."]]],
                          1,
                      )
                    : null;
            aid[k] = (await saveAssignment(null, input, file, actor)).id;
        }

        const scopeOf = async (first) => {
            const s = await Student.findOne({ email: `${first}${DEMO_DOMAIN}` }).lean();
            return {
                studentObjectId: s._id,
                studentId: s.studentId,
                fullName: s.fullName,
                classId: s.class,
                batchId: s.batch,
            };
        };
        const work = async (name, title) => {
            const f = await pdf(title, [["Answer", ["Student work for the demo."]]], 1);
            return stageFromBuffer(Buffer.from(await f.arrayBuffer()), name);
        };
        const photo = async (name) => {
            const f = await routineImage("Handwritten page 1");
            return stageFromBuffer(Buffer.from(await f.arrayBuffer()), name);
        };
        const [sadia, arian, maisha] = await Promise.all(["sadia", "arian", "maisha"].map(scopeOf));
        const dl = (k) => A[k].deadline.getTime();
        // open: Sadia on time (PDF + photo); Arian not yet
        await submitAssignment(
            aid.open,
            sadia,
            [await work("summary-sadia.pdf", "Summary"), await photo("page-1.png")],
            new Date(now - 2 * HOUR),
        );
        // late allowed: Sadia on time + reviewed; Maisha late (after the deadline)
        await submitAssignment(
            aid.lateOk,
            sadia,
            [await work("letter.pdf", "Letter")],
            new Date(dl("lateOk") - DAY),
        );
        const sadiaSub = await Submission.findOne({
            assignment: aid.lateOk,
            student: sadia.studentObjectId,
        }).lean();
        await reviewSubmission(
            aid.lateOk,
            String(sadiaSub._id),
            { feedback: "Clear purpose and good tone. Watch your paragraphing.", marks: 17.5 },
            actor,
        );
        await submitAssignment(
            aid.lateOk,
            maisha,
            [await work("maisha-letter.pdf", "Letter")],
            new Date(now - HOUR),
        );
        // closed: Arian on time; Sadia + Maisha missing
        await submitAssignment(
            aid.closed,
            arian,
            [await work("vocab-4.pdf", "Vocabulary")],
            new Date(dl("closed") - 2 * HOUR),
        );
        log(
            "✓ 5 assignments (open 9A, late-allowed Class 9, closed 9A+9B, hidden draft Class 10, due-tomorrow 10C) + 4 submissions",
        );
    } else log("• Assignments already seeded — skipped");

    // exams + results (P6)
    if (!(await Exam.exists({ createdBy: admin._id }))) {
        const sid = async (first) =>
            String((await Student.findOne({ email: `${first}${DEMO_DOMAIN}` }).lean())._id);
        const E = [
            {
                title: "Mock Test 1 — Paper 1",
                class: ids["Class 9"].id,
                batches: [ids["Class 9"].batches.A, ids["Class 9"].batches.B],
                date: new Date("2026-09-11T18:00:00Z"), // 12 Sep, Dhaka
                fullMarks: 50,
                isPublished: true,
                results: [
                    ["sadia", 44, "A*", "Excellent summary — precise and concise."],
                    ["arian", 38.5, "A", ""],
                    ["maisha", 31, "B", "Work on paragraph structure."],
                ],
            },
            {
                title: "Mock Test 2 — Paper 2 (marking in progress)",
                class: ids["Class 9"].id,
                batches: [ids["Class 9"].batches.A, ids["Class 9"].batches.B],
                date: new Date("2026-09-25T18:00:00Z"),
                fullMarks: 50,
                isPublished: false,
                results: [["sadia", 40, "A", ""]],
            },
            {
                title: "Class 10 Mock — Paper 1",
                class: ids["Class 10"].id,
                batches: Object.values(ids["Class 10"].batches),
                date: new Date("2026-09-18T18:00:00Z"),
                fullMarks: 80,
                isPublished: true,
                results: [
                    ["adnan", 66, "A", "Strong narrative voice."],
                    ["nusrat", 71.5, "A*", ""],
                    ["farhan", 52, "B", ""],
                ],
            },
        ];
        for (const { results, ...input } of E) {
            const { id } = await saveExam(null, input, actor);
            const rows = [];
            for (const [first, marks, grade, remark] of results)
                rows.push({
                    student: await sid(first),
                    marks,
                    grade,
                    remark: remark || undefined,
                });
            await saveResults(id, rows, actor);
        }
        log("✓ 3 exams (2 published, 1 hidden) with results");
    } else log("• Exams already seeded — skipped");

    // fee records (P7): current month + the two before, mixed statuses.
    // (Removed by --reset automatically: purging a student deletes their records.)
    const demoIds = (
        await Student.find({
            email: trusted({ $regex: `${DEMO_DOMAIN.replace(".", "\\.")}$` }),
        })
            .select("_id")
            .lean()
    ).map((s) => s._id);
    if (!(await FeeRecord.exists({ student: trusted({ $in: demoIds }), status: "paid" }))) {
        const periods = [2, 1, 0].map((back) => {
            const d = new Date();
            d.setUTCDate(15);
            d.setUTCMonth(d.getUTCMonth() - back);
            return periodOf(d);
        });
        for (const p of periods) await generateFeeRecords(p, { studentIds: demoIds });
        const recs = await FeeRecord.find({ student: trusted({ $in: demoIds }) })
            .select("period")
            .sort({ period: 1, _id: 1 })
            .lean();
        const older = recs.filter((r) => r.period !== periods[2]).map((r) => String(r._id));
        const current = recs.filter((r) => r.period === periods[2]).map((r) => String(r._id));
        // older months: almost everyone paid, one waived; this month: a few paid so far
        await bulkSetFeeStatus(older.slice(0, -3), { status: "paid" }, actor);
        await bulkSetFeeStatus(older.slice(-1), { status: "waived", note: "Scholarship" }, actor);
        await bulkSetFeeStatus(current.slice(0, 4), { status: "paid" }, actor);
        log(`✓ Fee records for ${periods.join(", ")} (paid / due / waived mix)`);
    } else log("• Fee records already seeded — skipped");

    // reviews (P8): three approved + one waiting for approval. DEMO text only — the
    // real site shows real reviews written by students. Removed by --reset (purge).
    if (!(await Testimonial.exists({ student: trusted({ $in: demoIds }) }))) {
        const REVIEWS = [
            [
                "nusrat",
                5,
                "A* · Demo 2026",
                true,
                "Demo review. Sir breaks every Paper 2 question type into small steps, and the weekly mock tests with written feedback made the real exam feel familiar.",
            ],
            [
                "farhan",
                5,
                "A · Demo 2026",
                false,
                "Demo review. My directed writing improved the most — every essay came back with clear comments on what to fix next, and the notes in the portal are easy to revise from.",
            ],
            [
                "samiha",
                4,
                "",
                true,
                "Demo review. Classes are strict but friendly. The grammar drills felt boring at first, but they are exactly why I stopped losing marks in comprehension.",
            ],
            [
                "sadia",
                5,
                "Class 9",
                false,
                "Demo review (waiting for approval). I like that notices, notes and homework are all in one place now.",
            ],
        ];
        for (const [who, rating, resultLine, photo, quote] of REVIEWS) {
            const s = await Student.findOne({ email: `${who}${DEMO_DOMAIN}` })
                .select("studentId fullName")
                .lean();
            if (!s) continue;
            const scope = { studentObjectId: s._id, studentId: s.studentId, fullName: s.fullName };
            const file = photo ? await avatar(s.fullName, (rating * 57) % 360) : null;
            await saveOwnTestimonial(
                scope,
                { quote, rating, resultLine, consent: true, removePhoto: false },
                file,
            );
            if (who !== "sadia") {
                const t = await Testimonial.findOne({ student: s._id }).lean();
                await moderateTestimonial(
                    {
                        id: String(t._id),
                        decision: "approve",
                        version: t.submittedAt.toISOString(),
                        name: t.name,
                        resultLine: t.resultLine,
                        quote: t.quote,
                        isPinned: who === "nusrat",
                    },
                    actor,
                );
            }
        }
        log("✓ 4 demo reviews (3 approved, 1 pending)");
    } else log("• Reviews already seeded — skipped");

    // Seeding queued account/admission emails to fake addresses — drop them.
    const dropped = await MailJob.deleteMany({
        createdAt: trusted({ $gte: started }),
        status: "queued",
    });
    if (dropped.deletedCount) log(`✓ Dropped ${dropped.deletedCount} queued demo emails`);

    log(`
Logins (password for all: ${PASSWORD})
  Admin (not super):  ${ADMIN_EMAIL}
  Student 9A:          sadia${DEMO_DOMAIN}   ← sees the batch-9A notice + notes; 2 assignments handed in; results
  Student 9A:          arian${DEMO_DOMAIN}   ← open 9A homework not yet handed in
  Student 9B:          maisha${DEMO_DOMAIN}  ← must NOT see 9A items; one late submission
  Student 10C:         adnan${DEMO_DOMAIN}   ← homework due in ~26 h (countdown)
  Inactive student:    lamia${DEMO_DOMAIN}   ← login is blocked
`);
}

try {
    await connectDB();
    log(`\nDatabase: ${mongoose.connection.db.databaseName}`);
    if (args.has("--reset")) await reset();
    else await seed();
} catch (err) {
    console.error("\n✗", err?.message ?? err);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
