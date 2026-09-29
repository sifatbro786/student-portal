import { Wallet } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { getPaymentMatrix } from "@/server/services/payments.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { matrixQuery } from "@/server/validators/payments.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { buttonClass } from "@/components/ui/Button.js";
import { selectClass } from "@/components/ui/Select.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { PaymentsNav } from "@/components/admin/PaymentsNav.js";
import { PaymentMatrix } from "@/components/admin/PaymentMatrix.js";
import { dhakaYear, periodOf } from "@/lib/date.js";
import { generateFeesAction, setFeeStatusAction } from "./actions.js";

export const metadata = { title: "Payments" };

export default async function PaymentsMatrixPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const f = matrixQuery.parse(await searchParams);
    const year = f.year ?? dhakaYear();
    const [matrix, options] = await Promise.all([
        getPaymentMatrix({ year, classId: f.class, batchId: f.batch }),
        classBatchOptions({ includeInactive: true }),
    ]);
    const years = Array.from({ length: 4 }, (_, i) => dhakaYear() + 1 - i);

    return (
        <>
            <PageHeader
                eyebrow="Office"
                title="Payments"
                description="Paid / due per student per month — no amounts. Students never see this."
                actions={
                    <ActionForm
                        action={generateFeesAction}
                        label="Create this month’s records"
                        pendingLabel="Creating…"
                    />
                }
            />
            <PaymentsNav current="/admin/payments" />

            <form className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
                <label>
                    <span className="sr-only">Year</span>
                    <select name="year" defaultValue={year} className={selectClass}>
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
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
                    Show
                </button>
            </form>

            {matrix.rows.length === 0 ? (
                <EmptyState icon={Wallet} title={`No records for ${year}`}>
                    Records are created automatically at 00:05 on the 1st of every month for all
                    active students (and right away when a student is added or reactivated).
                </EmptyState>
            ) : (
                <>
                    <p className="mb-3 text-sm text-muted">
                        Click a cell to change it. Columns and rows use the batch the student was in{" "}
                        <em>that month</em>. Greyed rows are inactive students.
                    </p>
                    <PaymentMatrix
                        action={setFeeStatusAction}
                        months={matrix.months}
                        rows={matrix.rows}
                        dueByMonth={matrix.dueByMonth}
                        totalDue={matrix.totalDue}
                        currentPeriod={periodOf()}
                    />
                </>
            )}
        </>
    );
}
