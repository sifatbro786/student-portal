import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (PRD §12) from @fontsource-variable — no build-time network call.
const fraunces = localFont({
    src: [
        {
            path: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2",
            style: "normal",
            weight: "100 900",
        },
        {
            path: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2",
            style: "italic",
            weight: "100 900",
        },
    ],
    variable: "--font-fraunces",
    display: "swap",
});

const manrope = localFont({
    src: "../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
    weight: "200 800",
    variable: "--font-manrope",
    display: "swap",
});

// One handwritten accent (PRD §13 "optional handwritten-style accent"), public pages only.
const caveat = localFont({
    src: "../node_modules/@fontsource/caveat/files/caveat-latin-600-normal.woff2",
    weight: "600",
    variable: "--font-caveat",
    display: "swap",
    preload: false,
});

export const metadata = {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title: {
        default: "Tauhid Mostafa — O'Level English",
        template: "%s · Tauhid Mostafa — O'Level English",
    },
    description:
        "O'Level English Language classes in Dhanmondi & Uttara, Dhaka with Tauhid Mostafa — Cambridge & Edexcel, 17+ years of teaching.",
    applicationName: "Tauhid Mostafa — O'Level English",
    openGraph: {
        type: "website",
        siteName: "Tauhid Mostafa — O'Level English",
        locale: "en_BD",
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
};

export const viewport = {
    themeColor: "#f6f2ea",
};

export default function RootLayout({ children }) {
    return (
        <html
            lang="en"
            className={`${fraunces.variable} ${manrope.variable} ${caveat.variable} h-full antialiased`}
        >
            {/* Extensions (ColorZilla, Grammarly…) inject attributes into <body> before hydration. */}
            <body className="flex min-h-full flex-col" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
