import { Images } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listGalleryAdmin } from "@/server/services/gallery.js";
import { GALLERY_CATEGORY_LABELS } from "@/server/validators/site.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { Button } from "@/components/ui/Button.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { GalleryUpload } from "@/components/admin/GalleryUpload.js";
import { GalleryGrid } from "@/components/admin/GalleryGrid.js";
import { removePlaceholdersAction, reorderGalleryAction } from "./actions.js";

export const metadata = { title: "Gallery" };

export default async function GalleryAdminPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const photos = await listGalleryAdmin();
    const placeholders = photos.filter((p) => p.isPlaceholder).length;
    const featured = photos.filter((p) => p.isFeatured && p.isPublished).length;

    return (
        <>
            <PageHeader
                eyebrow="Website"
                title="Gallery"
                description="Classroom, student and event photos for the public gallery page. Photos marked “Homepage” also appear in the homepage collage (the first 6 in this order)."
                actions={
                    <Button href="/gallery" variant="secondary" target="_blank">
                        View gallery
                    </Button>
                }
            />
            {sp.saved && (
                <Alert tone="success" className="mb-6">
                    Saved — the website is updated.
                </Alert>
            )}
            {sp.deleted && (
                <Alert tone="success" className="mb-6">
                    Photo deleted.
                </Alert>
            )}
            {placeholders > 0 && (
                <div className="mb-6 flex flex-col gap-3 rounded-lg border border-danger/30 bg-burgundy-tint/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm">
                        <strong>{placeholders} placeholder stock photos</strong> are showing until
                        real class photos are uploaded. Remove them before launch.
                    </p>
                    <ActionForm
                        action={removePlaceholdersAction}
                        label="Remove placeholders"
                        size="sm"
                        danger
                        confirm={{
                            title: "Remove all placeholder photos?",
                            body: `${placeholders} stock photos will be deleted.`,
                            confirmLabel: "Remove",
                        }}
                    />
                </div>
            )}

            <Panel
                title="Upload photos"
                description="Tip: landscape photos look best in the homepage collage."
                className="mb-8"
            >
                <GalleryUpload categories={Object.entries(GALLERY_CATEGORY_LABELS)} />
            </Panel>

            <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-medium">All photos</h2>
                <p className="text-sm text-muted">
                    {photos.length} photos · {featured} on the homepage
                </p>
            </div>
            {photos.length === 0 ? (
                <EmptyState icon={Images} title="No photos yet">
                    Upload a few classroom photos above to start the gallery.
                </EmptyState>
            ) : (
                <GalleryGrid
                    key={photos.map((p) => p.id).join()}
                    action={reorderGalleryAction}
                    photos={photos}
                    labels={GALLERY_CATEGORY_LABELS}
                />
            )}
        </>
    );
}
