import { Layers } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { admissionPrefill } from "@/server/services/admissions.js";
import { objectId } from "@/server/validators/common.js";
import { Alert } from "@/components/ui/Alert.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Button } from "@/components/ui/Button.js";
import { StudentForm } from "@/components/admin/forms/StudentForm.js";
import { createStudentAction } from "../actions.js";

export const metadata = { title: "Add student" };

export default async function NewStudentPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const options = (await classBatchOptions()).filter((c) => c.batches.length > 0);

    // FR-ADM-10: pre-fill from an approved application.
    let prefill = null;
    let prefillError = null;
    const admissionId = objectId.safeParse(sp.admission ?? "");
    if (admissionId.success) {
        prefill = await admissionPrefill(admissionId.data).catch((err) => {
            prefillError = err?.code ? err.message : "Could not load that application.";
            return null;
        });
    }

    return (
        <>
            <PageHeader
                back={{ href: "/admin/students", label: "Students" }}
                eyebrow="People"
                title="Add a student"
                description="The student ID (TM-YYYY-NNNN) is created automatically."
            />
            {prefill && (
                <Alert tone="info" className="mb-6">
                    Filled in from application{" "}
                    <strong className="font-mono">{prefill.refNo}</strong>. Check the batch, set a
                    temporary password and create the account — the application photo is copied
                    automatically.
                </Alert>
            )}
            {prefillError && (
                <Alert tone="error" className="mb-6">
                    {prefillError}
                </Alert>
            )}
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
                    <StudentForm
                        action={createStudentAction.bind(null, prefill?.admissionId ?? null)}
                        mode="create"
                        options={options}
                        initial={prefill?.values}
                    />
                </div>
            )}
        </>
    );
}
