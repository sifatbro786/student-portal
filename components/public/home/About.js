import { GraduationCap } from "lucide-react";
import { SectionHeading } from "../SectionHeading.js";

/** About + numbered highlights on exercise-book paper (PRD §13 "01 Expert strategies…"). */
export function About({ site }) {
    const [first, ...rest] = site.name.split(" ");
    return (
        <section id="about" aria-labelledby="about-title" className="scroll-mt-20">
            <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:px-8">
                <div className="reveal">
                    <SectionHeading
                        id="about-title"
                        eyebrow="About"
                        title={`Meet ${first}`}
                        accent={rest.join(" ")}
                    />
                    {/* Sanitised server-side on save (SEC-08) */}
                    <div
                        className="prose-notice mt-8 text-[1.06rem] [&_p:first-child]:font-serif [&_p:first-child]:text-[1.3rem] [&_p:first-child]:leading-snug"
                        dangerouslySetInnerHTML={{ __html: site.about }}
                    />
                </div>

                {site.highlights.length > 0 && (
                    <div className="reveal relative lg:pt-6">
                        <div className="ruled relative rounded-sm bg-surface py-8 pr-6 pl-16 shadow-[0_30px_60px_-35px_rgb(31_26_23/0.45)] sm:pr-10">
                            <span
                                aria-hidden="true"
                                className="tape absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 rotate-2"
                            />
                            <p className="font-hand text-[1.9rem] leading-8 text-burgundy">
                                Why learn with me?
                            </p>
                            <ol className="mt-4">
                                {site.highlights.map((h, i) => (
                                    <li key={h.title} className="relative py-4">
                                        <span
                                            aria-hidden="true"
                                            className="absolute top-3 -left-12 font-serif text-2xl text-burgundy/80 tabular-nums"
                                        >
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <h3 className="font-serif text-xl leading-8 text-ink">
                                            {h.title}
                                        </h3>
                                        {h.body && <p className="leading-8 text-muted">{h.body}</p>}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

/** Education + experience on an ink band (contrast break in the page). */
export function Credentials({ site }) {
    if (!site.education.length && !site.experience.length) return null;
    return (
        <section
            id="experience"
            aria-labelledby="cred-title"
            className="scroll-mt-20 bg-ink text-paper"
        >
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                <SectionHeading
                    id="cred-title"
                    eyebrow="Credentials"
                    title="Education &"
                    accent="experience"
                    tone="dark"
                    className="reveal"
                />
                <div className="mt-14 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
                    <div className="reveal">
                        <h3 className="eyebrow text-[0.68rem] text-gold-light">Education</h3>
                        <ul className="mt-6 space-y-5">
                            {site.education.map((e) => (
                                <li
                                    key={e.degree}
                                    className="flex gap-4 rounded-sm border border-paper/12 bg-paper/[0.04] p-5"
                                >
                                    <GraduationCap
                                        aria-hidden="true"
                                        className="mt-1 size-6 shrink-0 text-gold-light"
                                        strokeWidth={1.5}
                                    />
                                    <div>
                                        <p className="font-serif text-xl leading-snug text-paper">
                                            {e.degree}
                                        </p>
                                        {(e.institution || e.year) && (
                                            <p className="mt-1.5 text-sm text-paper/60">
                                                {[e.institution, e.year]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="reveal">
                        <h3 className="eyebrow text-[0.68rem] text-gold-light">Teaching</h3>
                        <ol className="relative mt-6 space-y-8 border-l border-gold/40 pl-8">
                            {site.experience.map((x, i) => {
                                const current = !x.to;
                                const years = [x.from, x.to || (current ? "Present" : "")]
                                    .filter(Boolean)
                                    .join(" – ");
                                return (
                                    <li key={`${x.institution}-${i}`} className="relative">
                                        <span
                                            aria-hidden="true"
                                            className={
                                                current
                                                    ? "absolute top-2 -left-[2.4rem] size-3.5 rounded-full bg-gold-light ring-4 ring-gold/25"
                                                    : "absolute top-2 -left-[2.3rem] size-2.5 rounded-full border-2 border-gold-light bg-ink"
                                            }
                                        />
                                        <p className="font-serif text-2xl leading-snug text-paper">
                                            {x.institution}
                                        </p>
                                        <p className="mt-1 text-sm text-paper/65">
                                            {x.role}
                                            {years && (
                                                <>
                                                    {x.role ? " · " : ""}
                                                    <span
                                                        className={
                                                            current
                                                                ? "font-semibold text-gold-light"
                                                                : ""
                                                        }
                                                    >
                                                        {years}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </div>
            </div>
        </section>
    );
}
