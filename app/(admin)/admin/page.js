import Link from "next/link";
import { ArrowRight, Inbox, Layers, UserPlus } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { countStudents, listStudents } from "@/server/services/students.js";
import { listClassesWithStats } from "@/server/services/academics.js";
import { countPendingAdmissions } from "@/server/services/admissions.js";
import { Button } from "@/components/ui/Button.js";
import { Panel } from "@/components/ui/Panel.js";
import { formatDate, inDhaka } from "@/lib/date.js";

export const metadata = { title: "Dashboard" };

function greeting() {
    const h = inDhaka(new Date()).getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function AdminHome() {
    const user = await requireAuth(["super_admin", "admin"]);
    const [counts, classes, recent, pending] = await Promise.all([
        countStudents(),
        listClassesWithStats(),
        listStudents({ status: "all", page: 1, pageSize: 5 }),
        countPendingAdmissions(),
    ]);
    const batchCount = classes.reduce((n, c) => n + c.batchCount, 0);
    const stats = [
        { label: "Active students", value: counts.active, href: "/admin/students" },
        { label: "Pending admissions", value: pending, href: "/admin/admissions" },
        { label: "Classes", value: classes.length, href: "/admin/classes" },
        { label: "Batches", value: batchCount, href: "/admin/classes" },
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
                        <dt className="text-sm text-muted group-hover:text-burgundy">{s.label}</dt>
                        <dd className="mt-1 font-serif text-4xl font-medium tabular-nums">
                            {s.value}
                        </dd>
                    </Link>
                ))}
            </dl>

            <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <Panel
                    title="Recently added students"
                    actions={
                        <Link
                            href="/admin/students"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-burgundy hover:underline"
                        >
                            All students <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    }
                >
                    {recent.rows.length === 0 ? (
                        <p className="text-sm text-muted">No students yet.</p>
                    ) : (
                        <ul className="-my-2 divide-y divide-line">
                            {recent.rows.map((s) => (
                                <li
                                    key={String(s._id)}
                                    className="flex items-center justify-between gap-4 py-3"
                                >
                                    <span className="min-w-0">
                                        <Link
                                            href={`/admin/students/${s._id}`}
                                            className="font-semibold hover:text-burgundy"
                                        >
                                            {s.fullName}
                                        </Link>
                                        <span className="block text-xs text-muted">
                                            <span className="font-mono">{s.studentId}</span> ·{" "}
                                            {s.class?.name} · Batch {s.batch?.name}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-xs text-muted">
                                        {formatDate(s.createdAt)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

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
                        <Button href="/admin/classes" variant="secondary" className="justify-start">
                            <Layers aria-hidden="true" className="size-4" /> Manage classes &
                            batches
                        </Button>
                    </div>
                </Panel>
            </div>
        </>
    );
}
