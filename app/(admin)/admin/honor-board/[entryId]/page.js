import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards.js";
import { getHonorEntry } from "@/server/services/honor.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { HonorEntryForm } from "@/components/admin/forms/HonorEntryForm.js";
import { HonorCard } from "@/components/public/HonorCard.js";
import { deleteHonorEntryAction, setHonorPublishedAction } from "../actions.js";

export const metadata = { title: "Honor entry" };

export default async function HonorEntryPage({ params, searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const [{ entryId }, sp] = await Promise.all([params, searchParams]);
    const id = objectId.safeParse(entryId);
    if (!id.success) notFound();
    const e = await getHonorEntry(id.data).catch(() => notFound());
    const eid = String(e._id);
    const initial = {
        id: eid,
        year: e.year,
        name: e.name,
        grade: e.grade,
        percentage: e.percentage,
        school: e.school ?? "",
        consentConfirmed: e.consentConfirmed,
        isPublished: e.isPublished,
        thumbUrl: e.thumbUrl,
    };
    return (
        <>
            <PageHeader
                back={{ href: `/admin/honor-board?year=${e.year}`, label: `Honor board ${e.year}` }}
                eyebrow="Honor board entry"
                title={e.name}
            />
            {sp.added === "photo" && (
                <Alert tone="info" className="mb-6">
                    Added with the student’s photo. It stays hidden until you tick guardian consent
                    and publish.
                </Alert>
            )}
            {sp.added === "1" && (
                <Alert tone="success" className="mb-6">
                    Added from the student record.
                </Alert>
            )}
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
                    <HonorEntryForm initial={initial} />
                </div>
                <div className="space-y-6">
                    <Panel title="How it looks">
                        <div className="py-2">
                            <HonorCard
                                name={e.name}
                                grade={e.grade}
                                percentage={e.percentage}
                                photoUrl={e.consentConfirmed ? e.photoUrl : null}
                            />
                        </div>
                        {e.photo && !e.consentConfirmed && (
                            <p className="mt-4 text-xs text-muted">
                                The photo isn’t shown publicly until consent is ticked.
                            </p>
                        )}
                    </Panel>
                    <Panel title={e.isPublished ? "Hide from website" : "Publish"}>
                        <ActionForm
                            action={setHonorPublishedAction.bind(null, eid, !e.isPublished)}
                            label={e.isPublished ? "Hide" : "Publish now"}
                        />
                    </Panel>
                    <Panel
                        tone="danger"
                        title="Delete entry"
                        description="Removes the entry and its photos."
                    >
                        <ActionForm
                            action={deleteHonorEntryAction.bind(null, eid)}
                            label="Delete"
                            danger
                            confirm={{
                                title: `Delete ${e.name}?`,
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
