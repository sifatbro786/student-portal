/** Absolute site origin for canonical URLs, sitemap and JSON-LD (no trailing slash). */
export const baseUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
