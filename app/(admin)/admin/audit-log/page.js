import Link from "next/link";
import { z } from "zod";
import { requireAuth } from "@/server/auth/guards.js";
import { AUDIT_GROUPS, listAuditActors, listAuditLog } from "@/server/services/audit-log.js";
import { fromDhakaDate } from "@/server/validators/results.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { selectClass } from "@/components/ui/Select.js";
import { inputClass } from "@/components/ui/Field.js";
import { buttonClass } from "@/components/ui/Button.js";
import { formatDateTime } from "@/lib/date.js";
import { ROLE_LABELS } from "@/lib/constants.js";

export const metadata = { title: "Audit log" };

// URL filters are untrusted: anything invalid is simply ignored.
const querySchema = z.object({
    group: z.enum(Object.keys(AUDIT_GROUPS)).optional().catch(undefined),
    actor: z
        .string()
        .regex(/^[a-f0-9]{24}$/)
        .optional()
        .catch(undefined),
    from: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .catch(undefined),
    to: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .catch(undefined),
    page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});

/** "student.batch_change" → { area: "Student", verb: "batch change" } */
function describe(action) {
    const [area, ...rest] = action.split(".");
    return {
        area: area.charAt(0).toUpperCase() + area.slice(1),
        verb: rest.join(".").replace(/_/g, " "),
    };
}
const nextDay = (d) => (d ? new Date(d.getTime() + 24 * 60 * 60 * 1000) : null);

export default async function AuditLogPage({ searchParams }) {
    await requireAuth(["super_admin"]); // admins get a 404 (SEC-10)
    const q = querySchema.parse(await searchParams);
    const [data, actors] = await Promise.all([
        listAuditLog({
            group: q.group,
            actor: q.actor,
            from: fromDhakaDate(q.from),
            to: nextDay(fromDhakaDate(q.to)),
            page: q.page ?? 1,
        }),
        listAuditActors(),
    ]);
    const filtered = !!(q.group || q.actor || q.from || q.to);

    return (
        <>
            <PageHeader
                eyebrow="Settings"
                title="Audit log"
                description="Who changed what, and when. Read-only; entries are kept for 12 months. Only super admins see this page."
            />
            <form
                method="get"
                className="mb-6 grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]"
            >
                <label className="space-y-1 text-sm font-semibold">
                    <span>Area</span>
                    <select name="group" defaultValue={q.group ?? ""} className={selectClass}>
                        <option value="">Everything</option>
                        {Object.entries(AUDIT_GROUPS).map(([k, g]) => (
                            <option key={k} value={k}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="space-y-1 text-sm font-semibold">
                    <span>Done by</span>
                    <select name="actor" defaultValue={q.actor ?? ""} className={selectClass}>
                        <option value="">Anyone</option>
                        {actors.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="space-y-1 text-sm font-semibold">
                    <span>From</span>
                    <input
                        type="date"
                        name="from"
                        defaultValue={q.from ?? ""}
                        className={inputClass}
                    />
                </label>
                <label className="space-y-1 text-sm font-semibold">
                    <span>To</span>
                    <input type="date" name="to" defaultValue={q.to ?? ""} className={inputClass} />
                </label>
                <div className="flex items-end gap-2">
                    <button
                        type="submit"
                        className={buttonClass({ className: "w-full lg:w-auto" })}
                    >
                        Filter
                    </button>
                    {filtered && (
                        <Link href="/admin/audit-log" className={buttonClass({ variant: "ghost" })}>
                            Clear
                        </Link>
                    )}
                </div>
            </form>

            {data.rows.length === 0 ? (
                <EmptyState title={filtered ? "Nothing matches these filters" : "No activity yet"}>
                    {filtered
                        ? "Try a wider date range or another area."
                        : "Sign-ins, student changes, payments and other admin actions will appear here."}
                </EmptyState>
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>When</Th>
                                <Th>Who</Th>
                                <Th>What</Th>
                                <Th>On</Th>
                                <Th>Details</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.map((r) => {
                                const d = describe(r.action);
                                const failed = /failed/.test(r.action);
                                return (
                                    <tr key={r.id} className="hover:bg-paper/60">
                                        <Td className="whitespace-nowrap text-muted tabular-nums">
                                            {formatDateTime(r.at)}
                                        </Td>
                                        <Td>
                                            <span className="font-semibold">{r.actorName}</span>
                                            {r.actorRole && (
                                                <span className="block text-xs text-muted">
                                                    {ROLE_LABELS[r.actorRole] ?? r.actorRole}
                                                </span>
                                            )}
                                        </Td>
                                        <Td>
                                            <StatusChip tone={failed ? "danger" : "neutral"}>
                                                {d.area}
                                            </StatusChip>{" "}
                                            <span className="text-ink/85">{d.verb}</span>
                                        </Td>
                                        <Td className="text-muted">
                                            {r.targetLabel ? (
                                                <>
                                                    <span className="text-xs uppercase">
                                                        {r.targetType}
                                                    </span>{" "}
                                                    <span className="font-mono text-xs text-ink">
                                                        {r.targetLabel}
                                                    </span>
                                                </>
                                            ) : (
                                                "—"
                                            )}
                                        </Td>
                                        <Td className="max-w-xs text-xs break-words text-muted">
                                            {r.meta || "—"}
                                        </Td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    <Pagination
                        page={data.page}
                        pages={data.pages}
                        total={data.total}
                        basePath="/admin/audit-log"
                        params={{ group: q.group, actor: q.actor, from: q.from, to: q.to }}
                    />
                </>
            )}
        </>
    );
}
