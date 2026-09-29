import "server-only";
import { unstable_cache } from "next/cache";
import { connectDB } from "../db.js";
import { HonorEntry, HonorYear } from "../models/Honor.js";
import { HONOR_TAG, defaultHeading, defaultSubheading, mediaUrl } from "./honor.js";

// Kept apart from honor.js: `next/cache` only resolves inside Next, and scripts/*
// (plain Node) import honor.js.

/**
 * Published entries of one year (default: latest year with published entries) + the
 * list of years for the tabs. Cached; every admin save calls updateTag/revalidateTag("honor").
 * Returns plain JSON only.
 */
export const getPublicHonorBoard = unstable_cache(
    async (year = null) => {
        await connectDB();
        const years = (await HonorEntry.distinct("year", { isPublished: true })).sort(
            (a, b) => b - a,
        );
        const y = year && years.includes(year) ? year : (years[0] ?? null);
        if (!y) return { years: [], year: null, heading: "", subheading: "", entries: [] };
        const [entries, settings] = await Promise.all([
            HonorEntry.find({ year: y, isPublished: true })
                .sort({ order: 1, name: 1 })
                .select("name grade percentage school photo thumb consentConfirmed")
                .lean(),
            HonorYear.findOne({ year: y }).lean(),
        ]);
        return {
            years,
            year: y,
            heading: settings?.heading ?? defaultHeading(),
            subheading: settings?.subheading ?? defaultSubheading(y),
            entries: entries.map((e) => {
                // Defence in depth for FR-HON-05: never expose a photo without consent.
                const photoOk = e.consentConfirmed && !!e.photo;
                return {
                    id: String(e._id),
                    name: e.name,
                    grade: e.grade,
                    percentage: e.percentage,
                    school: e.school ?? null,
                    photoUrl: photoOk ? mediaUrl(e.photo.key) : null,
                    thumbUrl: photoOk ? mediaUrl(e.thumb?.key) : null,
                };
            }),
        };
    },
    ["honor-board"],
    // Tag for instant updates from the admin; 1 h safety net for writes made outside
    // Next (seed scripts), which can't revalidate the cache.
    { tags: [HONOR_TAG], revalidate: 3600 },
);
