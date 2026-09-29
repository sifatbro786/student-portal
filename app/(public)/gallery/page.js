import Link from "next/link";
import { getPublicGallery, getPublicSite } from "@/server/services/site-public.js";
import { GALLERY_CATEGORY_LABELS } from "@/server/validators/site.js";
import { GalleryBrowser } from "@/components/public/GalleryBrowser.js";
import { PageIntro } from "@/components/public/PageIntro.js";
import { buttonClass } from "@/components/ui/Button.js";

export const revalidate = 300;

export async function generateMetadata() {
    const s = await getPublicSite();
    return {
        title: "Gallery",
        description: `Photos from ${s.name}'s O'Level English classes in ${s.campuses.map((c) => c.name).join(" & ")}, Dhaka — classrooms, students and results days.`,
        alternates: { canonical: "/gallery" },
    };
}

export default async function GalleryPage() {
    const photos = await getPublicGallery();
    return (
        <>
            <PageIntro
                eyebrow="Gallery"
                title="Inside the"
                accent="classroom"
                aside={
                    <p className="max-w-[16rem] -rotate-3 font-hand text-2xl leading-tight text-burgundy lg:mb-4">
                        Small batches, real practice, lots of red pen.
                    </p>
                }
            >
                Moments from our Dhanmondi and Uttara classes — lessons, mock tests and the students
                behind the results.
            </PageIntro>
            {photos.length === 0 ? (
                <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
                    <p className="font-hand text-2xl text-muted">Photos are on their way.</p>
                </section>
            ) : (
                <GalleryBrowser photos={photos} labels={GALLERY_CATEGORY_LABELS} />
            )}
            <section className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p className="font-serif text-2xl sm:text-3xl">Want a seat in the next batch?</p>
                <Link href="/admission" className={buttonClass({ size: "lg" })}>
                    Apply for admission
                </Link>
            </section>
        </>
    );
}
