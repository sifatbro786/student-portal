import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "../SectionHeading.js";
import { cx } from "@/components/ui/cx.js";

// Collage slots: one large, then smaller tiles (desktop 4 columns).
const SLOTS = [
    "col-span-2 row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1",
    "hidden lg:block col-span-2 row-span-1",
];

/** Homepage peek into the gallery: featured photos first (admin order), up to 6. */
export function GalleryPreview({ photos }) {
    const picks = [
        ...photos.filter((p) => p.isFeatured),
        ...photos.filter((p) => !p.isFeatured),
    ].slice(0, 6);
    if (picks.length < 3) return null;
    return (
        <section id="gallery" aria-labelledby="gallery-title" className="scroll-mt-20">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <SectionHeading
                        id="gallery-title"
                        eyebrow="Gallery"
                        title="Inside the"
                        accent="classroom"
                        className="reveal"
                    />
                    <Link
                        href="/gallery"
                        className="group inline-flex shrink-0 items-center gap-2 font-semibold text-burgundy"
                    >
                        See all photos
                        <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </div>
                <ul className="mt-12 grid auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:gap-4 lg:grid-cols-4">
                    {picks.map((p, i) => (
                        <li
                            key={p.id}
                            className={cx(
                                "group reveal relative overflow-hidden rounded-sm bg-paper-deep",
                                SLOTS[i],
                            )}
                        >
                            <Link href={`/gallery#photo-${p.id}`} className="block size-full">
                                <Image
                                    src={i === 0 ? p.url : p.thumbUrl}
                                    alt={p.alt}
                                    fill
                                    unoptimized
                                    sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "25vw"}
                                    className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
                                />
                                {p.caption && (
                                    <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/75 to-transparent px-4 pt-10 pb-3 text-sm font-medium text-paper opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">
                                        {p.caption}
                                    </span>
                                )}
                            </Link>
                            {i === 0 && (
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-4 left-4 -rotate-3 rounded-sm bg-[#fdf6d8] px-3 py-1 font-hand text-xl text-burgundy-deep shadow-md"
                                >
                                    where the work happens
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
