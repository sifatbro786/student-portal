import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Phone } from "lucide-react";
import { SectionHeading } from "../SectionHeading.js";
import { buttonClass } from "@/components/ui/Button.js";
import { formatPhone } from "@/lib/format.js";
import { SocialIcon, whatsappHref } from "../contact.js";

/** Class info + campuses with lazy Google Maps embeds (validated URLs only). */
export function Classes({ site }) {
    return (
        <section id="classes" aria-labelledby="classes-title" className="scroll-mt-20">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                    <div className="reveal">
                        <SectionHeading
                            id="classes-title"
                            eyebrow="Classes & campuses"
                            title="Where we"
                            accent="meet"
                        >
                            {site.classInfo && (
                                <p className="whitespace-pre-line">{site.classInfo}</p>
                            )}
                        </SectionHeading>
                        <Link href="/admission" className={buttonClass({ className: "mt-8" })}>
                            Apply for admission
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>
                    <ul className="grid gap-6 md:grid-cols-2">
                        {site.campuses.map((c) => (
                            <li
                                key={c.name}
                                className="reveal flex flex-col overflow-hidden rounded-sm border border-line bg-surface"
                            >
                                {c.mapUrl ? (
                                    <iframe
                                        src={c.mapUrl}
                                        title={`Map: ${c.name} campus`}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="aspect-16/10 w-full border-0 grayscale-[35%] sepia-[15%]"
                                    />
                                ) : (
                                    <div className="grid aspect-16/10 place-items-center bg-paper-deep">
                                        <MapPin
                                            aria-hidden="true"
                                            className="size-8 text-burgundy"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col p-5">
                                    <h3 className="font-serif text-2xl">{c.name}</h3>
                                    <p className="mt-2 flex gap-2 text-sm leading-relaxed text-muted">
                                        <MapPin
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0 text-gold-deep"
                                        />
                                        {c.address}
                                    </p>
                                    {c.schedule && (
                                        <p className="mt-2 flex gap-2 text-sm font-medium text-ink">
                                            <CalendarDays
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0 text-gold-deep"
                                            />
                                            {c.schedule}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

/** Closing call to action on burgundy. */
export function FinalCta({ site }) {
    return (
        <section
            aria-labelledby="cta-title"
            className="relative overflow-hidden bg-burgundy text-paper"
        >
            <div
                className="grain absolute inset-0 opacity-40 mix-blend-overlay"
                aria-hidden="true"
            />
            <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-24">
                <div className="max-w-xl">
                    <p className="font-hand text-3xl text-gold-light">
                        Seats are limited in every batch
                    </p>
                    <h2
                        id="cta-title"
                        className="mt-3 text-[2.4rem] leading-[1.05] font-medium tracking-tight sm:text-6xl"
                    >
                        Face the exam with{" "}
                        <em className="font-normal text-gold-light">confidence.</em>
                    </h2>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap [&>a]:whitespace-nowrap">
                    <Link
                        href="/admission"
                        className={buttonClass({ variant: "paper", size: "lg" })}
                    >
                        Apply for admission
                    </Link>
                    <a
                        href={whatsappHref(site.contact.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass({ variant: "outlineLight", size: "lg" })}
                    >
                        <SocialIcon platform="whatsapp" className="size-4.5" /> WhatsApp
                    </a>
                    <a
                        href={`tel:+${site.contact.phone}`}
                        className={buttonClass({ variant: "outlineLight", size: "lg" })}
                    >
                        <Phone aria-hidden="true" className="size-4" />{" "}
                        {formatPhone(site.contact.phone)}
                    </a>
                </div>
            </div>
        </section>
    );
}
