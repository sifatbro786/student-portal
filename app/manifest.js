/** Web app manifest (Add to Home Screen on phones — mostly students opening the portal). */
export default function manifest() {
    return {
        name: "Tauhid Mostafa — O'Level English",
        short_name: "TM English",
        description: "O'Level English Language classes and student portal.",
        start_url: "/",
        display: "standalone",
        background_color: "#f6f2ea",
        theme_color: "#7a1e2b",
        icons: [
            { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
            {
                src: "/brand/icon-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
