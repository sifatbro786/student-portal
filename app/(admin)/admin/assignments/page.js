import Link from "next/link";
import { ClipboardList, Plus, Search } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listAssignmentsAdmin } from "@/server/services/assignments.js";
import { listQuery } from "@/server/validators/common.js";
import { assignmentListQuery } from "@/server/validators/assignments.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Button, buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { Alert } from "@/components/ui/Alert.js";
import { cx } from "@/components/ui/cx.js";
import { AssignmentState } from "@/components/admin/AssignmentState.js";
import { ASSIGNMENT_TYPE_LABELS } from "@/lib/constants.js";
import { formatDateTime } from "@/lib/date.js";

export const metadata = { title: "Assignments" };

const TABS = [
    ["all", "All"],
    ["open", "Open"],
    ["closed", "Past deadline"],
    ["draft", "Hidden"],
];

export default async function AssignmentsPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const { q, page, pageSize } = listQuery.parse(sp);
    const { status } = assignmentListQuery.parse(sp);
    const result = await listAssignmentsAdmin({ q, status, page, pageSize });

    return (
        <>
            <PageHeader
                eyebrow="Content"
                title="Assignments"
                description="Homework, assignments and presentations. Students upload their work here; you review it and download everything in one ZIP."
                actions={
                    <Button href="/admin/assignments/new">
                        <Plus aria-hidden="true" className="size-4" /> New assignment
                    </Button>
                }
            />
            {sp.deleted === "1" && (
                <Alert tone="success" className="mb-6">
                    Assignment and its submissions deleted.
                </Alert>
            )}

            <nav
                aria-label="Filter by status"
                className="mb-5 flex gap-1 overflow-x-auto border-b border-line"
            >
                {TABS.map(([k, l]) => (
                    <Link
                        key={k}
                        href={`/admin/assignments?status=${k}`}
                        aria-current={k === status ? "page" : undefined}
                        className={cx(
                            "-mb-px shrink-0 rounded-t-md border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors",
                            k === status
                                ? "border-line bg-surface text-burgundy"
                                : "border-transparent text-muted hover:text-ink",
                        )}
                    >
                        {l}
                    </Link>
                ))}
            </nav>

            <form role="search" className="mb-5 flex gap-2">
                <input type="hidden" name="status" value={status} />
                <label className="relative flex-1">
                    <span className="sr-only">Search</span>
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                        name="q"
                        type="search"
                        defaultValue={q}
                        placeholder="Search assignments"
                        className={`${inputClass} pl-9`}
                    />
                </label>
                <button type="submit" className={buttonClass({ variant: "secondary" })}>
                    Search
                </button>
            </form>

            {result.total === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title={q || status !== "all" ? "Nothing here" : "No assignments yet"}
                    action={
                        !q &&
                        status === "all" && (
                            <Button href="/admin/assignments/new">Create an assignment</Button>
                        )
                    }
                >
                    {q || status !== "all"
                        ? "Try another search or filter."
                        : "Set a deadline, pick the batches, and students can upload their work from their phones."}
                </EmptyState>
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Title</Th>
                                <Th>For</Th>
                                <Th>Deadline</Th>
                                <Th className="text-right">Submitted</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((a) => (
                                <tr key={String(a._id)} className="hover:bg-paper/60">
                                    <Td>
                                        <Link
                                            href={`/admin/assignments/${a._id}`}
                                            className="font-semibold hover:text-burgundy"
                                        >
                                            {a.title}
                                        </Link>
                                        <span className="block text-xs text-muted">
                                            {ASSIGNMENT_TYPE_LABELS[a.type]}
                                        </span>
                                    </Td>
                                    <Td className="max-w-56 truncate">{a.audienceText}</Td>
                                    <Td className="whitespace-nowrap text-muted">
                                        {formatDateTime(a.deadline)}
                                    </Td>
                                    <Td className="text-right font-semibold tabular-nums">
                                        {a.submissions}
                                    </Td>
                                    <Td>
                                        <AssignmentState state={a.state} />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination
                        page={result.page}
                        pages={result.pages}
                        total={result.total}
                        basePath="/admin/assignments"
                        params={{ q, status }}
                    />
                </>
            )}
        </>
    );
}
