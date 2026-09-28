import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listStudents } from "@/server/services/students.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { listQuery } from "@/server/validators/common.js";
import { studentListQuery } from "@/server/validators/students.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Button, buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { selectClass } from "@/components/ui/Select.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { Alert } from "@/components/ui/Alert.js";
import { formatPhone, formatTime } from "@/lib/format.js";

export const metadata = { title: "Students" };

export default async function StudentsPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const { q, page, pageSize } = listQuery.parse(sp);
    const f = studentListQuery.parse(sp);
    const [result, options] = await Promise.all([
        listStudents({ q, page, pageSize, ...f }),
        classBatchOptions({ includeInactive: true }),
    ]);
    const filtered = Boolean(q || f.class || f.batch || f.status !== "active");

    return (
        <>
            <PageHeader
                eyebrow="People"
                title="Students"
                description="Accounts are created here after offline admission. Students only ever see their own batch."
                actions={
                    <Button href="/admin/students/new">
                        <UserPlus aria-hidden="true" className="size-4" /> Add student
                    </Button>
                }
            />

            {sp.purged === "1" && (
                <Alert tone="success" className="mb-6">
                    The student and all their data were permanently deleted.
                </Alert>
            )}

            <form
                role="search"
                className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-3 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]"
            >
                <label className="relative">
                    <span className="sr-only">Search</span>
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                        name="q"
                        type="search"
                        defaultValue={q}
                        placeholder="Name, student ID, email or phone"
                        className={`${inputClass} pl-9`}
                    />
                </label>
                <label>
                    <span className="sr-only">Class</span>
                    <select name="class" defaultValue={f.class ?? ""} className={selectClass}>
                        <option value="">All classes</option>
                        {options.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="sr-only">Batch</span>
                    <select name="batch" defaultValue={f.batch ?? ""} className={selectClass}>
                        <option value="">All batches</option>
                        {options.map((c) => (
                            <optgroup key={c.id} label={c.name}>
                                {c.batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {c.name} · Batch {b.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="sr-only">Status</span>
                    <select name="status" defaultValue={f.status} className={selectClass}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="all">All statuses</option>
                    </select>
                </label>
                <div className="flex gap-2">
                    <button type="submit" className={buttonClass({ variant: "secondary" })}>
                        Apply
                    </button>
                    {filtered && (
                        <Link href="/admin/students" className={buttonClass({ variant: "ghost" })}>
                            Clear
                        </Link>
                    )}
                </div>
            </form>

            {result.total === 0 ? (
                filtered ? (
                    <EmptyState icon={Search} title="No students match">
                        Try a shorter search, or clear the filters.
                    </EmptyState>
                ) : (
                    <EmptyState
                        icon={Users}
                        title="No students yet"
                        action={<Button href="/admin/students/new">Add the first student</Button>}
                    >
                        Create classes and batches first, then add students here.
                    </EmptyState>
                )
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Student</Th>
                                <Th>Class · Batch</Th>
                                <Th>Time</Th>
                                <Th>WhatsApp</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((s) => (
                                <tr key={String(s._id)} className="group hover:bg-paper/60">
                                    <Td>
                                        <Link
                                            href={`/admin/students/${s._id}`}
                                            className="font-semibold text-ink group-hover:text-burgundy"
                                        >
                                            {s.fullName}
                                        </Link>
                                        <span className="block font-mono text-xs text-muted">
                                            {s.studentId}
                                        </span>
                                    </Td>
                                    <Td>
                                        {s.class?.name} ·{" "}
                                        <span className="font-semibold">Batch {s.batch?.name}</span>
                                    </Td>
                                    <Td className="whitespace-nowrap text-muted">
                                        {s.batch?.schedule
                                            ? formatTime(s.batch.schedule.startTime)
                                            : "—"}
                                    </Td>
                                    <Td className="whitespace-nowrap">{formatPhone(s.whatsapp)}</Td>
                                    <Td>
                                        {s.status === "active" ? (
                                            <StatusChip tone="success">Active</StatusChip>
                                        ) : (
                                            <StatusChip>Inactive</StatusChip>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination
                        page={result.page}
                        pages={result.pages}
                        total={result.total}
                        basePath="/admin/students"
                        params={{
                            q,
                            class: f.class,
                            batch: f.batch,
                            status: f.status === "active" ? undefined : f.status,
                        }}
                    />
                </>
            )}
        </>
    );
}
