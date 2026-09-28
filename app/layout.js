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

export const metadata = {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title: {
        default: "Tauhid Mostafa — O'Level English",
        template: "%s · Tauhid Mostafa — O'Level English",
    },
    description:
        "O'Level English Language classes in Dhanmondi, Dhaka with Tauhid Mostafa — Cambridge & Edexcel, 17+ years of teaching.",
};

export const viewport = {
    themeColor: "#f6f2ea",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}>
            <body className="flex min-h-full flex-col">{children}</body>
        </html>
    );
}
