import Link from "next/link";
import {
    ArrowRight,
    CalendarDays,
    Check,
    Clock,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
} from "lucide-react";
import { issueFormToken } from "@/server/form-token.js";
import { admissionFormOptions } from "@/server/services/admissions.js";
import { getPublicSite } from "@/server/services/site-public.js";
import { SectionHeading } from "@/components/public/SectionHeading.js";
import { JsonLd, breadcrumbJsonLd } from "@/components/public/JsonLd.js";
import { SocialIcon, whatsappHref } from "@/components/public/contact.js";
import { buttonClass } from "@/components/ui/Button.js";
import { formatPhone, scheduleLabel } from "@/lib/format.js";
import { APP_TZ } from "@/lib/constants.js";
import { baseUrl } from "@/lib/site-url.js";
import { pageMetadata } from "@/lib/seo.js";
import { AdmissionForm } from "./AdmissionForm.js";

export const dynamic = "force-dynamic"; // fresh anti-spam token + live class/batch list

export async function generateMetadata() {
    const s = await getPublicSite();
    return pageMetadata(s, "admission", {
        title: "Admission",
        description: `Apply for O Level English Language classes with ${s.name} in ${s.campuses.map((c) => c.name).join(" and ")}, Dhaka. ${s.boards}.`,
        path: "/admission",
    });
}

const yearInDhaka = () =>
    new Intl.DateTimeFormat("en", { timeZone: APP_TZ, year: "numeric" }).format(new Date());

/** Short board names for the fact card ("Cambridge · Edexcel"). */
const shortBoards = (boards) =>
    boards
        .split("·")
        .map((b) => b.replace(/Assessment International Education|Pearson/g, "").trim())
        .filter(Boolean)
        .join(" · ");

export default async function AdmissionPage() {
    const [site, options] = await Promise.all([getPublicSite(), admissionFormOptions()]);
    const adm = site.admission;
    const open = adm.isOpen && options.length > 0;
    const withBatches = options.filter((c) => c.batches.length > 0);
    const url = baseUrl();
    const wa = whatsappHref(site.contact.whatsapp);

    return (
        <>
            <JsonLd
                data={[
                    breadcrumbJsonLd(url, [
                        ["Home", "/"],
                        ["Admission", "/admission"],
                    ]),
                    ...(adm.faqs.length
                        ? [
                              {
                                  "@context": "https://schema.org",
                                  "@type": "FAQPage",
                                  mainEntity: adm.faqs.map((f) => ({
                                      "@type": "Question",
                                      name: f.question,
                                      acceptedAnswer: { "@type": "Answer", text: f.answer },
                                  })),
                              },
                          ]
                        : []),
                ]}
            />

            {/* ---------------------------------------------------------------- hero */}
            <section
                aria-labelledby="adm-title"
                className="relative overflow-hidden border-b border-line"
            >
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 md:pt-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
                    <div className="animate-rise">
                        <nav aria-label="Breadcrumb" className="text-sm text-muted">
                            <Link href="/" className="hover:text-burgundy">
                                Home
                            </Link>
                            <span aria-hidden="true" className="mx-2 text-line-strong">
                                /
                            </span>
                            <span aria-current="page" className="text-ink">
                                Admission
                            </span>
                        </nav>
                        <p
                            className={
                                open
                                    ? "mt-6 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success-tint px-3 py-1 text-xs font-bold tracking-wide text-success uppercase"
                                    : "mt-6 inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper-deep px-3 py-1 text-xs font-bold tracking-wide text-muted uppercase"
                            }
                        >
                            <span
                                aria-hidden="true"
                                className={
                                    open
                                        ? "size-2 rounded-full bg-success"
                                        : "size-2 rounded-full bg-muted"
                                }
                            />
                            {open
                                ? `Admissions open · ${yearInDhaka()}`
                                : "Admissions closed for now"}
                        </p>
                        <h1
                            id="adm-title"
                            className="mt-5 text-[2.6rem] leading-[1.03] font-medium tracking-[-0.02em] sm:text-6xl lg:text-[4.2rem]"
                        >
                            {adm.headline}{" "}
                            {adm.accent && (
                                <em className="font-normal text-burgundy">{adm.accent}</em>
                            )}
                        </h1>
                        <span className="gold-rule mt-7" />
                        {adm.intro && (
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                                {adm.intro}
                            </p>
                        )}
                        <div className="mt-9 flex flex-wrap items-center gap-3">
                            <a
                                href={open ? "#apply" : `tel:+${site.contact.phone}`}
                                className={buttonClass({ size: "lg" })}
                            >
                                {open ? "Start your application" : "Call the office"}
                                <ArrowRight aria-hidden="true" className="size-4" />
                            </a>
                            <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonClass({ variant: "secondary", size: "lg" })}
                            >
                                <SocialIcon
                                    platform="whatsapp"
                                    className="size-4.5 text-[#1f8f4e]"
                                />
                                Ask on WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Admission at a glance — styled like an admit card */}
                    <aside
                        aria-label="Admission at a glance"
                        className="relative mx-auto w-full max-w-md lg:mr-0"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 translate-x-3 translate-y-3 rounded-lg bg-burgundy/90 sm:translate-x-4 sm:translate-y-4"
                        />
                        <div className="relative overflow-hidden rounded-lg border border-line bg-surface shadow-[0_28px_60px_-34px_rgb(31_26_23/0.6)]">
                            <div className="flex items-center justify-between bg-ink px-6 py-4 text-paper">
                                <p className="eyebrow text-[0.68rem] text-gold-light">
                                    Admission at a glance
                                </p>
                                <p className="font-serif text-lg">{yearInDhaka()}</p>
                            </div>
                            <dl className="divide-y divide-line px-6">
                                {options.length > 0 && (
                                    <Fact label="Classes">
                                        {options.map((c) => c.name).join(" · ")}
                                    </Fact>
                                )}
                                {site.boards && (
                                    <Fact label="Exam boards">{shortBoards(site.boards)}</Fact>
                                )}
                                <Fact label="Campuses">
                                    {site.campuses.map((c) => c.name).join(" · ")}
                                </Fact>
                                <Fact label="Mode">Offline classes · small batches</Fact>
                                <Fact label="Selection">Placement test at the campus</Fact>
                            </dl>
                            <div className="relative border-t-2 border-dashed border-line-strong px-6 py-5">
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-3 -left-3 size-6 rounded-full bg-paper"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-3 -right-3 size-6 rounded-full bg-paper"
                                />
                                <p className="flex items-center gap-2 text-sm text-muted">
                                    <Phone aria-hidden="true" className="size-4 text-gold-deep" />
                                    Office:{" "}
                                    <a
                                        href={`tel:+${site.contact.phone}`}
                                        className="font-semibold text-ink hover:text-burgundy"
                                    >
                                        {formatPhone(site.contact.phone)}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {/* ---------------------------------------------------------------- process */}
            <section
                aria-labelledby="steps-title"
                className="relative overflow-hidden bg-burgundy text-paper"
            >
                <div
                    className="grain absolute inset-0 opacity-40 mix-blend-overlay"
                    aria-hidden="true"
                />
                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <SectionHeading
                        id="steps-title"
                        tone="dark"
                        eyebrow="How admission works"
                        title="From test to"
                        accent="first class"
                    />
                    <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {adm.steps.map((s, i) => (
                            <li key={i} className="reveal relative border-t border-paper/25 pt-6">
                                <span className="absolute -top-3.5 left-0 grid size-7 place-items-center rounded-full bg-gold-light font-serif text-sm font-semibold text-burgundy-deep">
                                    {i + 1}
                                </span>
                                <h3 className="mt-2 font-serif text-xl">{s.title}</h3>
                                {s.body && (
                                    <p className="mt-2 text-sm leading-relaxed text-paper/75">
                                        {s.body}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ---------------------------------------------------------------- batches & campuses */}
            <section aria-labelledby="times-title" className="relative bg-paper-deep">
                <div className="grain absolute inset-0 opacity-70" aria-hidden="true" />
                <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:px-8">
                    <div>
                        <SectionHeading
                            id="times-title"
                            eyebrow="Batches & timings"
                            title="Find a time that"
                            accent="fits."
                        >
                            <p>
                                Pick a preferred batch in the form. Seats are limited — the office
                                confirms the final batch.
                            </p>
                        </SectionHeading>
                        {withBatches.length > 0 ? (
                            <div className="mt-10 overflow-hidden rounded-lg border border-line bg-surface">
                                <table className="w-full text-left text-sm">
                                    <caption className="sr-only">
                                        Class batches and their weekly schedule
                                    </caption>
                                    <thead className="bg-paper text-xs tracking-wide text-muted uppercase">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 font-semibold sm:px-5"
                                            >
                                                Class
                                            </th>
                                            <th scope="col" className="px-4 py-3 font-semibold">
                                                Batch
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-4 py-3 font-semibold sm:px-5"
                                            >
                                                Days & time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {withBatches.flatMap((c) =>
                                            c.batches.map((b, i) => (
                                                <tr key={b.id}>
                                                    {i === 0 && (
                                                        <th
                                                            scope="rowgroup"
                                                            rowSpan={c.batches.length}
                                                            className="border-r border-line px-4 py-3 align-top font-serif text-base font-medium sm:px-5"
                                                        >
                                                            {c.name}
                                                        </th>
                                                    )}
                                                    <td className="px-4 py-3 font-semibold text-burgundy">
                                                        {b.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-ink/85 sm:px-5">
                                                        <span className="inline-flex items-start gap-2">
                                                            <Clock
                                                                aria-hidden="true"
                                                                className="mt-0.5 size-4 shrink-0 text-gold-deep"
                                                            />
                                                            {scheduleLabel(b.schedule)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="mt-8 font-hand text-2xl text-muted">
                                Batch times are announced with each intake.
                            </p>
                        )}
                    </div>
                    <ul className="space-y-5 lg:pt-4">
                        {site.campuses.map((c) => (
                            <li
                                key={c.name}
                                className="reveal rounded-lg border border-line bg-surface p-5"
                            >
                                <h3 className="font-serif text-2xl">{c.name} campus</h3>
                                <p className="mt-2 flex gap-2 text-sm leading-relaxed text-muted">
                                    <MapPin
                                        aria-hidden="true"
                                        className="mt-0.5 size-4 shrink-0 text-gold-deep"
                                    />
                                    {c.address}
                                </p>
                                {c.schedule && (
                                    <p className="mt-2 flex gap-2 text-sm font-medium">
                                        <CalendarDays
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0 text-gold-deep"
                                        />
                                        {c.schedule}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ---------------------------------------------------------------- application */}
            <section id="apply" aria-label="Application" className="scroll-mt-20">
                <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8 xl:gap-14">
                    <div className="min-w-0 rounded-xl border border-line bg-surface p-5 shadow-[0_30px_70px_-50px_rgb(31_26_23/0.55)] sm:p-8 lg:p-10">
                        {open ? (
                            <AdmissionForm
                                options={options}
                                formToken={issueFormToken("admission")}
                            />
                        ) : (
                            <div className="py-6 text-center">
                                <p className="eyebrow text-gold-deep">Applications paused</p>
                                <h2 className="mt-3 text-3xl font-medium">
                                    The next intake opens soon
                                </h2>
                                <p className="mx-auto mt-3 max-w-md text-muted">{adm.closedNote}</p>
                                <div className="mt-7 flex flex-wrap justify-center gap-3">
                                    <a
                                        href={`tel:+${site.contact.phone}`}
                                        className={buttonClass()}
                                    >
                                        <Phone aria-hidden="true" className="size-4" /> Call the
                                        office
                                    </a>
                                    <a
                                        href={wa}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonClass({ variant: "secondary" })}
                                    >
                                        <SocialIcon
                                            platform="whatsapp"
                                            className="size-4 text-[#1f8f4e]"
                                        />{" "}
                                        WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside
                        aria-label="Help with your application"
                        className="space-y-5 lg:sticky lg:top-24"
                    >
                        {adm.checklist.length > 0 && (
                            <div className="rounded-lg border border-line bg-surface p-5">
                                <h2 className="font-serif text-xl">Keep these ready</h2>
                                <ul className="mt-4 space-y-3 text-sm">
                                    {adm.checklist.map((c, i) => (
                                        <li key={i} className="flex gap-2.5">
                                            <span
                                                aria-hidden="true"
                                                className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-burgundy-tint text-burgundy"
                                            >
                                                <Check className="size-3" strokeWidth={3} />
                                            </span>
                                            {c.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="rounded-lg bg-ink p-5 text-paper/80">
                            <h2 className="font-serif text-xl text-paper">Need help?</h2>
                            <p className="mt-1 text-sm">
                                The office is happy to answer questions before you apply.
                            </p>
                            <ul className="mt-4 space-y-3 text-sm">
                                <li>
                                    <a
                                        href={`tel:+${site.contact.phone}`}
                                        className="flex items-center gap-2.5 hover:text-paper"
                                    >
                                        <Phone
                                            aria-hidden="true"
                                            className="size-4 text-gold-light"
                                        />
                                        {formatPhone(site.contact.phone)}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={wa}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 hover:text-paper"
                                    >
                                        <SocialIcon
                                            platform="whatsapp"
                                            className="size-4 text-gold-light"
                                        />
                                        WhatsApp the office
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={`mailto:${site.contact.email}`}
                                        className="flex items-center gap-2.5 break-all hover:text-paper"
                                    >
                                        <Mail
                                            aria-hidden="true"
                                            className="size-4 shrink-0 text-gold-light"
                                        />
                                        {site.contact.email}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <p className="flex gap-2.5 px-1 text-xs leading-relaxed text-muted">
                            <ShieldCheck
                                aria-hidden="true"
                                className="size-4 shrink-0 text-gold-deep"
                            />
                            Your details are used only for this admission and are never shared or
                            shown publicly.
                        </p>
                    </aside>
                </div>
            </section>

            {/* ---------------------------------------------------------------- FAQ */}
            {adm.faqs.length > 0 && (
                <section aria-labelledby="faq-title" className="relative bg-paper-deep">
                    <div className="grain absolute inset-0 opacity-70" aria-hidden="true" />
                    <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-8">
                        <div>
                            <SectionHeading
                                id="faq-title"
                                eyebrow="Admission FAQ"
                                title="Questions parents"
                                accent="ask"
                            />
                            <p className="mt-6 max-w-[15rem] -rotate-2 font-hand text-2xl leading-tight text-burgundy">
                                Still unsure? Just call — we’re happy to help.
                            </p>
                        </div>
                        <div className="divide-y divide-line-strong border-y border-line-strong">
                            {adm.faqs.map((f, i) => (
                                <details key={i} className="group py-1" open={i === 0}>
                                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 font-serif text-lg leading-snug marker:hidden [&::-webkit-details-marker]:hidden">
                                        {f.question}
                                        <span
                                            aria-hidden="true"
                                            className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-burgundy transition-transform duration-300 group-open:rotate-45"
                                        >
                                            +
                                        </span>
                                    </summary>
                                    <p className="max-w-2xl pb-5 leading-relaxed whitespace-pre-line text-muted">
                                        {f.answer}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

function Fact({ label, children }) {
    return (
        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3.5 text-sm">
            <dt className="eyebrow pt-0.5 text-[0.62rem] text-muted">{label}</dt>
            <dd className="font-medium text-ink">{children}</dd>
        </div>
    );
}
