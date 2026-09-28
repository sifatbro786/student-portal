import { requireAuth } from "@/server/auth/guards.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { contentListQuery } from "@/server/validators/content.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { MaterialForm } from "@/components/admin/forms/MaterialForm.js";

export const metadata = { title: "Upload material" };

export default async function NewMaterialPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const { type } = contentListQuery.parse(await searchParams);
    const options = await classBatchOptions();
    return (
        <>
            <PageHeader
                back={{ href: `/admin/materials?type=${type}`, label: "Materials" }}
                eyebrow="Content"
                title="Upload a file"
            />
            <div className="max-w-3xl rounded-lg border border-line bg-surface p-5 sm:p-8">
                <MaterialForm options={options} defaultType={type} />
            </div>
        </>
    );
}
