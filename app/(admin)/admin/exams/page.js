import Link from "next/link";
import { ClipboardCheck, Plus, Search } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listExamsAdmin } from "@/server/services/results.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { listQuery } from "@/server/validators/common.js";
import { examListQuery } from "@/server/validators/results.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Button, buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { selectClass } from "@/components/ui/Select.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { Alert } from "@/components/ui/Alert.js";
import { formatDate } from "@/lib/date.js";

export const metadata = { title: "Exams & results" };

export default async function ExamsPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const { q, page, pageSize } = listQuery.parse(sp);
    const f = examListQuery.parse(sp);
    const [result, options] = await Promise.all([
        listExamsAdmin({ classId: f.class, status: f.status, q, page, pageSize }),
        classBatchOptions({ includeInactive: true }),
    ]);
    const filtered = Boolean(q || f.class || f.status !== "all");

    return (
        <>
            <PageHeader
                eyebrow="Academics"
                title="Exams & results"
                description="Enter marks for each exam. Students only ever see their own result, and only after you publish the exam."
                actions={
                    <Button href="/admin/exams/new">
                        <Plus aria-hidden="true" className="size-4" /> New exam
                    </Button>
                }
            />
            {sp.deleted === "1" && (
                <Alert tone="success" className="mb-6">
                    Exam and its results deleted.
                </Alert>
            )}

            <form
                role="search"
                className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-3 md:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))_auto]"
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
                        placeholder="Search exams"
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
                    <span className="sr-only">Status</span>
                    <select name="status" defaultValue={f.status} className={selectClass}>
                        <option value="all">Any status</option>
                        <option value="published">Published</option>
                        <option value="draft">Hidden</option>
                    </select>
                </label>
                <button type="submit" className={buttonClass({ variant: "secondary" })}>
                    Filter
                </button>
            </form>

            {result.total === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title={filtered ? "Nothing matches" : "No exams yet"}
                    action={!filtered && <Button href="/admin/exams/new">Create an exam</Button>}
                >
                    {filtered
                        ? "Try another search or filter."
                        : "Create an exam, then type the marks in a grid or import a CSV."}
                </EmptyState>
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Exam</Th>
                                <Th>Class · batches</Th>
                                <Th>Date</Th>
                                <Th className="text-right">Results</Th>
                                <Th className="text-right">Average</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((e) => (
                                <tr key={String(e._id)} className="hover:bg-paper/60">
                                    <Td>
                                        <Link
                                            href={`/admin/exams/${e._id}`}
                                            className="font-semibold hover:text-burgundy"
                                        >
                                            {e.title}
                                        </Link>
                                        <span className="block text-xs text-muted">
                                            Full marks {e.fullMarks}
                                        </span>
                                    </Td>
                                    <Td>
                                        {e.className}
                                        <span className="block text-xs text-muted">
                                            Batch {e.batchText}
                                        </span>
                                    </Td>
                                    <Td className="whitespace-nowrap text-muted">
                                        {formatDate(e.date)}
                                    </Td>
                                    <Td className="text-right font-semibold tabular-nums">
                                        {e.results}
                                    </Td>
                                    <Td className="text-right tabular-nums">
                                        {e.avg === null ? "—" : `${e.avg}%`}
                                    </Td>
                                    <Td>
                                        {e.isPublished ? (
                                            <StatusChip tone="success">Published</StatusChip>
                                        ) : (
                                            <StatusChip>Hidden</StatusChip>
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
                        basePath="/admin/exams"
                        params={{ q, class: f.class, status: f.status }}
                    />
                </>
            )}
        </>
    );
}
