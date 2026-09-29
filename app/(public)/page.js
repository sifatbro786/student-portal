import {
    getPublicGallery,
    getPublicHonor,
    getPublicNotices,
    getPublicSite,
    getPublicTestimonials,
} from "@/server/services/site-public.js";
import { Hero, FacultyRail } from "@/components/public/home/Hero.js";
import { HonorShowcase } from "@/components/public/home/HonorShowcase.js";
import { About, Credentials } from "@/components/public/home/About.js";
import { Reviews } from "@/components/public/home/Reviews.js";
import { GalleryPreview } from "@/components/public/home/GalleryPreview.js";
import { NoticeBoard } from "@/components/public/home/NoticeBoard.js";
import { Classes, FinalCta } from "@/components/public/home/Classes.js";
import { JsonLd, honorJsonLd, siteJsonLd, websiteJsonLd } from "@/components/public/JsonLd.js";
import { baseUrl } from "@/lib/site-url.js";
import { pageMetadata } from "@/lib/seo.js";

// Static + ISR: every admin save revalidates its tag; 5 min is the safety net
// (scheduled notices, writes from scripts).
export const revalidate = 300;

export async function generateMetadata() {
    const s = await getPublicSite();
    return pageMetadata(s, "home", {
        title: { absolute: `${s.name} — O'Level English Language Teacher in Dhaka` },
        description:
            `${s.hero.tagline || s.jobTitle} Classes in ${s.campuses.map((c) => c.name).join(" & ")}, Dhaka. ${s.boards}.`.slice(
                0,
                300,
            ),
        path: "/",
    });
}

// Order (client priority + common tutor-site flow): hero → proof (results) → who →
// credentials → social proof (reviews) → the room (gallery) → news → where/when → act.
export default async function HomePage() {
    const [site, honor, reviews, gallery, notices] = await Promise.all([
        getPublicSite(),
        getPublicHonor(),
        getPublicTestimonials(6),
        getPublicGallery(),
        getPublicNotices(5),
    ]);
    const url = baseUrl();
    return (
        <>
            <JsonLd data={[websiteJsonLd(site, url), ...siteJsonLd(site, url)]} />
            {honor.year && <JsonLd data={honorJsonLd(honor, url)} />}
            <Hero site={site} />
            <FacultyRail names={site.faculties} />
            <HonorShowcase board={honor} instructor={site.name} />
            <About site={site} />
            <Credentials site={site} />
            <Reviews reviews={reviews} />
            <GalleryPreview photos={gallery} />
            <NoticeBoard notices={notices} />
            <Classes site={site} />
            <FinalCta site={site} />
        </>
    );
}
