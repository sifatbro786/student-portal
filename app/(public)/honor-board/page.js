import Link from "next/link";
import { getPublicHonor, getPublicSite } from "@/server/services/site-public.js";
import { HonorCard } from "@/components/public/HonorCard.js";
import { Ribbon } from "@/components/public/home/HonorShowcase.js";
import { PageIntro } from "@/components/public/PageIntro.js";
import { JsonLd, breadcrumbJsonLd, honorJsonLd } from "@/components/public/JsonLd.js";
import { cx } from "@/components/ui/cx.js";
import { baseUrl } from "@/lib/site-url.js";
import { GRADES } from "@/lib/constants.js";
import { pageMetadata } from "@/lib/seo.js";

const yearOf = (v) => {
    const y = Number(v);
    return Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : null;
};

export async function generateMetadata({ searchParams }) {
    const [board, site] = await Promise.all([
        getPublicHonor(yearOf((await searchParams).year)),
        getPublicSite(),
    ]);
    const y = board.year ?? "";
    const latest = !board.year || board.year === board.years[0];
    // Admin SEO text describes the main board (latest year); older years keep their own title.
    return pageMetadata(site, "honorBoard", {
        title: `Honor Board ${y}`.trim(),
        description: board.year
            ? `${board.heading} ${board.year}: ${board.entries.length} O Level English Language achievers taught by ${site.name} — grades and percentage marks.`
            : `O Level English Language achievers taught by ${site.name}.`,
        // One canonical page per year; the latest year is the bare URL.
        path: latest ? "/honor-board" : `/honor-board?year=${board.year}`,
        useSeo: latest,
    });
}

export default async function HonorBoardPage({ searchParams }) {
    const [board, site] = await Promise.all([
        getPublicHonor(yearOf((await searchParams).year)),
        getPublicSite(),
    ]);

    if (!board.year) {
        return (
            <PageIntro eyebrow="Results" title="Honor" accent="Board">
                The first results will appear here soon.
            </PageIntro>
        );
    }
    const byGrade = Object.entries(
        board.entries.reduce((m, e) => ({ ...m, [e.grade]: (m[e.grade] ?? 0) + 1 }), {}),
    )
        .sort(([a], [b]) => GRADES.indexOf(a) - GRADES.indexOf(b))
        .map(([g, n]) => `${n} × ${g}`);
    return (
        <>
            <JsonLd
                data={[
                    breadcrumbJsonLd(baseUrl(), [
                        ["Home", "/"],
                        ["Honor Board", "/honor-board"],
                    ]),
                    honorJsonLd(board, baseUrl()),
                ]}
            />
            <PageIntro eyebrow={`O-Level English Language · ${board.year}`} title={board.heading}>
                <Ribbon className="mb-6">{board.subheading}</Ribbon>
                <p>
                    {board.entries.length} students · {byGrade.join(" · ")}. Instructor: {site.name}
                    .
                </p>
            </PageIntro>

            {/* Year index-tabs (PRD §13) */}
            {board.years.length > 1 && (
                <nav aria-label="Year" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <ul className="flex gap-1 overflow-x-auto border-b border-line-strong">
                        {board.years.map((y) => (
                            <li key={y}>
                                <Link
                                    href={
                                        y === board.years[0]
                                            ? "/honor-board"
                                            : `/honor-board?year=${y}`
                                    }
                                    aria-current={y === board.year ? "page" : undefined}
                                    className={cx(
                                        "-mb-px block rounded-t-md border border-b-0 px-5 py-2.5 font-serif text-lg tabular-nums transition-colors",
                                        y === board.year
                                            ? "border-line-strong bg-paper-deep text-burgundy"
                                            : "border-transparent text-muted hover:text-ink",
                                    )}
                                >
                                    {y}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            <section aria-label={`${board.year} achievers`} className="relative bg-paper-deep">
                <div className="grain absolute inset-0 opacity-70" aria-hidden="true" />
                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <ol className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {board.entries.map((e, i) => (
                            <li key={e.id} className="reveal">
                                <HonorCard
                                    name={e.name}
                                    grade={e.grade}
                                    percentage={e.percentage}
                                    photoUrl={e.photoUrl}
                                    priority={i < 5}
                                />
                            </li>
                        ))}
                    </ol>
                    <p className="mt-16 border-t border-line-strong/60 pt-8 text-center font-serif text-xl">
                        Instructor:{" "}
                        <span className="font-semibold tracking-wide text-burgundy uppercase">
                            {site.name}
                        </span>
                    </p>
                </div>
            </section>
        </>
    );
}
