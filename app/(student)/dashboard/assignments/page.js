import { ClipboardList } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { listAssignmentsForStudent } from "@/server/services/assignments.js";
import { PageTitle } from "@/components/student/PageTitle.js";
import { AssignmentList } from "@/components/student/AssignmentList.js";
import { EmptyState } from "@/components/ui/EmptyState.js";

export const metadata = { title: "Assignments" };

export default async function StudentAssignmentsPage() {
    const scope = await getStudentScope();
    const rows = await listAssignmentsForStudent(scope);
    const serverNow = new Date().toISOString();
    const upcoming = rows.filter((a) => a.upcoming);
    const past = rows.filter((a) => !a.upcoming);

    return (
        <>
            <PageTitle eyebrow="Homework & presentations" title="Assignments" />
            {rows.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Nothing to hand in">
                    When your teacher sets homework for your batch, it will show up here.
                </EmptyState>
            ) : (
                <div className="space-y-10">
                    {upcoming.length > 0 && (
                        <section aria-labelledby="due-h">
                            <h2 id="due-h" className="mb-3 text-xl font-medium">
                                Due next
                            </h2>
                            <AssignmentList rows={upcoming} serverNow={serverNow} />
                        </section>
                    )}
                    {past.length > 0 && (
                        <section aria-labelledby="past-h">
                            <h2 id="past-h" className="mb-3 text-xl font-medium">
                                Past deadline
                            </h2>
                            <AssignmentList rows={past} serverNow={serverNow} />
                        </section>
                    )}
                </div>
            )}
        </>
    );
}
