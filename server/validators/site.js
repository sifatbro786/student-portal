import { z } from "zod";
import { bdPhone, checkbox, email, objectId, optionalText } from "./common.js";

// ------------------------------------------------------------------ site content (FR-CMS-01)
const line = (max, msg = "Required.") =>
    z
        .string()
        .trim()
        .min(1, msg)
        .max(max, `Max ${max} characters.`)
        .regex(/^[^\p{Cc}<>]*$/u, "Contains invalid characters.");
const opt = (max) =>
    z
        .string()
        .trim()
        .max(max, `Max ${max} characters.`)
        .regex(/^[^\p{Cc}<>]*$/u, "Contains invalid characters.")
        .default("");

/** Only Google Maps embeds may be framed (SEC-07 CSP allows exactly this origin). */
export const mapUrl = z
    .string()
    .trim()
    .max(600)
    .refine((v) => {
        if (!v) return true;
        try {
            const u = new URL(v);
            return (
                u.protocol === "https:" &&
                u.hostname === "www.google.com" &&
                u.pathname.startsWith("/maps") &&
                (u.pathname.startsWith("/maps/embed") || u.searchParams.get("output") === "embed")
            );
        } catch {
            return false;
        }
    }, "Paste a Google Maps embed link (https://www.google.com/maps/embed?…).")
    .default("");

const SOCIAL_HOSTS = {
    facebook: ["facebook.com", "www.facebook.com", "fb.com", "m.facebook.com"],
    youtube: ["youtube.com", "www.youtube.com", "youtu.be"],
    instagram: ["instagram.com", "www.instagram.com"],
    linkedin: ["linkedin.com", "www.linkedin.com"],
};
export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_HOSTS);

const social = z
    .strictObject({ platform: z.enum(SOCIAL_PLATFORMS), url: z.string().trim().max(300) })
    .refine((s) => {
        try {
            const u = new URL(s.url);
            return u.protocol === "https:" && SOCIAL_HOSTS[s.platform].includes(u.hostname);
        } catch {
            return false;
        }
    }, "Use the full https:// link of that platform.");

/** The whole CMS form arrives as one JSON payload (nested lists). Rich text is sanitised in the service. */
export const siteContentSchema = z.strictObject({
    name: line(80),
    jobTitle: line(120),
    boards: opt(200),
    hero: z.strictObject({
        eyebrow: opt(120),
        headline: line(140),
        accent: opt(60),
        tagline: opt(300),
        note: opt(60),
    }),
    highlights: z
        .array(z.strictObject({ title: line(80), body: opt(240) }))
        .max(6, "At most 6 highlights."),
    stats: z.array(z.strictObject({ value: line(20), label: line(60) })).max(4, "At most 4."),
    about: z.string().max(20_000, "The bio is too long."),
    education: z
        .array(z.strictObject({ degree: line(160), institution: opt(160), year: opt(20) }))
        .max(10),
    experience: z
        .array(
            z.strictObject({
                institution: line(120),
                role: opt(120),
                from: opt(20),
                to: opt(20),
            }),
        )
        .max(15),
    faculties: z.array(line(60)).max(12),
    campuses: z
        .array(
            z.strictObject({
                name: line(60),
                address: line(300),
                schedule: opt(160),
                mapUrl,
            }),
        )
        .min(1, "Add at least one campus.")
        .max(4),
    contact: z.strictObject({ phone: bdPhone, whatsapp: bdPhone, email }),
    socials: z.array(social).max(6),
    classInfo: opt(1200),
    admission: z.strictObject({
        isOpen: z.boolean(),
        headline: line(100),
        accent: opt(60),
        intro: opt(400),
        closedNote: opt(300),
        steps: z
            .array(z.strictObject({ title: line(80), body: opt(240) }))
            .min(1, "Add at least one step.")
            .max(6, "At most 6 steps."),
        checklist: z.array(z.strictObject({ text: line(120) })).max(10, "At most 10 items."),
        faqs: z
            .array(z.strictObject({ question: line(160), answer: line(800) }))
            .max(12, "At most 12 questions."),
    }),
});

// ------------------------------------------------------------------ SEO (admin → SEO)
const keywordList = (max) =>
    z
        .array(
            z
                .string()
                .trim()
                .min(2, "Too short.")
                .max(60, "Max 60 characters per keyword.")
                .regex(/^[^\p{Cc}<>"]*$/u, "Contains invalid characters."),
        )
        .max(max, `At most ${max} keywords.`)
        .transform((list) => [...new Map(list.map((k) => [k.toLowerCase(), k])).values()]);

const pageSeo = z.strictObject({
    title: opt(70),
    description: opt(170),
    keywords: keywordList(15),
});

/** Accepts the bare token or the whole `<meta … content="TOKEN">` tag Google/Bing show. */
const verification = z.preprocess(
    (v) => {
        if (typeof v !== "string") return v;
        const m = v.match(/content\s*=\s*["']([^"']*)["']/i);
        return (m ? m[1] : v).trim();
    },
    z
        .string()
        .max(100, "Too long.")
        .regex(/^[A-Za-z0-9_-]*$/, "Paste only the code (letters, numbers, - and _)."),
);

export const siteSeoSchema = z.strictObject({
    keywords: keywordList(20),
    googleVerification: verification,
    bingVerification: verification,
    pages: z.strictObject({
        home: pageSeo,
        honorBoard: pageSeo,
        gallery: pageSeo,
        notices: pageSeo,
        admission: pageSeo,
    }),
});

// ------------------------------------------------------------------ testimonials
const REVIEW_TEXT = /^[^\p{Cc}<>]*$/u;
export const TESTIMONIAL_FIELDS = ["quote", "rating", "resultLine", "consent", "removePhoto"];

/** Student form. Quote is plain text: newlines allowed, markup never. */
export const testimonialSchema = z.strictObject({
    quote: z.preprocess(
        (v) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n") : v),
        z
            .string()
            .trim()
            .min(40, "Write at least a couple of sentences (40+ characters).")
            .max(600, "Keep it under 600 characters.")
            .refine(
                (v) => !/[<>]/.test(v) && !/[\u0000-\u0009\u000B-\u001F\u007F]/.test(v),
                "Contains invalid characters.",
            ),
    ),
    rating: z.coerce
        .number({ error: "Pick a rating." })
        .int()
        .min(1, "Pick a rating.")
        .max(5, "Pick a rating."),
    resultLine: optionalText(60).refine((v) => !v || REVIEW_TEXT.test(v), "Invalid characters."),
    consent: checkbox.refine((v) => v, "Tick this so your review can appear on the website."),
    removePhoto: checkbox,
});

/** Admin moderation: fix typos / result line, then approve or reject. */
export const testimonialModerationSchema = z.strictObject({
    id: objectId,
    decision: z.enum(["approve", "reject", "pending"]),
    version: z.iso.datetime({ error: "Reload the page and try again." }), // submittedAt the admin saw
    name: z.string().trim().min(2).max(80).regex(REVIEW_TEXT, "Invalid characters."),
    resultLine: optionalText(60).refine((v) => !v || REVIEW_TEXT.test(v), "Invalid characters."),
    quote: testimonialSchema.shape.quote,
    statusNote: optionalText(300),
    isPinned: checkbox,
});

// ------------------------------------------------------------------ gallery
export const GALLERY_CATEGORIES = /** @type {const} */ (["classroom", "students", "events"]);
export const GALLERY_CATEGORY_LABELS = {
    classroom: "Classroom",
    students: "Students",
    events: "Events",
};

export const GALLERY_UPLOAD_FIELDS = ["category", "caption", "consentConfirmed", "isPublished"];
export const galleryUploadSchema = z.strictObject({
    category: z.enum(GALLERY_CATEGORIES, { error: "Pick a category." }),
    caption: optionalText(160).refine((v) => !v || REVIEW_TEXT.test(v), "Invalid characters."),
    consentConfirmed: checkbox,
    isPublished: checkbox,
});

export const galleryEditSchema = z.strictObject({
    id: objectId,
    category: z.enum(GALLERY_CATEGORIES, { error: "Pick a category." }),
    caption: optionalText(160).refine((v) => !v || REVIEW_TEXT.test(v), "Invalid characters."),
    alt: optionalText(200).refine((v) => !v || REVIEW_TEXT.test(v), "Invalid characters."),
    isFeatured: checkbox,
    consentConfirmed: checkbox,
    isPublished: checkbox,
});

export const galleryOrderSchema = z.strictObject({ ids: z.array(objectId).min(1).max(1000) });
