import "server-only";
import { unstable_cache } from "next/cache";
import { SITE_TAG, getSiteContent, shapeSiteContent } from "./site-content.js";
import { TESTIMONIAL_TAG, listApprovedTestimonials } from "./testimonials.js";
import { GALLERY_TAG, listPublishedGallery } from "./gallery.js";
import { getPublicNoticeBySlug, listPublicNotices } from "./notices.js";
import { htmlToText } from "../sanitize.js";
import { log } from "../log.js";
import { getPublicHonorBoard } from "./honor-public.js";

// Cached public readers (P8). Kept apart from the services because `next/cache` only
// resolves inside Next. Every admin save calls updateTag/revalidateTag with these tags;
// the `revalidate` values are safety nets for writes made by scripts and for scheduled
// notices (publishAt/expiresAt pass without any save).
export const NOTICES_PUBLIC_TAG = "notices-public";

/**
 * A DB outage must not take the public site down with a 500: log it and render a
 * fallback. Errors are thrown INSIDE the cache (so nothing bad gets cached) and caught here.
 */
const safe =
    (label, cached, fallback) =>
    async (...args) => {
        try {
            return await cached(...args);
        } catch (err) {
            log.error(`public.${label}.failed`, { err });
            return typeof fallback === "function" ? fallback(...args) : fallback;
        }
    };

export const getPublicSite = safe(
    "site",
    unstable_cache(() => getSiteContent(), ["site-content"], {
        tags: [SITE_TAG],
        revalidate: 3600,
    }),
    () => shapeSiteContent(null),
);

export const getPublicTestimonials = safe(
    "testimonials",
    unstable_cache((limit = 6) => listApprovedTestimonials(limit), ["testimonials"], {
        tags: [TESTIMONIAL_TAG],
        revalidate: 3600,
    }),
    [],
);

export const getPublicGallery = safe(
    "gallery",
    unstable_cache(() => listPublishedGallery(), ["gallery"], {
        tags: [GALLERY_TAG],
        revalidate: 3600,
    }),
    [],
);

export const getPublicNotices = safe(
    "notices",
    unstable_cache(
        async (limit = 5) => {
            const rows = await listPublicNotices({ limit });
            return rows.map((n) => ({
                id: String(n._id),
                title: n.title,
                slug: n.slug,
                excerpt: htmlToText(n.body, 180),
                isPinned: !!n.isPinned,
                publishAt: n.publishAt.toISOString(),
            }));
        },
        ["notices-public"],
        { tags: [NOTICES_PUBLIC_TAG], revalidate: 300 },
    ),
    [],
);

export const getPublicNotice = unstable_cache(
    async (slug) => {
        const n = await getPublicNoticeBySlug(slug);
        if (!n) return null;
        return {
            id: String(n._id),
            title: n.title,
            slug: n.slug,
            body: n.body,
            excerpt: htmlToText(n.body, 160),
            isPinned: !!n.isPinned,
            publishAt: n.publishAt.toISOString(),
            updatedAt: (n.updatedAt ?? n.publishAt).toISOString(),
            expiresAt: n.expiresAt ? n.expiresAt.toISOString() : null,
            attachment: n.attachment
                ? { name: n.attachment.originalName, mime: n.attachment.mime }
                : null,
        };
    },
    ["notice-public"],
    { tags: [NOTICES_PUBLIC_TAG], revalidate: 300 },
);

export const getPublicHonor = safe("honor", (year = null) => getPublicHonorBoard(year), {
    years: [],
    year: null,
    heading: "",
    subheading: "",
    entries: [],
});
