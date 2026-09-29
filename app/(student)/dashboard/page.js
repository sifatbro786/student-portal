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
import { format } from "date-fns";
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

    const today = format(inDhaka(new Date()), "EEEE, d MMMM");
    const sectionHead = (id, title, href, linkLabel) => (
        <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id={id} className="text-xl font-medium">
                {title}
            </h2>
            {href && (
                <Link
                    href={href}
                    className="shrink-0 text-sm font-semibold text-burgundy hover:underline"
                >
                    {linkLabel}
                </Link>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-line pb-6">
                <div>
                    <p className="eyebrow text-gold-deep">{hello}</p>
                    <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-[2.1rem]">
                        {scope.fullName.split(" ")[0]}.
                    </h1>
                </div>
                <p className="text-sm text-muted">{today}</p>
            </header>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                {/* Main column: what needs doing, then what's new */}
                <div className="space-y-8">
                    <section aria-labelledby="due-h">
                        {sectionHead(
                            "due-h",
                            "Upcoming deadlines",
                            "/dashboard/assignments",
                            "All assignments",
                        )}
                        {deadlines.length ? (
                            <AssignmentList rows={deadlines} serverNow={new Date().toISOString()} />
                        ) : (
                            <p className="rounded-lg border border-dashed border-line-strong p-5 text-sm text-muted">
                                Nothing due right now — you’re all caught up.
                            </p>
                        )}
                    </section>

                    <section aria-labelledby="latest-h">
                        {sectionHead("latest-h", "Latest notices", "/dashboard/notices", "See all")}
                        {notices.length ? (
                            <NoticeList rows={notices} />
                        ) : (
                            <p className="rounded-lg border border-dashed border-line-strong p-5 text-sm text-muted">
                                No notices right now.
                            </p>
                        )}
                    </section>
                </div>

                {/* Side column: my class, my latest result */}
                <aside className="space-y-8">
                    <section aria-labelledby="batch-h">
                        <h2 id="batch-h" className="sr-only">
                            My batch
                        </h2>
                        <div className="grain relative overflow-hidden rounded-lg bg-burgundy p-5 text-paper">
                            <p className="eyebrow text-[0.62rem] text-gold-light">My batch</p>
                            <p className="mt-2 font-serif text-2xl leading-tight">
                                {batch?.class?.name} · Batch {batch?.name}
                            </p>
                            <p className="mt-3 flex items-start gap-2 text-sm text-paper/85">
                                <CalendarDays
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-gold-light"
                                />
                                {scheduleLabel(batch?.schedule)}
                            </p>
                            {batch?.room && (
                                <p className="mt-1 pl-6 text-sm text-paper/70">{batch.room}</p>
                            )}
                            <div className="mt-5 flex items-center justify-between border-t border-paper/15 pt-3">
                                <span className="font-mono text-xs text-gold-light">
                                    {scope.studentId}
                                </span>
                                <Link
                                    href="/dashboard/routine"
                                    className="text-xs font-semibold text-paper underline decoration-gold-light underline-offset-4"
                                >
                                    Routine
                                </Link>
                            </div>
                        </div>
                    </section>

                    {latestResult && (
                        <section aria-labelledby="result-h">
                            {sectionHead(
                                "result-h",
                                "Latest result",
                                "/dashboard/results",
                                "All results",
                            )}
                            <ResultList rows={[latestResult]} />
                        </section>
                    )}

                    {/* Phones: the sidebar is a drawer, so keep quick links on the page */}
                    <section aria-label="Shortcuts" className="grid grid-cols-2 gap-3 lg:hidden">
                        {TILES.map((t) => (
                            <Link
                                key={t.href}
                                href={t.href}
                                className="group flex min-h-14 items-center gap-3 rounded-lg border border-line bg-surface p-4 hover:border-gold"
                            >
                                <t.icon
                                    aria-hidden="true"
                                    className="size-5 shrink-0 text-burgundy"
                                />
                                <span className="text-sm font-semibold group-hover:text-burgundy">
                                    {t.label}
                                </span>
                            </Link>
                        ))}
                    </section>
                </aside>
            </div>
        </div>
    );
}
