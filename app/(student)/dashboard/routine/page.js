import { CalendarDays } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { studentHome } from "@/server/services/student-home.js";
import { listMaterialsForStudent } from "@/server/services/materials.js";
import { PageTitle } from "@/components/student/PageTitle.js";
import { MaterialList } from "@/components/student/MaterialList.js";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/constants.js";
import { formatTime } from "@/lib/format.js";
import { cx } from "@/components/ui/cx.js";

export const metadata = { title: "Routine" };

// FR-BAT-04: batch schedule as the routine header + any routine files.
export default async function RoutinePage() {
    const scope = await getStudentScope();
    const [{ batch }, files] = await Promise.all([
        studentHome(scope),
        listMaterialsForStudent(scope, "routine"),
    ]);
    const days = batch?.schedule?.days ?? [];
    return (
        <>
            <PageTitle eyebrow={`${batch?.class?.name} · Batch ${batch?.name}`} title="Routine" />
            <section
                aria-label="Weekly schedule"
                className="rounded-lg border border-line bg-surface p-4 sm:p-5"
            >
                <ol className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((d) => {
                        const on = days.includes(d);
                        return (
                            <li
                                key={d}
                                className={cx(
                                    "flex flex-col items-center rounded-md py-3 text-center",
                                    on ? "bg-burgundy text-paper" : "bg-paper-deep/60 text-muted",
                                )}
                            >
                                <span className="text-xs font-bold tracking-wide uppercase">
                                    {WEEKDAY_LABELS[d]}
                                </span>
                                <span className="mt-1 text-[0.65rem]">{on ? "Class" : "—"}</span>
                            </li>
                        );
                    })}
                </ol>
                <p className="mt-4 flex items-center gap-2 text-sm">
                    <CalendarDays aria-hidden="true" className="size-4 text-burgundy" />
                    <span>
                        {formatTime(batch?.schedule?.startTime)} –{" "}
                        {formatTime(batch?.schedule?.endTime)}
                        {batch?.room ? ` · Room ${batch.room}` : ""}
                    </span>
                </p>
            </section>
            <h2 className="mt-8 mb-3 text-xl font-medium">Routine files</h2>
            {files.length ? (
                <MaterialList rows={files} />
            ) : (
                <p className="text-sm text-muted">
                    No routine files right now. Your weekly class time is shown above.
                </p>
            )}
        </>
    );
}
