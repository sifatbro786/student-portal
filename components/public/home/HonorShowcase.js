import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HonorCard } from "@/components/public/HonorCard.js";
import { cx } from "@/components/ui/cx.js";

/** The yellow ribbon from the client's printed board ("CIRCLE OF EXCELLENCE"). */
export function Ribbon({ children, className }) {
    return (
        <span
            className={cx(
                "relative inline-block -rotate-1 bg-badge px-5 py-2 font-sans text-sm font-extrabold tracking-[0.12em] text-ink uppercase shadow-[0_6px_14px_-8px_rgb(31_26_23/0.5)] sm:text-base",
                "after:absolute after:top-full after:right-3 after:border-t-[10px] after:border-l-[14px] after:border-t-[#c99a14] after:border-l-transparent",
                className,
            )}
        >
            {children}
        </span>
    );
}

/** Homepage Honor Board (FR-HON-06): latest published year, up to 12, "View all". */
export function HonorShowcase({ board, instructor, limit = 12 }) {
    if (!board.year || board.entries.length === 0) return null;
    const shown = board.entries.slice(0, limit);
    const top = [...board.entries].sort((a, b) => b.percentage - a.percentage)[0];
    const aStars = board.entries.filter((e) => e.grade === "A*").length;
    return (
        <section
            id="results"
            aria-labelledby="honor-title"
            className="relative scroll-mt-20 bg-paper-deep"
        >
            <div className="grain absolute inset-0 opacity-70" aria-hidden="true" />
            <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="reveal max-w-2xl">
                        <p className="eyebrow text-gold-deep">
                            O-Level English Language · Results {board.year}
                        </p>
                        <h2
                            id="honor-title"
                            className="mt-3 text-[2.4rem] leading-[1.05] font-medium tracking-tight sm:text-6xl"
                        >
                            {board.heading}
                        </h2>
                        <div className="mt-5">
                            <Ribbon>{board.subheading}</Ribbon>
                        </div>
                        <p className="mt-8 max-w-xl leading-relaxed text-muted">
                            {board.entries.length} students on this year’s board —{" "}
                            <strong className="font-semibold text-ink">{aStars} with an A*</strong>.
                            Every name here sat in these classes.
                        </p>
                    </div>
                    {top && (
                        <p
                            aria-hidden="true"
                            className="hidden max-w-[15rem] rotate-[-4deg] self-center text-center font-hand text-[1.65rem] leading-tight text-burgundy lg:block"
                        >
                            Top score: {top.name.split(" ")[0]} — {top.percentage}%!
                            <svg
                                viewBox="0 0 120 40"
                                className="mx-auto mt-1 h-8 w-28 text-burgundy/70"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <path d="M8 6c20 22 58 30 96 22" />
                                <path d="M94 20l12 8-13 6" />
                            </svg>
                        </p>
                    )}
                </div>

                <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {shown.map((e) => (
                        <li key={e.id} className="reveal">
                            <HonorCard
                                name={e.name}
                                grade={e.grade}
                                percentage={e.percentage}
                                photoUrl={e.photoUrl}
                            />
                        </li>
                    ))}
                </ul>

                <div className="mt-14 flex flex-col items-center gap-3 border-t border-line-strong/60 pt-8 sm:flex-row sm:justify-between">
                    <p className="font-serif text-lg text-ink">
                        Instructor:{" "}
                        <span className="font-semibold tracking-wide text-burgundy uppercase">
                            {instructor}
                        </span>
                    </p>
                    <Link
                        href={`/honor-board?year=${board.year}`}
                        className="group inline-flex items-center gap-2 font-semibold text-burgundy"
                    >
                        View all {board.entries.length} achievers
                        <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}
