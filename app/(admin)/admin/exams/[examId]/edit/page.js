import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAuth } from "@/server/auth/guards.js";
import { getExamAdmin } from "@/server/services/results.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { ExamForm } from "@/components/admin/forms/ExamForm.js";
import { inDhaka } from "@/lib/date.js";
import { saveExamAction } from "../../actions.js";

export const metadata = { title: "Edit exam" };

export default async function EditExamPage({ params }) {
    await requireAuth(["super_admin", "admin"]);
    const id = objectId.safeParse((await params).examId);
    if (!id.success) notFound();
    const e = await getExamAdmin(id.data).catch(() => notFound());
    const options = await classBatchOptions({ includeInactive: true });
    const eid = String(e._id);
    const initial = {
        title: e.title,
        class: String(e.class),
        batches: e.batches.map(String),
        date: format(inDhaka(e.date), "yyyy-MM-dd"),
        fullMarks: e.fullMarks,
        isPublished: e.isPublished,
    };
    return (
        <>
            <PageHeader
                back={{ href: `/admin/exams/${eid}`, label: "Back to results" }}
                eyebrow="Edit exam"
                title={e.title}
            />
            <div className="max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-8">
                <ExamForm
                    action={saveExamAction.bind(null, eid)}
                    options={options}
                    initial={initial}
                />
            </div>
        </>
    );
}
