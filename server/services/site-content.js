import "server-only";
import { connectDB, trusted } from "../db.js";
import { SiteContent } from "../models/SiteContent.js";
import { writeAudit } from "../audit.js";
import { sanitizeRichText } from "../sanitize.js";
import { saveImageSet } from "../storage/files.js";
import { removeStoredPaths } from "../storage/delete.js";
import { mediaUrl } from "./honor.js";
import { SITE_DEFAULTS } from "../../lib/site-defaults.js";

// FR-CMS. Script-safe (no next/cache) — the cached public reader is in site-public.js.
export const SITE_TAG = "site-content";
export const HERO_PHOTO_MAX = 8 * 1024 * 1024;
// Straightened crop of the client’s /tauhid.jpeg until a professional portrait is uploaded.
export const HERO_FALLBACK = { url: "/brand/tauhid-portrait.jpg", width: 716, height: 895 };

const ID = "singleton";
const audit = (actor, action, meta) =>
    writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action,
        target: { type: "site", id: ID },
        meta,
    });

/**
 * The singleton as plain JSON, defaults filled in for anything never saved.
 * `hero.photoUrl` is always usable (falls back to the bundled portrait).
 */
export async function getSiteContent() {
    await connectDB();
    return shapeSiteContent(await SiteContent.findById(ID).lean());
}

/** Pure: stored doc (or null) → public shape. `shapeSiteContent(null)` = the defaults. */
export function shapeSiteContent(doc) {
    const d = SITE_DEFAULTS;
    const s = doc ?? {};
    const hero = doc ? (s.hero ?? {}) : d.hero;
    const photoUrl = s.hero?.photo?.key ? mediaUrl(s.hero.photo.key) : null;
    return {
        exists: !!doc,
        name: s.name || d.name,
        jobTitle: s.jobTitle || d.jobTitle,
        boards: s.boards ?? d.boards,
        hero: {
            eyebrow: hero.eyebrow ?? "",
            headline: hero.headline ?? "",
            accent: hero.accent ?? "",
            tagline: hero.tagline ?? "",
            note: hero.note ?? "",
            hasPhoto: !!photoUrl,
            photoUrl: photoUrl ?? HERO_FALLBACK.url,
            photoWidth: photoUrl ? s.hero.photoWidth : HERO_FALLBACK.width,
            photoHeight: photoUrl ? s.hero.photoHeight : HERO_FALLBACK.height,
        },
        highlights: plain(doc ? s.highlights : d.highlights),
        stats: plain(doc ? s.stats : d.stats),
        about: doc ? (s.about ?? "") : d.about,
        education: plain(doc ? s.education : d.education),
        experience: plain(doc ? s.experience : d.experience),
        faculties: [...(doc ? (s.faculties ?? []) : d.faculties)],
        campuses: plain(doc ? s.campuses : d.campuses),
        contact: { ...d.contact, ...stripEmpty(s.contact) }, // phone/email are required on save
        socials: plain(doc ? s.socials : d.socials),
        classInfo: doc ? (s.classInfo ?? "") : d.classInfo,
        admission: shapeAdmission(s.admission),
        seo: shapeSeo(s.seo),
        updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
    };
}

/** Admission copy: stored values, or the defaults until it is first saved. */
function shapeAdmission(a) {
    const d = SITE_DEFAULTS.admission;
    if (!a?.headline)
        return {
            ...d,
            saved: false,
            steps: plain(d.steps),
            checklist: plain(d.checklist),
            faqs: plain(d.faqs),
        };
    return {
        saved: true,
        isOpen: a.isOpen !== false,
        headline: a.headline,
        accent: a.accent ?? "",
        intro: a.intro ?? "",
        closedNote: a.closedNote || d.closedNote,
        steps: plain(a.steps),
        checklist: plain(a.checklist),
        faqs: plain(a.faqs),
    };
}

export const SEO_PAGES = /** @type {const} */ ([
    "home",
    "honorBoard",
    "gallery",
    "notices",
    "admission",
]);

/** SEO settings: stored values, or the seed defaults until the SEO page is first saved. */
function shapeSeo(seo) {
    const d = SITE_DEFAULTS.seo;
    const saved = !!seo?.pages;
    const src = saved ? seo : d;
    const page = (p) => ({
        title: p?.title ?? "",
        description: p?.description ?? "",
        keywords: [...(p?.keywords ?? [])],
    });
    return {
        saved,
        keywords: [...(src.keywords ?? [])],
        googleVerification: src.googleVerification ?? "",
        bingVerification: src.bingVerification ?? "",
        pages: Object.fromEntries(SEO_PAGES.map((k) => [k, page(src.pages?.[k])])),
    };
}

const plain = (arr) => (arr ?? []).map((x) => ({ ...x }));
function stripEmpty(o) {
    if (!o) return {};
    return Object.fromEntries(
        Object.entries(o).filter(([k, v]) => typeof v === "string" && v !== "" && k !== "photo"),
    );
}

/** Save the whole text part of the CMS (the hero photo has its own upload). */
export async function saveSiteContent(input, actor) {
    await connectDB();
    const about = sanitizeRichText(input.about);
    await SiteContent.updateOne(
        { _id: ID },
        {
            $set: {
                name: input.name,
                jobTitle: input.jobTitle,
                boards: input.boards,
                "hero.eyebrow": input.hero.eyebrow,
                "hero.headline": input.hero.headline,
                "hero.accent": input.hero.accent,
                "hero.tagline": input.hero.tagline,
                "hero.note": input.hero.note,
                highlights: input.highlights,
                stats: input.stats,
                about,
                education: input.education,
                experience: input.experience,
                faculties: input.faculties,
                campuses: input.campuses,
                contact: input.contact,
                socials: input.socials,
                classInfo: input.classInfo,
                admission: input.admission,
            },
        },
        { upsert: true, runValidators: true },
    );
    await audit(actor, "site.update");
}

/** Admin → SEO. Only touches `seo`, so it can never clobber the page text. */
export async function saveSiteSeo(input, actor) {
    await connectDB();
    await SiteContent.updateOne(
        { _id: ID },
        { $set: { seo: input } },
        { upsert: true, runValidators: true },
    );
    await audit(actor, "site.seo_update");
}

/**
 * Production-safe: writes the recommended SEO defaults only when SEO was never saved
 * (`force` overwrites). Creates the singleton from the defaults if it doesn't exist.
 * @returns {Promise<"created" | "updated" | "skipped">}
 */
export async function seedSiteSeo({ force = false } = {}) {
    await connectDB();
    if (await seedSiteContent()) return "created";
    const filter = force ? { _id: ID } : { _id: ID, "seo.pages": trusted({ $exists: false }) };
    const res = await SiteContent.updateOne(
        filter,
        { $set: { seo: SITE_DEFAULTS.seo } },
        { runValidators: true },
    );
    return (force ? res.matchedCount : res.modifiedCount) ? "updated" : "skipped";
}

/** Hero portrait: one ≤ 1400px WebP in the public folder. Old file removed after the DB points at the new one. */
export async function saveHeroPhoto(file, actor) {
    await connectDB();
    const set = await saveImageSet(file, {
        dirKey: "public/site",
        maxBytes: HERO_PHOTO_MAX,
        variants: [{ name: "hero", max: 1400 }],
    });
    const old = await SiteContent.findById(ID).select("hero.photo").lean();
    try {
        await SiteContent.updateOne(
            { _id: ID },
            {
                $set: {
                    "hero.photo": set.hero.ref,
                    "hero.photoWidth": set.hero.width,
                    "hero.photoHeight": set.hero.height,
                },
            },
            { upsert: true },
        );
    } catch (err) {
        await removeStoredPaths([set.hero.ref.key]);
        throw err;
    }
    await removeStoredPaths([old?.hero?.photo?.key]);
    await audit(actor, "site.hero_photo");
}

export async function removeHeroPhoto(actor) {
    await connectDB();
    const old = await SiteContent.findById(ID).select("hero.photo").lean();
    if (!old?.hero?.photo) return;
    await SiteContent.updateOne(
        { _id: ID },
        { $unset: { "hero.photo": 1, "hero.photoWidth": 1, "hero.photoHeight": 1 } },
    );
    await removeStoredPaths([old.hero.photo.key]);
    await audit(actor, "site.hero_photo_removed");
}

/** Production-safe seed: writes the defaults only when the singleton doesn't exist yet. */
export async function seedSiteContent() {
    await connectDB();
    if (await SiteContent.exists({ _id: ID })) return false;
    const d = SITE_DEFAULTS;
    await SiteContent.create({ _id: ID, ...d, about: sanitizeRichText(d.about) });
    return true;
}
