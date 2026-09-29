import "server-only";
import { Schema, baseOptions, model, FileRefSchema } from "./_shared.js";

// FR-CMS-01 singleton (_id = 'singleton'). Everything on the public site that describes
// the teacher lives here — components never hardcode it. Array order = display order.
// [P8] `contact.venue` + `mapEmbedUrl` became `campuses[]`: the client has two campuses.
const str = (max) => ({ type: String, trim: true, maxlength: max });

// Per-page search snippet. Empty title/description = the page's built-in default.
const PageSeoSchema = new Schema(
    { title: str(70), description: str(170), keywords: [str(60)] },
    { _id: false },
);

const SiteContentSchema = new Schema(
    {
        _id: { type: String, default: "singleton" },
        name: str(80),
        jobTitle: str(120),
        boards: str(200), // "Cambridge Assessment International Education · Pearson Edexcel"
        hero: {
            eyebrow: str(120),
            headline: str(140),
            accent: str(60), // the one italic-serif phrase (PRD §13)
            tagline: str(300),
            note: str(60), // handwritten sticker on the portrait
            photo: FileRefSchema, // falls back to /tauhid.jpeg
            photoWidth: Number,
            photoHeight: Number,
        },
        highlights: [{ _id: false, title: str(80), body: str(240) }], // numbered 01–04
        stats: [{ _id: false, value: str(20), label: str(60) }],
        about: { type: String, default: "" }, // sanitised HTML (SEC-08)
        education: [{ _id: false, degree: str(160), institution: str(160), year: str(20) }],
        experience: [
            {
                _id: false,
                institution: str(120),
                role: str(120),
                from: str(20),
                to: str(20), // "" = present
            },
        ],
        faculties: [str(60)], // marquee: "Scholastica", "Mastermind", …
        campuses: [
            {
                _id: false,
                name: str(60),
                address: str(300),
                schedule: str(160),
                mapUrl: str(600), // Google Maps embed URL (validated)
            },
        ],
        contact: { phone: str(20), whatsapp: str(20), email: str(254) },
        socials: [{ _id: false, platform: str(20), url: str(300) }],
        classInfo: str(1200),
        // /admission copy (the form fields themselves are fixed by FR-ADM-02).
        admission: {
            isOpen: { type: Boolean, default: true },
            headline: str(100),
            accent: str(60),
            intro: str(400),
            closedNote: str(300),
            steps: [{ _id: false, title: str(80), body: str(240) }],
            checklist: [{ _id: false, text: str(120) }],
            faqs: [{ _id: false, question: str(160), answer: str(800) }],
        },
        // Search engines (admin → SEO). Absent until first saved / `npm run seed:seo`.
        seo: {
            keywords: [str(60)],
            googleVerification: str(100),
            bingVerification: str(100),
            pages: {
                home: PageSeoSchema,
                honorBoard: PageSeoSchema,
                gallery: PageSeoSchema,
                notices: PageSeoSchema,
                admission: PageSeoSchema,
            },
        },
    },
    baseOptions,
);

export const SiteContent = model("SiteContent", SiteContentSchema, "sitecontent");
