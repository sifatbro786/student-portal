import { requireAuth } from "@/server/auth/guards.js";
import { SEO_PAGES, getSiteContent } from "@/server/services/site-content.js";
import { SITE_DEFAULTS } from "@/lib/site-defaults.js";
import { baseUrl } from "@/lib/site-url.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Alert } from "@/components/ui/Alert.js";
import { Button } from "@/components/ui/Button.js";
import { SeoForm } from "@/components/admin/forms/SeoForm.js";
import { saveSeoAction } from "./actions.js";

export const metadata = { title: "SEO" };

const PAGE_INFO = {
    home: { label: "Homepage", path: "/" },
    honorBoard: { label: "Honor board", path: "/honor-board" },
    gallery: { label: "Gallery", path: "/gallery" },
    notices: { label: "Notices", path: "/notices" },
    admission: { label: "Admission", path: "/admission" },
};

export default async function SeoPage() {
    await requireAuth(["super_admin", "admin"]);
    const { seo } = await getSiteContent();
    const toForm = (s) => ({
        keywords: s.keywords.join(", "),
        googleVerification: s.googleVerification ?? "",
        bingVerification: s.bingVerification ?? "",
        pages: Object.fromEntries(
            SEO_PAGES.map((k) => [
                k,
                {
                    title: s.pages[k]?.title ?? "",
                    description: s.pages[k]?.description ?? "",
                    keywords: (s.pages[k]?.keywords ?? []).join(", "),
                },
            ]),
        ),
    });
    return (
        <>
            <PageHeader
                eyebrow="Website"
                title="SEO"
                description="How the public pages appear in Google: the title, the short description under it, and keywords. Notices use their own title and first lines automatically."
                actions={
                    <Button href="/" variant="secondary" target="_blank">
                        View website
                    </Button>
                }
            />
            {!seo.saved && (
                <Alert tone="info" className="mb-6">
                    Showing the recommended settings. The website already uses them — press “Save
                    SEO settings” to store them, then fine-tune anything you like.
                </Alert>
            )}
            <SeoForm
                action={saveSeoAction}
                initial={toForm(seo)}
                recommended={toForm({ ...SITE_DEFAULTS.seo, pages: SITE_DEFAULTS.seo.pages })}
                pages={SEO_PAGES.map((k) => ({ key: k, ...PAGE_INFO[k] }))}
                origin={baseUrl()}
            />
        </>
    );
}
