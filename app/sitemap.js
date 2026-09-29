import { getPublicHonor, getPublicNotices } from "@/server/services/site-public.js";
import { baseUrl } from "@/lib/site-url.js";

export const revalidate = 3600;

/** PRD §12: public routes + public notices + older honor years. */
export default async function sitemap() {
    const url = baseUrl();
    const [notices, honor] = await Promise.all([getPublicNotices(200), getPublicHonor()]);
    const now = new Date();
    return [
        { url: `${url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
        { url: `${url}/honor-board`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
        { url: `${url}/admission`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${url}/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
        { url: `${url}/notices`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
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
