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
            { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: week }] },
            {
                source: "/:file(logo.jpeg|tauhid.jpeg)",
                headers: [{ key: "Cache-Control", value: week }],
            },
        ];
    },
};

export default nextConfig;
