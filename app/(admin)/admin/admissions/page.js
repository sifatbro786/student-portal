import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listAdmissions } from "@/server/services/admissions.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { listQuery } from "@/server/validators/common.js";
import { admissionListQuery } from "@/server/validators/admissions.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Button, buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { selectClass } from "@/components/ui/Select.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { Alert } from "@/components/ui/Alert.js";
import { AdmissionStatus } from "@/components/admin/AdmissionStatus.js";
import { formatDateTime } from "@/lib/date.js";
import { formatPhone } from "@/lib/format.js";

export const metadata = { title: "Admissions" };

export default async function AdmissionsPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const { q, page, pageSize } = listQuery.parse(sp);
    const f = admissionListQuery.parse(sp);
    const [result, options] = await Promise.all([
        listAdmissions({ q, page, pageSize, ...f }),
        classBatchOptions({ includeInactive: true }),
    ]);
    const filtered = Boolean(q || f.class || f.from || f.to || f.status !== "pending");

    return (
        <>
            <PageHeader
                eyebrow="People"
                title="Admissions"
                description="Applications from the public admission form. Approve one, then turn it into a student account in one click."
                actions={
                    <Button href="/admission" variant="secondary" target="_blank">
                        Open the public form
                    </Button>
                }
            />
            {sp.deleted === "1" && (
                <Alert tone="success" className="mb-6">
                    Application and its photo were deleted.
                </Alert>
            )}

            <form
                role="search"
                className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-3 md:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))] xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))_auto]"
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
                        placeholder="Name, ref no, email or phone"
                        className={`${inputClass} pl-9`}
                    />
                </label>
                <label>
                    <span className="sr-only">Status</span>
                    <select name="status" defaultValue={f.status} className={selectClass}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All statuses</option>
                    </select>
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
                    <span className="sr-only">From date</span>
                    <input
                        type="date"
                        name="from"
                        defaultValue={f.from}
                        className={inputClass}
                        title="From"
                    />
                </label>
                <label>
                    <span className="sr-only">To date</span>
                    <input
                        type="date"
                        name="to"
                        defaultValue={f.to}
                        className={inputClass}
                        title="To"
                    />
                </label>
                <div className="flex gap-2">
                    <button type="submit" className={buttonClass({ variant: "secondary" })}>
                        Apply
                    </button>
                    {filtered && (
                        <Link
                            href="/admin/admissions"
                            className={buttonClass({ variant: "ghost" })}
                        >
                            Clear
                        </Link>
                    )}
                </div>
            </form>

            {result.total === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title={filtered ? "Nothing matches" : "No pending applications"}
                >
                    {filtered
                        ? "Try another status or clear the filters."
                        : "New applications from the admission form will appear here, and you’ll get an email for each one."}
                </EmptyState>
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Applicant</Th>
                                <Th>Class</Th>
                                <Th>WhatsApp</Th>
                                <Th>Score</Th>
                                <Th>Received</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((a) => (
                                <tr key={String(a._id)} className="hover:bg-paper/60">
                                    <Td>
                                        <Link
                                            href={`/admin/admissions/${a._id}`}
                                            className="font-semibold hover:text-burgundy"
                                        >
                                            {a.fullName}
                                        </Link>
                                        <span className="block font-mono text-xs text-muted">
                                            {a.refNo}
                                        </span>
                                    </Td>
                                    <Td>{a.class?.name}</Td>
                                    <Td className="whitespace-nowrap">{formatPhone(a.whatsapp)}</Td>
                                    <Td className="tabular-nums">
                                        {a.scoreVerified ?? a.scoreSubmitted}%
                                        {a.scoreVerified != null && (
                                            <span className="ml-1 text-xs text-success">✓</span>
                                        )}
                                    </Td>
                                    <Td className="whitespace-nowrap text-muted">
                                        {formatDateTime(a.createdAt)}
                                    </Td>
                                    <Td>
                                        <AdmissionStatus
                                            status={a.status}
                                            converted={!!a.student}
                                        />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination
                        page={result.page}
                        pages={result.pages}
                        total={result.total}
                        basePath="/admin/admissions"
                        params={{
                            q,
                            class: f.class,
                            from: f.from,
                            to: f.to,
                            status: f.status === "pending" ? undefined : f.status,
                        }}
                    />
                </>
            )}
        </>
    );
}
