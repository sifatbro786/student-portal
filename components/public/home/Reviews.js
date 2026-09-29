import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { SectionHeading } from "../SectionHeading.js";
import { cx } from "@/components/ui/cx.js";
import { initials } from "@/lib/format.js";

function Stars({ value }) {
    return (
        <span className="flex gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className={cx(
                        "size-4",
                        n <= value ? "fill-badge text-gold-deep" : "text-line-strong",
                    )}
                />
            ))}
        </span>
    );
}

function Person({ r, large }) {
    return (
        <figcaption className="flex items-center gap-3">
            <span
                className={cx(
                    "grid shrink-0 place-items-center overflow-hidden rounded-full bg-burgundy font-serif text-paper ring-2 ring-surface",
                    large ? "size-14 text-lg" : "size-11",
                )}
            >
                {r.photoUrl ? (
                    <Image
                        src={r.photoUrl}
                        alt=""
                        width={large ? 56 : 44}
                        height={large ? 56 : 44}
                        unoptimized
                        className="size-full object-cover"
                    />
                ) : (
                    initials(r.name)
                )}
            </span>
            <span>
                <span className="block font-semibold text-ink">{r.name}</span>
                {r.resultLine && (
                    <span className="block text-sm text-gold-deep">{r.resultLine}</span>
                )}
            </span>
        </figcaption>
    );
}

// Index cards pinned at slightly different angles — a board of notes, not a SaaS grid.
const TILT = [
    "-rotate-[0.8deg]",
    "rotate-[0.6deg]",
    "-rotate-[0.4deg]",
    "rotate-[1deg]",
    "-rotate-[1deg]",
];

/** Approved student reviews (P8). The first (pinned/latest) one is set as a large quote. */
export function Reviews({ reviews }) {
    if (!reviews.length) return null;
    const [lead, ...others] = reviews;
    return (
        <section
            id="reviews"
            aria-labelledby="reviews-title"
            className="scroll-mt-20 bg-burgundy-tint"
        >
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                    <div className="reveal">
                        <SectionHeading
                            id="reviews-title"
                            eyebrow="Student voices"
                            title="In their"
                            accent="own words"
                        >
                            Written by students from their portal and published with their
                            permission.
                        </SectionHeading>
                        <p className="mt-8 text-sm text-muted">
                            A current student?{" "}
                            <Link
                                href="/dashboard/review"
                                className="font-semibold text-burgundy underline decoration-gold underline-offset-4"
                            >
                                Write your review
                            </Link>
                        </p>
                    </div>
                    <figure className="reveal relative rounded-sm bg-surface p-7 shadow-[0_30px_60px_-35px_rgb(94_21_32/0.55)] sm:p-10">
                        <span
                            aria-hidden="true"
                            className="absolute -top-7 left-6 font-serif text-[7rem] leading-none text-gold/60 select-none"
                        >
                            “
                        </span>
                        <Stars value={lead.rating} />
                        <blockquote className="mt-5 font-serif text-[1.35rem] leading-snug whitespace-pre-line text-ink italic sm:text-[1.6rem]">
                            {lead.quote}
                        </blockquote>
                        <div className="mt-8 border-t border-line pt-6">
                            <Person r={lead} large />
                        </div>
                    </figure>
                </div>

                {others.length > 0 && (
                    <ul className="mt-14 grid items-start gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {others.map((r, i) => (
                            <li key={r.id} className="reveal">
                                <figure
                                    className={cx(
                                        "relative rounded-sm bg-surface p-6 shadow-[0_18px_40px_-28px_rgb(94_21_32/0.5)] transition-transform duration-500 ease-editorial hover:-translate-y-1",
                                        TILT[i % TILT.length],
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="tape absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-3deg]"
                                    />
                                    <Stars value={r.rating} />
                                    <blockquote className="mt-4 leading-relaxed whitespace-pre-line text-ink/90">
                                        “{r.quote}”
                                    </blockquote>
                                    <div className="mt-5">
                                        <Person r={r} />
                                    </div>
                                </figure>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
