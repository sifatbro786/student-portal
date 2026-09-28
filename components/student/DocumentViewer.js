"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfViewer.js"), {
    ssr: false,
    loading: () => <div className="h-[70vh] animate-pulse rounded-lg bg-paper-deep" />,
});

/** Blocks the casual routes to saving (right-click, drag, selection). */
export function DocumentViewer({ url, kind, title }) {
    return (
        <div
            className="select-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
        >
            {kind === "pdf" ? (
                <PdfViewer url={url} />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element -- private, per-student watermarked image
                <img
                    src={url}
                    alt={title}
                    draggable={false}
                    className="w-full rounded-md border border-line"
                />
            )}
        </div>
    );
}
