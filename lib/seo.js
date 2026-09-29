// Page <head> metadata from Admin → SEO (SiteContent.seo), with each page's built-in
// text as the fallback. Pure: callers pass the shaped site content (getPublicSite()).

export const SITE_SUFFIX = "O'Level English";

/** Open Graph fields every public page shares (a page's `openGraph` replaces the root one). */
export const baseOpenGraph = (site) => ({
    siteName: `${site.name} — ${SITE_SUFFIX}`,
    locale: "en_BD",
    type: "website",
    images: [shareImage(site)],
});

/**
 * app/opengraph-image.js. Listed explicitly: a segment that sets `openGraph` replaces the
 * parent's object, and the file-based image would silently disappear.
 */
const shareImage = (site) => ({
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${site.name} — ${SITE_SUFFIX} Language Teacher, Dhaka`,
});

/** Unique keywords, page-specific first. */
export function mergeKeywords(...lists) {
    const seen = new Map();
    for (const k of lists.flat()) if (k && !seen.has(k.toLowerCase())) seen.set(k.toLowerCase(), k);
    return [...seen.values()];
}

/**
 * @param {any} site shaped SiteContent
 * @param {"home"|"honorBoard"|"gallery"|"notices"|"admission"} key
 * @param {{ title: string, description: string, path: string, useSeo?: boolean }} fallback
 *   `title` is the short page title (the root template adds the site name), or
 *   `{ absolute }` for a complete one.
 */
export function pageMetadata(site, key, { title, description, path, useSeo = true }) {
    const p = (useSeo && site.seo?.pages?.[key]) || {};
    const fullTitle =
        p.title ||
        (typeof title === "object" ? title.absolute : `${title} · ${site.name} — ${SITE_SUFFIX}`);
    const desc = p.description || description;
    return {
        title: p.title ? { absolute: p.title } : title,
        description: desc,
        keywords: mergeKeywords(p.keywords ?? [], site.seo?.keywords ?? []),
        alternates: { canonical: path },
        openGraph: { ...baseOpenGraph(site), title: fullTitle, description: desc, url: path },
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description: desc,
            images: [shareImage(site).url],
        },
    };
}
