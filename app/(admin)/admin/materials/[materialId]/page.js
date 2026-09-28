import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { MATERIAL_TYPE_LABELS, getMaterialAdmin } from "@/server/services/materials.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { MaterialForm } from "@/components/admin/forms/MaterialForm.js";
import { formatDateTime } from "@/lib/date.js";
import { deleteMaterialAction, setMaterialPublishedAction } from "../actions.js";

export const metadata = { title: "Material" };

export default async function MaterialEditPage({ params, searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const [{ materialId }, sp] = await Promise.all([params, searchParams]);
    const id = objectId.safeParse(materialId);
    if (!id.success) notFound();
    const m = await getMaterialAdmin(id.data).catch(() => notFound());
    const options = await classBatchOptions({ includeInactive: true });
    const mid = String(m._id);
    const initial = {
        id: mid,
        title: m.title,
        description: m.description ?? "",
        type: m.type,
        audience: m.audience,
        classes: m.classes.map(String),
        batches: m.batches.map(String),
        isPublished: m.isPublished,
        file: { originalName: m.file.originalName, size: m.file.size },
    };

    return (
        <>
            <PageHeader
                back={{
                    href: `/admin/materials?type=${m.type}`,
                    label: MATERIAL_TYPE_LABELS[m.type],
                }}
                eyebrow={`Uploaded ${formatDateTime(m.createdAt)}`}
                title={m.title}
                actions={
                    m.isPublished ? (
                        <StatusChip tone="success">Published</StatusChip>
                    ) : (
                        <StatusChip>Hidden</StatusChip>
                    )
                }
            />
            {sp.saved && (
                <Alert tone="success" className="mb-6">
                    Saved.
                </Alert>
            )}
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
                    <MaterialForm options={options} initial={initial} />
                </div>
                <div className="space-y-6">
                    <Panel
                        title="Original file"
                        description="Admins always get the original, without a watermark."
                    >
                        <a
                            href={`/api/files/material/${mid}?download=1`}
                            className={buttonClass({ variant: "secondary" })}
                        >
                            <Download aria-hidden="true" className="size-4" /> Download original
                        </a>
                    </Panel>
                    <Panel title={m.isPublished ? "Hide from students" : "Publish"}>
                        <ActionForm
                            action={setMaterialPublishedAction.bind(null, mid, !m.isPublished)}
                            label={m.isPublished ? "Hide" : "Publish now"}
                        />
                    </Panel>
                    <Panel
                        tone="danger"
                        title="Delete file"
                        description="Removes the file and every student’s watermarked copy."
                    >
                        <ActionForm
                            action={deleteMaterialAction.bind(null, mid, m.type)}
                            label="Delete"
                            danger
                            confirm={{
                                title: `Delete “${m.title}”?`,
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
