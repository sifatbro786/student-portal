import { getPublicHonor, getPublicNotices, getPublicSite } from "@/server/services/site-public.js";
import { baseUrl } from "@/lib/site-url.js";

export const revalidate = 3600;

/**
 * PRD §12: public routes + public notices + older honor years. `lastModified` only where
 * we know a real date — a fake "now" on every request teaches crawlers to ignore it.
 */
export default async function sitemap() {
    const url = baseUrl();
    const [site, notices, honor] = await Promise.all([
        getPublicSite(),
        getPublicNotices(200),
        getPublicHonor(),
    ]);
    const siteDate = site.updatedAt ? new Date(site.updatedAt) : undefined;
    const newestNotice = notices.length
        ? new Date(Math.max(...notices.map((n) => Date.parse(n.publishAt))))
        : undefined;
    return [
        { url: `${url}/`, lastModified: siteDate, changeFrequency: "weekly", priority: 1 },
        { url: `${url}/honor-board`, changeFrequency: "monthly", priority: 0.9 },
        {
            url: `${url}/admission`,
            lastModified: siteDate,
            changeFrequency: "monthly",
            priority: 0.8,
        },
        { url: `${url}/gallery`, changeFrequency: "monthly", priority: 0.6 },
        {
            url: `${url}/notices`,
            lastModified: newestNotice,
            changeFrequency: "weekly",
            priority: 0.6,
        },
        ...honor.years.slice(1).map((y) => ({
            url: `${url}/honor-board?year=${y}`,
            changeFrequency: "yearly",
            priority: 0.5,
        })),
        ...notices.map((n) => ({
            url: `${url}/notices/${n.slug}`,
            lastModified: new Date(n.publishAt),
            changeFrequency: "monthly",
            priority: 0.4,
        })),
    ];
}
