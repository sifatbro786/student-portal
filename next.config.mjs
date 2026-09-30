const isDev = process.env.NODE_ENV !== "production";

/**
 * SEC-07 Content-Security-Policy. `'unsafe-inline'` scripts are needed by Next's inline
 * hydration payload (a nonce would force every page to render dynamically and kill ISR);
 * everything else is locked to our own origin. JSON-LD is a data block, not executed.
 * - frame-src: Google Maps embeds only (campus maps, validated URLs)
 * - img-src blob:/data: for upload previews; worker-src: the pdf.js worker (same origin)
 * - 'wasm-unsafe-eval': pdf.js image decoders; 'unsafe-eval' only in dev (React refresh)
 */
const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-src https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    // HSTS is sent by Nginx (HTTPS only) — see deploy/nginx/tm-english.conf.
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    poweredByHeader: false,
    experimental: {
        // Student profile photo uploads (≤ 3 MB) go through a Server Action.
        serverActions: { bodySizeLimit: "4mb" },
    },
    images: {
        // AVIF first (≈20% smaller than WebP on phones); results are cached on disk.
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60 * 60 * 24 * 30,
    },
    async headers() {
        // Brand files keep their names when replaced, so a week (not "immutable").
        const week = "public, max-age=604800, stale-while-revalidate=86400";
        return [
            { source: "/:path*", headers: securityHeaders },
            { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: week }] },
            {
                source: "/:file(logo.jpeg|tauhid.jpeg)",
                headers: [{ key: "Cache-Control", value: week }],
            },
        ];
    },
};

export default nextConfig;
