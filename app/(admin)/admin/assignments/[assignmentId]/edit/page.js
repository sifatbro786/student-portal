import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards.js";
import { getAssignmentAdmin } from "@/server/services/assignments.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { AssignmentForm } from "@/components/admin/forms/AssignmentForm.js";
import { toDhakaLocal } from "@/lib/date.js";

export const metadata = { title: "Edit assignment" };

export default async function EditAssignmentPage({ params }) {
    await requireAuth(["super_admin", "admin"]);
    const id = objectId.safeParse((await params).assignmentId);
    if (!id.success) notFound();
    const a = await getAssignmentAdmin(id.data).catch(() => notFound());
    const options = await classBatchOptions({ includeInactive: true });
    const aid = String(a._id);

    // Plain values only across the client boundary.
    const initial = {
        id: aid,
        title: a.title,
        type: a.type,
        instructions: a.instructions ?? "",
        audience: a.audience,
        classes: a.classes.map(String),
        batches: a.batches.map(String),
        deadline: toDhakaLocal(a.deadline),
        allowLate: a.allowLate,
        maxFiles: a.maxFiles,
        maxFileSizeMB: a.maxFileSizeMB,
        allowedTypes: [...a.allowedTypes],
        isPublished: a.isPublished,
        attachment: a.attachment ? { originalName: a.attachment.originalName } : null,
    };

    return (
        <>
            <PageHeader
                back={{ href: `/admin/assignments/${aid}`, label: "Back to submissions" }}
                eyebrow="Edit assignment"
                title={a.title}
            />
            <div className="max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-8">
                <AssignmentForm options={options} initial={initial} />
            </div>
        </>
    );
}
