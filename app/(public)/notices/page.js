import { getPublicNotices, getPublicSite } from "@/server/services/site-public.js";
import { NoticeCard } from "@/components/public/home/NoticeBoard.js";
import { PageIntro } from "@/components/public/PageIntro.js";
import { pageMetadata } from "@/lib/seo.js";
import { baseUrl } from "@/lib/site-url.js";
import { JsonLd, breadcrumbJsonLd } from "@/components/public/JsonLd.js";

export const revalidate = 300;

export async function generateMetadata() {
    const s = await getPublicSite();
    return pageMetadata(s, "notices", {
        title: "Notices",
        description: `Public notices from ${s.name}'s O'Level English classes — holidays, mock test schedules and admission updates.`,
        path: "/notices",
    });
}

export default async function NoticesPage() {
    const notices = await getPublicNotices(50);
    return (
        <>
            <JsonLd
                data={breadcrumbJsonLd(baseUrl(), [
                    ["Home", "/"],
                    ["Notices", "/notices"],
                ])}
            />
            <PageIntro eyebrow="Notice board" title="Public" accent="notices">
                Holidays, mock test dates and admission news. Enrolled students see their batch’s
                notices in the student portal.
            </PageIntro>
            <section aria-label="Notices" className="relative bg-paper-deep">
                <div className="grain absolute inset-0 opacity-70" aria-hidden="true" />
                <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    {notices.length === 0 ? (
                        <p className="font-hand text-2xl text-muted">
                            Nothing pinned right now — check back soon.
                        </p>
                    ) : (
                        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                            {notices.map((n, i) => (
                                <li key={n.id}>
                                    <NoticeCard n={n} i={i} headingLevel={2} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </>
    );
}
