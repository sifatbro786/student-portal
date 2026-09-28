import { requireAuth } from "@/server/auth/guards.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { NoticeForm } from "@/components/admin/forms/NoticeForm.js";

export const metadata = { title: "New notice" };

export default async function NewNoticePage() {
    await requireAuth(["super_admin", "admin"]);
    const options = await classBatchOptions();
    return (
        <>
            <PageHeader
                back={{ href: "/admin/notices", label: "Notices" }}
                eyebrow="Content"
                title="New notice"
            />
            <div className="max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-8">
                <NoticeForm options={options} />
            </div>
        </>
    );
}
