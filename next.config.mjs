/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    poweredByHeader: false,
    experimental: {
        // Student profile photo uploads (≤ 3 MB) go through a Server Action.
        serverActions: { bodySizeLimit: "4mb" },
    },
};

export default nextConfig;
