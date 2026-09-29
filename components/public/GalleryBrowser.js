"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cx } from "@/components/ui/cx.js";

/**
 * Public gallery: category index-tabs, masonry columns, and a lightbox built on the
 * native <dialog> (focus trap + Esc for free). ←/→ and swipe navigate. `#photo-<id>`
 * in the URL opens that photo (the homepage collage links here).
 * @param {{ photos: Array<{ id: string, url: string, thumbUrl: string, width: number, height: number,
 *   caption: string, alt: string, category: string, credit: string }>, labels: Record<string, string> }} props
 */
export function GalleryBrowser({ photos, labels }) {
    const [cat, setCat] = useState("all");
    const [open, setOpen] = useState(-1); // index into `shown`
    const dialogRef = useRef(null);
    const touch = useRef(null);
    const cats = Object.keys(labels).filter((k) => photos.some((p) => p.category === k));
    const shown = cat === "all" ? photos : photos.filter((p) => p.category === cat);

    const show = useCallback(
        (i) => {
            setOpen(i);
            const d = dialogRef.current;
            if (i >= 0 && d && !d.open) d.showModal();
        },
        [setOpen],
    );
    const close = () => dialogRef.current?.close();
    const step = useCallback(
        (d) => setOpen((i) => (i < 0 ? i : (i + d + shown.length) % shown.length)),
        [shown.length],
    );

    // Deep link from the homepage: /gallery#photo-<id>
    useEffect(() => {
        const id = window.location.hash.match(/^#photo-([a-f\d]{24})$/)?.[1];
        const i = id ? photos.findIndex((p) => p.id === id) : -1;
        if (i < 0) return;
        const t = setTimeout(() => show(i), 0); // after hydration; dialog needs the DOM
        return () => clearTimeout(t);
    }, [photos, show]);

    useEffect(() => {
        if (open < 0) return;
        const onKey = (e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, step]);

    const cur = open >= 0 ? shown[open] : null;
    // Preload neighbours so arrows feel instant.
    const next = open >= 0 && shown.length > 1 ? shown[(open + 1) % shown.length] : null;

    return (
        <>
            {cats.length > 1 && (
                <nav aria-label="Categories" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <ul className="flex gap-1 overflow-x-auto border-b border-line-strong">
                        {[["all", "All photos"], ...cats.map((k) => [k, labels[k]])].map(
                            ([k, l]) => (
                                <li key={k}>
                                    <button
                                        type="button"
                                        onClick={() => setCat(k)}
                                        aria-pressed={cat === k}
                                        className={cx(
                                            "-mb-px rounded-t-md border border-b-0 px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                                            cat === k
                                                ? "border-line-strong bg-paper-deep text-burgundy"
                                                : "border-transparent text-muted hover:text-ink",
                                        )}
                                    >
                                        {l}
                                        <span className="ml-2 text-xs font-medium text-muted tabular-nums">
                                            {k === "all"
                                                ? photos.length
                                                : photos.filter((p) => p.category === k).length}
                                        </span>
                                    </button>
                                </li>
                            ),
                        )}
                    </ul>
                </nav>
            )}

            <section aria-label="Photos" className="relative bg-paper-deep">
                <div className="grain absolute inset-0 opacity-70" aria-hidden="true" />
                <ul className="relative mx-auto max-w-7xl columns-1 gap-5 px-4 py-12 sm:columns-2 sm:px-6 lg:columns-3 lg:px-8">
                    {shown.map((p, i) => (
                        <li key={p.id} id={`photo-${p.id}`} className="mb-5 break-inside-avoid">
                            <figure className="group rounded-sm bg-surface p-2 shadow-[0_18px_40px_-30px_rgb(31_26_23/0.6)]">
                                <button
                                    type="button"
                                    onClick={() => show(i)}
                                    className="relative block w-full overflow-hidden rounded-[2px]"
                                    aria-label={`Open photo: ${p.alt}`}
                                >
                                    <Image
                                        src={p.thumbUrl}
                                        alt={p.alt}
                                        width={p.width}
                                        height={p.height}
                                        unoptimized
                                        className="h-auto w-full transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                                    />
                                </button>
                                {p.caption && (
                                    <figcaption className="px-1.5 pt-2.5 pb-1 font-hand text-xl leading-tight text-ink/85">
                                        {p.caption}
                                    </figcaption>
                                )}
                            </figure>
                        </li>
                    ))}
                </ul>
            </section>

            <dialog
                ref={dialogRef}
                onClose={() => setOpen(-1)}
                onClick={(e) => e.target === e.currentTarget && close()}
                aria-label={cur ? cur.alt : "Photo"}
                className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-paper backdrop:bg-ink/80"
            >
                {cur && (
                    <div
                        className="flex h-full flex-col"
                        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
                        onTouchEnd={(e) => {
                            const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
                            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
                        }}
                    >
                        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                            <p className="text-sm text-paper/70 tabular-nums">
                                {open + 1} / {shown.length}
                            </p>
                            <button
                                type="button"
                                onClick={close}
                                autoFocus
                                className="grid size-11 place-items-center rounded-full hover:bg-paper/10"
                            >
                                <X aria-hidden="true" className="size-6" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>
                        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
                            {/* eslint-disable-next-line @next/next/no-img-element -- full-size WebP, sized by the viewport */}
                            <img
                                key={cur.id}
                                src={cur.url}
                                alt={cur.alt}
                                width={cur.width}
                                height={cur.height}
                                className="animate-rise max-h-full w-auto max-w-full object-contain"
                            />
                            {next && (
                                // eslint-disable-next-line @next/next/no-img-element -- preload only
                                <img src={next.url} alt="" className="hidden" aria-hidden="true" />
                            )}
                            {shown.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => step(-1)}
                                        className="absolute left-2 hidden size-12 place-items-center rounded-full bg-ink/50 hover:bg-ink/80 sm:grid"
                                    >
                                        <ChevronLeft aria-hidden="true" className="size-6" />
                                        <span className="sr-only">Previous photo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => step(1)}
                                        className="absolute right-2 hidden size-12 place-items-center rounded-full bg-ink/50 hover:bg-ink/80 sm:grid"
                                    >
                                        <ChevronRight aria-hidden="true" className="size-6" />
                                        <span className="sr-only">Next photo</span>
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="px-4 py-4 text-center sm:px-6">
                            {cur.caption && (
                                <p className="font-hand text-2xl text-paper">{cur.caption}</p>
                            )}
                            <p className="mt-1 text-xs text-paper/50">
                                {labels[cur.category]}
                                {cur.credit ? ` · ${cur.credit}` : ""}
                            </p>
                            {shown.length > 1 && (
                                <p className="mt-2 text-xs text-paper/40 sm:hidden">
                                    Swipe for more
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </dialog>
        </>
    );
}
