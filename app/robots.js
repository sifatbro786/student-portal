import { baseUrl } from "@/lib/site-url.js";

/** PRD §12: keep private areas out of search engines (authorisation is server-side anyway). */
export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/dashboard", "/api/", "/login", "/change-password"],
            },
        ],
        sitemap: `${baseUrl()}/sitemap.xml`,
        host: baseUrl(),
    };
}
