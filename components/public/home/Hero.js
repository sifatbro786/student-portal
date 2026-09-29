import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/Button.js";
import { SocialIcon, whatsappHref } from "../contact.js";

/**
 * Hero: headline lower-left with ONE italic serif phrase, the teacher's real portrait
 * mounted like a print on a burgundy card, a handwritten note, plain facts (no count-up).
 */
export function Hero({ site }) {
    const h = site.hero;
    return (
        <section aria-labelledby="hero-title" className="relative overflow-hidden">
            <div className="mx-auto grid max-w-7xl items-end gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
                <div className="animate-rise">
                    {h.eyebrow && <p className="eyebrow text-gold-deep">{h.eyebrow}</p>}
                    <h1
                        id="hero-title"
                        className="mt-5 text-[2.7rem] leading-[1.02] font-medium tracking-[-0.02em] text-ink sm:text-6xl lg:text-[4.6rem]"
                    >
                        {h.headline}{" "}
                        {h.accent && <em className="font-normal text-burgundy">{h.accent}</em>}
                    </h1>
                    <span className="gold-rule mt-8" />
                    {h.tagline && (
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                            {h.tagline}
                        </p>
                    )}
                    <div className="mt-9 flex flex-wrap items-center gap-3">
                        <Link href="/admission" className={buttonClass({ size: "lg" })}>
                            Apply for admission
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                        <a
                            href={whatsappHref(site.contact.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonClass({ variant: "secondary", size: "lg" })}
                        >
                            <SocialIcon platform="whatsapp" className="size-4.5 text-[#1f8f4e]" />
                            WhatsApp Sir
                        </a>
                    </div>

                    {site.stats.length > 0 && (
                        <dl className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-line border-y border-line">
                            {site.stats.slice(0, 3).map((s) => (
                                <div key={s.label} className="px-3 py-4 first:pl-0 sm:px-5">
                                    <dt className="sr-only">{s.label}</dt>
                                    <dd className="font-serif text-3xl leading-none text-burgundy sm:text-4xl">
                                        {s.value}
                                    </dd>
                                    <dd className="mt-2 text-[0.78rem] leading-snug font-medium text-muted">
                                        {s.label}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>

                {/* Portrait mounted like a print */}
                <figure className="relative mx-auto w-full max-w-sm sm:max-w-md lg:mr-0">
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 translate-x-4 translate-y-4 rounded-sm bg-burgundy sm:translate-x-6 sm:translate-y-6"
                    />
                    <div className="relative rotate-[1.2deg] rounded-sm bg-surface p-2.5 shadow-[0_24px_50px_-24px_rgb(31_26_23/0.55)] sm:p-3">
                        <Image
                            src={h.photoUrl}
                            alt={`${site.name}, ${site.jobTitle}`}
                            width={h.photoWidth}
                            height={h.photoHeight}
                            priority
                            // Uploaded portrait = one 1400px WebP; let the optimizer resize it for phones
                            // (it reads /media through app/media, so this works behind Nginx too).
                            unoptimized={!h.photoUrl.startsWith("/")}
                            sizes="(min-width: 1024px) 28rem, (min-width: 640px) 28rem, 90vw"
                            className="aspect-4/5 w-full object-cover"
                        />
                        <figcaption className="flex items-baseline justify-between px-1 pt-3 pb-1">
                            <span className="font-serif text-lg text-ink">{site.name}</span>
                            <span className="eyebrow text-[0.6rem] text-gold-deep">
                                {site.boards.includes("Edexcel") ? "Cambridge · Edexcel" : ""}
                            </span>
                        </figcaption>
                    </div>
                    <span
                        aria-hidden="true"
                        className="tape absolute -top-3 left-8 h-7 w-24 -rotate-6"
                    />
                    <span
                        aria-hidden="true"
                        className="tape absolute -top-2 right-6 h-7 w-20 rotate-[8deg]"
                    />
                    {h.note && (
                        <p className="absolute -bottom-6 -left-3 max-w-[13rem] -rotate-[5deg] rounded-sm bg-[#fdf6d8] px-4 py-3 text-[1.45rem] leading-tight text-burgundy-deep shadow-[0_10px_24px_-12px_rgb(31_26_23/0.45)] sm:-left-10">
                            <span className="font-hand">{h.note}</span>
                        </p>
                    )}
                </figure>
            </div>
        </section>
    );
}

/** "Taught at" strip under the hero: typographic marquee, masked edges, static for reduced motion. */
export function FacultyRail({ names }) {
    if (!names.length) return null;
    // Repeat short lists so one row is always wider than the screen (seamless loop).
    const items = Array.from(
        { length: Math.max(2, Math.ceil(8 / names.length)) },
        () => names,
    ).flat();
    const row = (hidden) => (
        <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
            {items.map((n, i) => (
                <li key={`${n}-${i}`} className="flex items-center">
                    <span className="px-6 font-serif text-xl whitespace-nowrap text-paper/90 italic sm:text-2xl">
                        {n}
                    </span>
                    <span aria-hidden="true" className="text-gold-light/70">
                        ✦
                    </span>
                </li>
            ))}
        </ul>
    );
    return (
        <section
            aria-label="Where Tauhid Mostafa has taught"
            className="bg-burgundy-deep text-paper"
        >
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-5 sm:px-6 lg:px-8">
                <p className="eyebrow hidden shrink-0 text-[0.62rem] text-gold-light sm:block">
                    Taught at
                </p>
                <div className="mask-fade-x min-w-0 flex-1 overflow-hidden">
                    <div className="animate-marquee flex w-max">
                        {row(false)}
                        {row(true)}
                    </div>
                </div>
            </div>
        </section>
    );
}
