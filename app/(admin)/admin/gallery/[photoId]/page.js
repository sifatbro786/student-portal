import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards.js";
import { getGalleryImage } from "@/server/services/gallery.js";
import { GALLERY_CATEGORY_LABELS } from "@/server/validators/site.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { GalleryEditForm } from "@/components/admin/forms/GalleryEditForm.js";
import { deleteGalleryAction, updateGalleryAction } from "../actions.js";

export const metadata = { title: "Gallery photo" };

export default async function GalleryPhotoPage({ params }) {
    await requireAuth(["super_admin", "admin"]);
    const id = objectId.safeParse((await params).photoId);
    if (!id.success) notFound();
    const p = await getGalleryImage(id.data).catch(() => notFound());
    return (
        <>
            <PageHeader
                back={{ href: "/admin/gallery", label: "Gallery" }}
                eyebrow="Gallery photo"
                title={p.caption || "Untitled photo"}
            />
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
                    <GalleryEditForm
                        action={updateGalleryAction.bind(null, p.id)}
                        initial={{
                            category: p.category,
                            caption: p.caption,
                            alt: p.alt,
                            isFeatured: p.isFeatured,
                            consentConfirmed: p.consentConfirmed,
                            isPublished: p.isPublished,
                        }}
                        categories={Object.entries(GALLERY_CATEGORY_LABELS)}
                    />
                </div>
                <div className="space-y-6">
                    <Panel title="Photo">
                        <Image
                            src={p.thumbUrl}
                            alt={p.alt || p.caption || ""}
                            width={p.width}
                            height={p.height}
                            unoptimized
                            className="h-auto w-full rounded-md"
                        />
                        <p className="mt-3 text-xs text-muted">
                            {p.width}×{p.height}px
                            {p.credit ? ` · ${p.credit}` : ""}
                        </p>
                    </Panel>
                    <Panel
                        tone="danger"
                        title="Delete photo"
                        description="Removes it from the website and the server."
                    >
                        <ActionForm
                            action={deleteGalleryAction.bind(null, p.id)}
                            label="Delete"
                            danger
                            confirm={{
                                title: "Delete this photo?",
                                body: "This cannot be undone.",
                                confirmLabel: "Delete",
                            }}
                        />
                    </Panel>
                </div>
            </div>
        </>
    );
}
