import { Layers } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Button } from "@/components/ui/Button.js";
import { StudentForm } from "@/components/admin/forms/StudentForm.js";
import { createStudentAction } from "../actions.js";

export const metadata = { title: "Add student" };

export default async function NewStudentPage() {
    await requireAuth(["super_admin", "admin"]);
    const options = (await classBatchOptions()).filter((c) => c.batches.length > 0);

    return (
        <>
            <PageHeader
                back={{ href: "/admin/students", label: "Students" }}
                eyebrow="People"
                title="Add a student"
                description="The student ID (TM-YYYY-NNNN) is created automatically."
            />
            {options.length === 0 ? (
                <EmptyState
                    icon={Layers}
                    title="Add a class and batch first"
                    action={<Button href="/admin/classes">Go to classes & batches</Button>}
                >
                    Every student belongs to one active batch.
                </EmptyState>
            ) : (
                <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
                    <StudentForm action={createStudentAction} mode="create" options={options} />
                </div>
            )}
        </>
    );
}
