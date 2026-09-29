import Link from "next/link";
import { ArrowRight, ClipboardList, Inbox, UserPlus, Wallet } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { countStudents } from "@/server/services/students.js";
import { countPendingAdmissions, listAdmissions } from "@/server/services/admissions.js";
import {
    countSubmissionsAwaitingReview,
    upcomingDeadlinesAdmin,
} from "@/server/services/assignments.js";
import { countDueThisMonth } from "@/server/services/payments.js";
import { Button } from "@/components/ui/Button.js";
import { Panel } from "@/components/ui/Panel.js";
import { AdmissionStatus } from "@/components/admin/AdmissionStatus.js";
import { formatDate, formatDateTime, formatPeriod, inDhaka, periodOf } from "@/lib/date.js";

export const metadata = { title: "Dashboard" };

function greeting() {
    const h = inDhaka(new Date()).getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// PRD §4.13 admin dashboard. Plain figures, no count-up animation (PRD §13).
export default async function AdminHome() {
    const user = await requireAuth(["super_admin", "admin"]);
    const [counts, pending, awaiting, due, admissions, deadlines] = await Promise.all([
        countStudents(),
        countPendingAdmissions(),
        countSubmissionsAwaitingReview(7),
        countDueThisMonth(),
        listAdmissions({ status: "all", page: 1, pageSize: 5 }),
        upcomingDeadlinesAdmin(7, 5),
    ]);
    const stats = [
        { label: "Active students", value: counts.active, href: "/admin/students" },
        { label: "Pending admissions", value: pending, href: "/admin/admissions" },
        {
            label: "Submissions to review",
            hint: "last 7 days",
            value: awaiting,
            href: "/admin/assignments",
        },
        {
            label: `Due for ${formatPeriod(periodOf())}`,
            hint: "students",
            value: due,
            href: "/admin/payments/list",
        },
    ];

    return (
        <>
            <header className="mb-10">
                <p className="eyebrow text-gold-deep">{formatDate(new Date())}</p>
                <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                    {greeting()}, <em className="text-burgundy">{user.name.split(" ")[0]}.</em>
                </h1>
                <span className="gold-rule mt-4" />
            </header>

            <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
                {stats.map((s, i) => (
                    <Link
                        key={s.label}
                        href={s.href}
                        className={`group px-1 py-5 sm:px-5 ${i % 2 ? "border-l border-line" : ""} ${i === 2 ? "border-t border-line lg:border-t-0 lg:border-l" : ""} ${i === 3 ? "border-t lg:border-t-0" : ""}`}
                    >
                        <dt className="text-sm text-muted group-hover:text-burgundy">
                            {s.label}
                            {s.hint && <span className="block text-xs">{s.hint}</span>}
                        </dt>
                        <dd className="mt-1 font-serif text-4xl font-medium tabular-nums">
                            {s.value}
                        </dd>
                    </Link>
                ))}
            </dl>

            <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-8">
                    <Panel
                        title="Recent admissions"
                        actions={
                            <Link
                                href="/admin/admissions"
                                className="inline-flex items-center gap-1 text-sm font-semibold text-burgundy hover:underline"
                            >
                                All <ArrowRight aria-hidden="true" className="size-4" />
                            </Link>
                        }
                    >
                        {admissions.rows.length === 0 ? (
                            <p className="text-sm text-muted">No applications yet.</p>
                        ) : (
                            <ul className="-my-2 divide-y divide-line">
                                {admissions.rows.map((a) => (
                                    <li
                                        key={String(a._id)}
                                        className="flex items-center justify-between gap-4 py-3"
                                    >
                                        <span className="min-w-0">
                                            <Link
                                                href={`/admin/admissions/${a._id}`}
                                                className="font-semibold hover:text-burgundy"
                                            >
                                                {a.fullName}
                                            </Link>
                                            <span className="block text-xs text-muted">
                                                <span className="font-mono">{a.refNo}</span> ·{" "}
                                                {a.class?.name} · {formatDate(a.createdAt)}
                                            </span>
                                        </span>
                                        <AdmissionStatus
                                            status={a.status}
                                            converted={!!a.student}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel
                        title="Deadlines this week"
                        actions={
                            <Link
                                href="/admin/assignments?status=open"
                                className="inline-flex items-center gap-1 text-sm font-semibold text-burgundy hover:underline"
                            >
                                Assignments <ArrowRight aria-hidden="true" className="size-4" />
                            </Link>
                        }
                    >
                        {deadlines.length === 0 ? (
                            <p className="text-sm text-muted">Nothing due in the next 7 days.</p>
                        ) : (
                            <ul className="-my-2 divide-y divide-line">
                                {deadlines.map((d) => (
                                    <li
                                        key={d.id}
                                        className="flex items-center justify-between gap-4 py-3"
                                    >
                                        <span className="min-w-0">
                                            <Link
                                                href={`/admin/assignments/${d.id}`}
                                                className="font-semibold hover:text-burgundy"
                                            >
                                                {d.title}
                                            </Link>
                                            <span className="block text-xs text-muted">
                                                {d.audienceText} · due {formatDateTime(d.deadline)}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-xs text-muted tabular-nums">
                                            {d.submissions} handed in
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                <Panel title="Quick actions">
                    <div className="grid gap-2">
                        <Button href="/admin/students/new" className="justify-start">
                            <UserPlus aria-hidden="true" className="size-4" /> Add a student
                        </Button>
                        <Button
                            href="/admin/admissions"
                            variant="secondary"
                            className="justify-start"
                        >
                            <Inbox aria-hidden="true" className="size-4" /> Review admissions
                        </Button>
                        <Button
                            href="/admin/assignments/new"
                            variant="secondary"
                            className="justify-start"
                        >
                            <ClipboardList aria-hidden="true" className="size-4" /> New assignment
                        </Button>
                        <Button
                            href="/admin/payments"
                            variant="secondary"
                            className="justify-start"
                        >
                            <Wallet aria-hidden="true" className="size-4" /> Payments
                        </Button>
                    </div>
                </Panel>
            </div>
        </>
    );
}
