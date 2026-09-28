import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { getBatch } from "@/server/services/academics.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Button } from "@/components/ui/Button.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { BatchForm } from "@/components/admin/forms/BatchForm.js";
import { scheduleLabel } from "@/lib/format.js";
import { deleteBatchAction, updateBatchAction } from "../../classes/actions.js";

export const metadata = { title: "Batch" };

export default async function BatchPage({ params }) {
    await requireAuth(["super_admin", "admin"]);
    const { batchId } = await params;
    const id = objectId.safeParse(batchId);
    if (!id.success) notFound();
    const b = await getBatch(id.data).catch(() => notFound());
    const bid = String(b._id);
    const cid = String(b.class._id);
    const initial = {
        name: b.name,
        days: b.schedule.days,
        startTime: b.schedule.startTime,
        endTime: b.schedule.endTime,
        room: b.room ?? "",
        notes: b.notes ?? "",
        isActive: b.isActive,
    };

    return (
        <>
            <PageHeader
                back={{ href: `/admin/classes/${cid}`, label: b.class.name }}
                eyebrow={b.class.name}
                title={`Batch ${b.name}`}
                description={scheduleLabel(b.schedule)}
                actions={
                    <Button variant="secondary" href={`/admin/students?class=${cid}&batch=${bid}`}>
                        <Users aria-hidden="true" className="size-4" /> View students
                    </Button>
                }
            />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <Panel
                    title="Schedule & details"
                    description="Changes show up for students on their next page load."
                >
                    <BatchForm action={updateBatchAction.bind(null, bid, cid)} initial={initial} />
                </Panel>
                <Panel
                    tone="danger"
                    title="Delete batch"
                    description="Only possible if no student has ever been in this batch. Otherwise untick “Active”."
                    className="h-fit"
                >
                    <ActionForm
                        action={deleteBatchAction.bind(null, bid, cid)}
                        label="Delete batch"
                        danger
                        confirm={{
                            title: `Delete batch ${b.name}?`,
                            body: "This cannot be undone.",
                            confirmLabel: "Delete",
                        }}
                    />
                </Panel>
            </div>
        </>
    );
}
