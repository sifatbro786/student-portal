import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { getPublicNotice, getPublicSite } from "@/server/services/site-public.js";
import { JsonLd, breadcrumbJsonLd } from "@/components/public/JsonLd.js";
import { formatDate } from "@/lib/date.js";
import { baseUrl } from "@/lib/site-url.js";
import { baseOpenGraph, mergeKeywords } from "@/lib/seo.js";

export const revalidate = 300;

// Rendered on first visit, then served from the ISR cache (tag `notices-public`).
export async function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const [n, site] = await Promise.all([getPublicNotice((await params).slug), getPublicSite()]);
    if (!n) return { title: "Notice not found", robots: { index: false } };
    return {
        title: n.title,
        description: n.excerpt,
        keywords: mergeKeywords(site.seo?.keywords ?? []),
        alternates: { canonical: `/notices/${n.slug}` },
        openGraph: {
            ...baseOpenGraph(site),
            type: "article",
            title: n.title,
            description: n.excerpt,
            url: `/notices/${n.slug}`,
            publishedTime: n.publishAt,
            modifiedTime: n.updatedAt,
        },
        twitter: {
            card: "summary_large_image",
            title: n.title,
            description: n.excerpt,
            images: ["/opengraph-image"],
        },
    };
}

export default async function NoticePage({ params }) {
    const n = await getPublicNotice((await params).slug);
    if (!n) notFound();
    return (
        <article className="mx-auto max-w-3xl px-4 pt-12 pb-24 sm:px-6 sm:pt-16">
            <JsonLd
                data={breadcrumbJsonLd(baseUrl(), [
                    ["Home", "/"],
                    ["Notices", "/notices"],
                    [n.title, `/notices/${n.slug}`],
                ])}
            />
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: n.title,
                    datePublished: n.publishAt,
                    dateModified: n.updatedAt,
                    url: `${baseUrl()}/notices/${n.slug}`,
                    author: { "@id": `${baseUrl()}/#person` },
                    publisher: { "@id": `${baseUrl()}/#person` },
                    image: `${baseUrl()}/opengraph-image`,
                    mainEntityOfPage: `${baseUrl()}/notices/${n.slug}`,
                }}
            />
            <Link
                href="/notices"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-burgundy"
            >
                <ArrowLeft aria-hidden="true" className="size-4" /> All notices
            </Link>
            <div className="relative mt-8 rounded-sm bg-surface px-6 pt-12 pb-10 shadow-[0_30px_60px_-40px_rgb(31_26_23/0.6)] sm:px-12">
                <span
                    aria-hidden="true"
                    className="absolute top-4 left-1/2 size-4 -translate-x-1/2 rounded-full bg-burgundy shadow-[0_2px_3px_rgb(31_26_23/0.45)]"
                />
                <p className="eyebrow flex flex-wrap items-center gap-2 text-gold-deep">
                    <time dateTime={n.publishAt}>{formatDate(n.publishAt)}</time>
                    {n.isPinned && (
                        <span className="rounded-full bg-burgundy px-2 py-0.5 text-[0.62rem] text-paper">
                            Important
                        </span>
                    )}
                </p>
                <h1 className="mt-4 text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
                    {n.title}
                </h1>
                <span className="gold-rule mt-6" />
                {/* Sanitised on save (SEC-08) */}
                <div
                    className="prose-notice mt-8 text-[1.05rem]"
                    dangerouslySetInnerHTML={{ __html: n.body }}
                />
                {n.attachment && (
                    <a
                        href={`/api/files/notice-attachment/${n.id}`}
                        target="_blank"
                        rel="noopener"
                        className="mt-8 inline-flex items-center gap-2 rounded-md border border-line-strong px-4 py-2.5 text-sm font-semibold hover:border-ink"
                    >
                        <Paperclip aria-hidden="true" className="size-4" /> {n.attachment.name}
                    </a>
                )}
            </div>
        </article>
    );
}
