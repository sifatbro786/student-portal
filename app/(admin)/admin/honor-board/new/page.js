import { requireAuth } from "@/server/auth/guards.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { HonorEntryForm } from "@/components/admin/forms/HonorEntryForm.js";

export const metadata = { title: "Add honor entry" };

export default async function NewHonorEntryPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const y = Number((await searchParams).year);
    const year = Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : new Date().getFullYear();
    return (
        <>
            <PageHeader
                back={{ href: `/admin/honor-board?year=${year}`, label: "Honor board" }}
                eyebrow="Website"
                title="Add an achiever"
            />
            <div className="max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-8">
                <HonorEntryForm defaultYear={year} />
            </div>
        </>
    );
}
