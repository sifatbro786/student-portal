import Image from "next/image";
import { requireAuth } from "@/server/auth/guards.js";
import { getSiteContent } from "@/server/services/site-content.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { Button } from "@/components/ui/Button.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { SiteContentForm } from "@/components/admin/forms/SiteContentForm.js";
import { HeroPhotoForm } from "@/components/admin/forms/HeroPhotoForm.js";
import { localPhone } from "@/lib/format.js";
import { removeHeroPhotoAction, saveSiteContentAction } from "./actions.js";

export const metadata = { title: "Site content" };

const JUMP = [
    ["identity", "Name"],
    ["hero", "Hero"],
    ["highlights", "Highlights"],
    ["about", "Bio"],
    ["education", "Education"],
    ["experience", "Experience"],
    ["campuses", "Campuses"],
    ["contact", "Contact"],
    ["admission", "Admission page"],
];

export default async function SiteContentPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const [s, sp] = await Promise.all([getSiteContent(), searchParams]);
    const initial = {
        name: s.name,
        jobTitle: s.jobTitle,
        boards: s.boards,
        hero: {
            eyebrow: s.hero.eyebrow,
            headline: s.hero.headline,
            accent: s.hero.accent,
            tagline: s.hero.tagline,
            note: s.hero.note,
        },
        highlights: s.highlights.map(({ title = "", body = "" }) => ({ title, body })),
        stats: s.stats.map(({ value = "", label = "" }) => ({ value, label })),
        about: s.about,
        education: s.education.map(({ degree = "", institution = "", year = "" }) => ({
            degree,
            institution,
            year,
        })),
        experience: s.experience.map(({ institution = "", role = "", from = "", to = "" }) => ({
            institution,
            role,
            from,
            to,
        })),
        faculties: s.faculties,
        campuses: s.campuses.map(({ name = "", address = "", schedule = "", mapUrl = "" }) => ({
            name,
            address,
            schedule,
            mapUrl,
        })),
        contact: {
            phone: localPhone(s.contact.phone),
            whatsapp: localPhone(s.contact.whatsapp),
            email: s.contact.email ?? "",
        },
        socials: s.socials.map(({ platform = "facebook", url = "" }) => ({ platform, url })),
        classInfo: s.classInfo,
        admission: {
            isOpen: s.admission.isOpen,
            headline: s.admission.headline,
            accent: s.admission.accent,
            intro: s.admission.intro,
            closedNote: s.admission.closedNote,
            steps: s.admission.steps.map(({ title = "", body = "" }) => ({ title, body })),
            checklist: s.admission.checklist.map(({ text = "" }) => ({ text })),
            faqs: s.admission.faqs.map(({ question = "", answer = "" }) => ({ question, answer })),
        },
    };

    return (
        <>
            <PageHeader
                eyebrow="Website"
                title="Site content"
                description="Everything the public homepage says about Tauhid Mostafa. Saving updates the website immediately."
                actions={
                    <Button href="/" variant="secondary" target="_blank">
                        View website
                    </Button>
                }
            />
            {!s.exists && (
                <Alert tone="info" className="mb-6">
                    Showing the starting text from the client’s information. Nothing is saved until
                    you press “Save website content”.
                </Alert>
            )}
            {sp.photo && (
                <Alert tone="success" className="mb-6">
                    New portrait uploaded — the homepage is updated.
                </Alert>
            )}
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <SiteContentForm action={saveSiteContentAction} initial={initial} />
                <aside className="space-y-6 xl:sticky xl:top-6">
                    <Panel title="Hero portrait">
                        <Image
                            src={s.hero.photoUrl}
                            alt=""
                            width={s.hero.photoWidth}
                            height={s.hero.photoHeight}
                            unoptimized={s.hero.hasPhoto}
                            sizes="18rem"
                            className="mb-4 aspect-4/5 w-full rounded-md object-cover"
                        />
                        <HeroPhotoForm />
                        {s.hero.hasPhoto && (
                            <ActionForm
                                action={removeHeroPhotoAction}
                                label="Use the default photo"
                                variant="ghost"
                                size="sm"
                                className="mt-3"
                            />
                        )}
                    </Panel>
                    <nav
                        aria-label="Sections"
                        className="hidden rounded-lg border border-line bg-surface p-4 xl:block"
                    >
                        <p className="eyebrow mb-2 text-[0.62rem] text-muted">Jump to</p>
                        <ul className="space-y-1 text-sm">
                            {JUMP.map(([id, label]) => (
                                <li key={id}>
                                    <a href={`#${id}`} className="text-ink/80 hover:text-burgundy">
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
            </div>
        </>
    );
}
