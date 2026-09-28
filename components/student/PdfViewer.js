"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

/**
 * FR-MAT-03: pages are painted to <canvas> only — no text layer (no select/copy),
 * no download or print controls. The served file is already watermarked.
 * Uses the pdf.js *legacy* build: it polyfills the very new JS APIs the modern
 * build needs, so it works on older iOS Safari / Android Chrome too.
 */
export default function PdfViewer({ url }) {
    const wrap = useRef(null);
    const pagesRef = useRef(null);
    const [doc, setDoc] = useState(null);
    const [width, setWidth] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [error, setError] = useState(false);

    // Load the document once.
    useEffect(() => {
        let cancelled = false;
        let task;
        (async () => {
            try {
                const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
                pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
                    import.meta.url,
                ).toString();
                task = pdfjs.getDocument({ url, isEvalSupported: false });
                const d = await task.promise;
                if (!cancelled) setDoc(d);
            } catch {
                if (!cancelled) setError(true);
            }
        })();
        return () => {
            cancelled = true;
            task?.destroy();
        };
    }, [url]);

    // Track available width.
    useEffect(() => {
        const el = wrap.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // (Re)paint every page when size or zoom changes.
    useEffect(() => {
        if (!doc || !width || !pagesRef.current) return;
        let cancelled = false;
        const container = pagesRef.current;
        (async () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const target = Math.round(width * zoom);
            for (let n = 1; n <= doc.numPages; n++) {
                const page = await doc.getPage(n);
                if (cancelled) return;
                const base = page.getViewport({ scale: 1 });
                const viewport = page.getViewport({ scale: (target / base.width) * dpr });
                const canvas = document.createElement("canvas");
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                canvas.style.width = `${target}px`;
                canvas.setAttribute("aria-label", `Page ${n}`);
                canvas.className =
                    "block max-w-none rounded-sm border border-line bg-white shadow-[0_18px_40px_-28px_rgb(31_26_23/0.5)]";
                await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport })
                    .promise;
                if (cancelled) return;
                if (n === 1)
                    container.replaceChildren(canvas); // show page 1 quickly
                else container.appendChild(canvas);
            }
        })().catch(() => !cancelled && setError(true));
        return () => {
            cancelled = true;
        };
    }, [doc, width, zoom]);

    if (error) {
        return (
            <p className="rounded-lg border border-danger/30 bg-burgundy-tint p-4 text-sm text-danger">
                This file couldn’t be opened. Please try again later.
            </p>
        );
    }

    const pages = doc?.numPages ?? 0;
    return (
        <div>
            <div className="sticky top-16 z-10 mb-3 flex items-center justify-between rounded-md border border-line bg-surface/95 px-3 py-2 text-sm backdrop-blur-sm sm:top-28">
                <span className="text-muted">
                    {pages ? `${pages} page${pages === 1 ? "" : "s"}` : "Loading…"}
                </span>
                <span className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Zoom out"
                        onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
                        className="grid size-8 place-items-center rounded hover:bg-paper-deep"
                    >
                        <Minus aria-hidden="true" className="size-4" />
                    </button>
                    <span className="w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                    <button
                        type="button"
                        aria-label="Zoom in"
                        onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(1)))}
                        className="grid size-8 place-items-center rounded hover:bg-paper-deep"
                    >
                        <Plus aria-hidden="true" className="size-4" />
                    </button>
                </span>
            </div>
            <div ref={wrap} className="overflow-x-auto">
                <div ref={pagesRef} className="flex flex-col items-center gap-4">
                    <div className="aspect-[1/1.414] w-full animate-pulse rounded-lg bg-paper-deep" />
                </div>
            </div>
        </div>
    );
}
