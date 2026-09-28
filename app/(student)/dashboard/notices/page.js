import { Megaphone } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { listNoticesForStudent } from "@/server/services/notices.js";
import { listQuery } from "@/server/validators/common.js";
import { PageTitle } from "@/components/student/PageTitle.js";
import { NoticeList } from "@/components/student/NoticeList.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Pagination } from "@/components/ui/Pagination.js";

export const metadata = { title: "Notices" };

export default async function StudentNoticesPage({ searchParams }) {
    const scope = await getStudentScope();
    const { page } = listQuery.parse(await searchParams);
    const result = await listNoticesForStudent(scope, { page, pageSize: 20 });
    return (
        <>
            <PageTitle eyebrow="For your batch" title="Notices" />
            {result.total === 0 ? (
                <EmptyState icon={Megaphone} title="No notices yet">
                    New notices from your teacher will show up here.
                </EmptyState>
            ) : (
                <>
                    <NoticeList rows={result.rows} />
                    <Pagination
                        page={result.page}
                        pages={result.pages}
                        total={result.total}
                        basePath="/dashboard/notices"
                        params={{}}
                    />
                </>
            )}
        </>
    );
}
