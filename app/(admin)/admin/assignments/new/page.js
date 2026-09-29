import { requireAuth } from "@/server/auth/guards.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { AssignmentForm } from "@/components/admin/forms/AssignmentForm.js";

export const metadata = { title: "New assignment" };

export default async function NewAssignmentPage() {
    await requireAuth(["super_admin", "admin"]);
    const options = await classBatchOptions();
    return (
        <>
            <PageHeader
                back={{ href: "/admin/assignments", label: "Assignments" }}
                eyebrow="Content"
                title="New assignment"
            />
            <div className="max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-8">
                <AssignmentForm options={options} />
            </div>
        </>
    );
}
