import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getPublicSite } from "@/server/services/site-public.js";

// Branded share image (PRD §12). Fonts are read from node_modules (no network at build).
export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "Tauhid Mostafa — O'Level English Language Teacher, Dhaka";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file) =>
    readFile(path.join(process.cwd(), "node_modules/@fontsource/fraunces/files", file));

export default async function OgImage() {
    const [site, serif, serifItalic, mark] = await Promise.all([
        getPublicSite(),
        font("fraunces-latin-600-normal.woff"),
        font("fraunces-latin-500-italic.woff"),
        readFile(path.join(process.cwd(), "public/brand/tm-mark.png")),
    ]);
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                background: "#F6F2EA",
                fontFamily: "Fraunces",
                color: "#1F1A17",
            }}
        >
            <div style={{ width: 28, height: "100%", background: "#7A1E2B" }} />
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "64px 72px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <img
                        src={`data:image/png;base64,${mark.toString("base64")}`}
                        width={90}
                        height={63}
                        alt=""
                    />
                    <div
                        style={{
                            fontSize: 22,
                            letterSpacing: 5,
                            color: "#8C6420",
                            fontFamily: "Fraunces",
                        }}
                    >
                        O-LEVEL ENGLISH LANGUAGE
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: -2 }}>
                        {site.name}
                    </div>
                    <div
                        style={{
                            marginTop: 18,
                            fontSize: 44,
                            fontStyle: "italic",
                            color: "#7A1E2B",
                        }}
                    >
                        {site.hero.accent || "taught with care."}
                    </div>
                    <div style={{ width: 72, height: 3, background: "#B8893A", marginTop: 34 }} />
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 26,
                        color: "#6B625A",
                    }}
                >
                    <span>Cambridge · Edexcel</span>
                    <span>{site.campuses.map((c) => c.name).join(" · ")} · Dhaka</span>
                </div>
            </div>
        </div>,
        {
            ...size,
            fonts: [
                { name: "Fraunces", data: serif, weight: 600, style: "normal" },
                { name: "Fraunces", data: serifItalic, weight: 500, style: "italic" },
            ],
        },
    );
}
