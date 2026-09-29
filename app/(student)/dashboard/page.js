import Link from "next/link";
import {
    BookOpen,
    CalendarDays,
    ClipboardList,
    FileQuestion,
    Trophy,
    UserRound,
} from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { studentHome } from "@/server/services/student-home.js";
import { NoticeList } from "@/components/student/NoticeList.js";
import { AssignmentList } from "@/components/student/AssignmentList.js";
import { ResultList } from "@/components/student/ResultList.js";
import { scheduleLabel } from "@/lib/format.js";
import { inDhaka } from "@/lib/date.js";

export const metadata = { title: "Dashboard" };

const TILES = [
    { href: "/dashboard/materials", label: "Notes", icon: BookOpen },
    { href: "/dashboard/question-papers", label: "Question papers", icon: FileQuestion },
    { href: "/dashboard/routine", label: "Routine", icon: CalendarDays },
    { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
    { href: "/dashboard/results", label: "Results", icon: Trophy },
    { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export default async function StudentHome() {
    const scope = await getStudentScope();
    const { batch, notices, deadlines, latestResult } = await studentHome(scope);
    const h = inDhaka(new Date()).getHours();
    const hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="space-y-8">
            <section>
                <p className="eyebrow text-gold-deep">{hello}</p>
                <h1 className="mt-2 text-3xl font-medium tracking-tight">
                    {scope.fullName.split(" ")[0]}.
                </h1>
                <div className="mt-5 flex items-start gap-4 rounded-lg bg-burgundy p-4 text-paper">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper/10">
                        <CalendarDays aria-hidden="true" className="size-5 text-gold-light" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-serif text-lg leading-tight">
                            {batch?.class?.name} · Batch {batch?.name}
                        </p>
                        <p className="mt-1 text-sm text-paper/80">
                            {scheduleLabel(batch?.schedule)}
                        </p>
                        {batch?.room && <p className="text-sm text-paper/70">Room {batch.room}</p>}
                        <p className="mt-2 font-mono text-xs text-gold-light">{scope.studentId}</p>
                    </div>
                </div>
            </section>

            <section aria-labelledby="latest-h">
                <div className="mb-3 flex items-baseline justify-between">
                    <h2 id="latest-h" className="text-xl font-medium">
                        Latest notices
                    </h2>
                    <Link
                        href="/dashboard/notices"
                        className="text-sm font-semibold text-burgundy hover:underline"
                    >
                        See all
                    </Link>
                </div>
                {notices.length ? (
                    <NoticeList rows={notices} />
                ) : (
                    <p className="rounded-lg border border-dashed border-line-strong p-5 text-sm text-muted">
                        No notices right now. You’re all caught up.
                    </p>
                )}
            </section>

            {deadlines.length > 0 && (
                <section aria-labelledby="due-h">
                    <div className="mb-3 flex items-baseline justify-between">
                        <h2 id="due-h" className="text-xl font-medium">
                            Upcoming deadlines
                        </h2>
                        <Link
                            href="/dashboard/assignments"
                            className="text-sm font-semibold text-burgundy hover:underline"
                        >
                            All assignments
                        </Link>
                    </div>
                    <AssignmentList rows={deadlines} serverNow={new Date().toISOString()} />
                </section>
            )}

            {latestResult && (
                <section aria-labelledby="result-h">
                    <div className="mb-3 flex items-baseline justify-between">
                        <h2 id="result-h" className="text-xl font-medium">
                            Latest result
                        </h2>
                        <Link
                            href="/dashboard/results"
                            className="text-sm font-semibold text-burgundy hover:underline"
                        >
                            All results
                        </Link>
                    </div>
                    <ResultList rows={[latestResult]} />
                </section>
            )}

            <section aria-label="Shortcuts" className="grid grid-cols-2 gap-3">
                {TILES.map((t) => (
                    <Link
                        key={t.href}
                        href={t.href}
                        className="group flex items-center gap-3 rounded-lg border border-line bg-surface p-4 hover:border-gold"
                    >
                        <t.icon aria-hidden="true" className="size-5 text-burgundy" />
                        <span className="text-sm font-semibold group-hover:text-burgundy">
                            {t.label}
                        </span>
                    </Link>
                ))}
            </section>
        </div>
    );
}
