import { BookOpen } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { listMaterialsForStudent } from "@/server/services/materials.js";
import { PageTitle } from "@/components/student/PageTitle.js";
import { MaterialList } from "@/components/student/MaterialList.js";
import { EmptyState } from "@/components/ui/EmptyState.js";

/** Shared server component for Notes / Question papers lists. */
export async function MaterialsPage({ type, title, intro, empty }) {
    const scope = await getStudentScope();
    const rows = await listMaterialsForStudent(scope, type);
    return (
        <>
            <PageTitle eyebrow="For your batch" title={title}>
                {intro}
            </PageTitle>
            {rows.length ? (
                <MaterialList rows={rows} />
            ) : (
                <EmptyState icon={BookOpen} title={empty} />
            )}
        </>
    );
}
