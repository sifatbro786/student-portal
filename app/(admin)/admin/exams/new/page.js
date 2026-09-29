import { requireAuth } from "@/server/auth/guards.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { ExamForm } from "@/components/admin/forms/ExamForm.js";
import { saveExamAction } from "../actions.js";

export const metadata = { title: "New exam" };

export default async function NewExamPage() {
    await requireAuth(["super_admin", "admin"]);
    const options = await classBatchOptions();
    return (
        <>
            <PageHeader
                back={{ href: "/admin/exams", label: "Exams & results" }}
                eyebrow="Academics"
                title="New exam"
            />
            <div className="max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-8">
                <ExamForm action={saveExamAction.bind(null, null)} options={options} />
            </div>
        </>
    );
}
