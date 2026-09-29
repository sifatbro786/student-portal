import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "../SectionHeading.js";
import { cx } from "@/components/ui/cx.js";
import { formatDate } from "@/lib/date.js";

const TILT = ["-rotate-1", "rotate-[0.7deg]", "-rotate-[0.5deg]", "rotate-1", "-rotate-[0.8deg]"];

/** A pinned card on the board. Also used on /notices. */
export function NoticeCard({ n, i = 0, headingLevel = 3 }) {
    const H = `h${headingLevel}`;
    return (
        <article
            className={cx(
                "group relative h-full rounded-sm bg-surface p-6 pt-8 shadow-[0_18px_40px_-28px_rgb(31_26_23/0.55)] transition-transform duration-500 ease-editorial hover:-translate-y-1 hover:rotate-0",
                TILT[i % TILT.length],
            )}
        >
            <span
                aria-hidden="true"
                className="absolute top-3 left-1/2 size-3.5 -translate-x-1/2 rounded-full bg-burgundy shadow-[0_2px_3px_rgb(31_26_23/0.45)] ring-2 ring-burgundy-deep/40"
            />
            <p className="eyebrow flex items-center gap-2 text-[0.62rem] text-gold-deep">
                <time dateTime={n.publishAt}>{formatDate(n.publishAt)}</time>
                {n.isPinned && (
                    <span className="rounded-full bg-burgundy px-2 py-0.5 text-paper">
                        Important
                    </span>
                )}
            </p>
            <H className="mt-3 font-serif text-xl leading-snug text-ink">
                <Link
                    href={`/notices/${n.slug}`}
                    className="after:absolute after:inset-0 group-hover:text-burgundy"
                >
                    {n.title}
                </Link>
            </H>
            {n.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted">{n.excerpt}</p>}
        </article>
    );
}

/** Public notices (FR-NOT-02): latest 5 on the homepage. */
export function NoticeBoard({ notices }) {
    return (
        <section
            id="notices"
            aria-labelledby="notices-title"
            className="relative scroll-mt-20 bg-paper-deep"
        >
            <div className="grain absolute inset-0 opacity-70" aria-hidden="true" />
            <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <SectionHeading
                        id="notices-title"
                        eyebrow="Notice board"
                        title="What’s"
                        accent="new"
                        className="reveal"
                    />
                    <Link
                        href="/notices"
                        className="group inline-flex shrink-0 items-center gap-2 font-semibold text-burgundy"
                    >
                        All notices
                        <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </div>
                {notices.length === 0 ? (
                    <p className="mt-10 max-w-md font-hand text-2xl text-muted">
                        Nothing pinned right now — check back soon.
                    </p>
                ) : (
                    <ul className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {notices.map((n, i) => (
                            <li key={n.id} className="reveal">
                                <NoticeCard n={n} i={i} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
