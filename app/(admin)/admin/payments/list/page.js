import { Download, Search } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listFeeRecords } from "@/server/services/payments.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { listQuery } from "@/server/validators/common.js";
import { feeListQuery } from "@/server/validators/payments.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { selectClass } from "@/components/ui/Select.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { PaymentsNav } from "@/components/admin/PaymentsNav.js";
import { FeeList } from "@/components/admin/FeeList.js";
import { periodOf } from "@/lib/date.js";
import { bulkFeeStatusAction, setFeeStatusAction } from "../actions.js";

export const metadata = { title: "Payments list" };

export default async function PaymentsListPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const { page } = listQuery.parse(sp);
    const f = feeListQuery.parse(sp);
    // Default view: this month's dues (FR-PAY-09 link lands here).
    const period = "period" in sp ? f.period : periodOf();
    const status = "status" in sp ? f.status : "due";
    const [result, options] = await Promise.all([
        listFeeRecords({
            period,
            status,
            classId: f.class,
            batchId: f.batch,
            q: f.q,
            page,
            pageSize: 50,
        }),
        classBatchOptions({ includeInactive: true }),
    ]);
    // "all" (not "") so pagination keeps an explicit "every month" choice
    const params = { period: period ?? "all", status, class: f.class, batch: f.batch, q: f.q };
    const exportQs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    );

    return (
        <>
            <PageHeader
                eyebrow="Office"
                title="Payments"
                description="Filter, tick rows and mark them in one go. Every change is logged."
                actions={
                    <a
                        href={`/api/admin/payments/export?${exportQs}`}
                        className={buttonClass({ variant: "secondary" })}
                    >
                        <Download aria-hidden="true" className="size-4" /> Export CSV
                    </a>
                }
            />
            <PaymentsNav current="/admin/payments/list" />

            <form
                role="search"
                className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-3 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]"
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
                        defaultValue={f.q}
                        placeholder="Name or student ID"
                        className={`${inputClass} pl-9`}
                    />
                </label>
                <label>
                    <span className="sr-only">Month</span>
                    <input
                        name="period"
                        type="month"
                        defaultValue={period ?? ""}
                        className={inputClass}
                    />
                </label>
                <label>
                    <span className="sr-only">Status</span>
                    <select name="status" defaultValue={status} className={selectClass}>
                        <option value="all">Any status</option>
                        <option value="due">Due</option>
                        <option value="paid">Paid</option>
                        <option value="waived">Waived</option>
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
                <button type="submit" className={buttonClass({ variant: "secondary" })}>
                    Filter
                </button>
            </form>

            {result.total === 0 ? (
                <p className="rounded-lg border border-dashed border-line-strong p-6 text-sm text-muted">
                    Nothing matches these filters.
                </p>
            ) : (
                <>
                    <FeeList
                        key={`${page}-${exportQs}`}
                        rows={result.rows}
                        bulkAction={bulkFeeStatusAction}
                        rowAction={setFeeStatusAction}
                    />
                    <Pagination
                        page={result.page}
                        pages={result.pages}
                        total={result.total}
                        basePath="/admin/payments/list"
                        params={params}
                    />
                </>
            )}
        </>
    );
}
