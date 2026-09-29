import { Trophy } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { listResultsForStudent } from "@/server/services/results.js";
import { PageTitle } from "@/components/student/PageTitle.js";
import { ResultList } from "@/components/student/ResultList.js";
import { EmptyState } from "@/components/ui/EmptyState.js";

export const metadata = { title: "Results" };

export default async function StudentResultsPage() {
    const scope = await getStudentScope();
    const rows = await listResultsForStudent(scope);
    return (
        <>
            <PageTitle eyebrow="Mock tests & exams" title="Your results">
                Only you can see these marks.
            </PageTitle>
            {rows.length ? (
                <ResultList rows={rows} />
            ) : (
                <EmptyState icon={Trophy} title="No results yet">
                    When your teacher publishes marks for an exam you sat, they’ll appear here.
                </EmptyState>
            )}
        </>
    );
}
