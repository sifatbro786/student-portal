"use client";

import { useRef, useState } from "react";
import { cx } from "@/components/ui/cx.js";
import { FEE_LABEL, FeeStatusDialog, feeChipClass } from "./FeeStatus.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * FR-PAY-05 matrix: rows = students, columns = months. Sticky first column + header.
 * @param {{ action: Function, months: string[], rows: any[], dueByMonth: Record<string, number>,
 *   totalDue: number, currentPeriod: string }} props
 */
export function PaymentMatrix({ action, months, rows, dueByMonth, totalDue, currentPeriod }) {
    const dialogRef = useRef(null);
    const [record, setRecord] = useState(null);
    const open = (r, m, cell) => {
        setRecord({
            id: cell.id,
            title: `${r.fullName} — ${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`,
            status: cell.status,
            note: cell.note,
        });
        requestAnimationFrame(() => dialogRef.current?.showModal());
    };

    const stickyCol = "sticky left-0 z-[1] bg-surface";
    return (
        <>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-line bg-surface">
                <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
                    <thead>
                        <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-[2] [&>th]:border-b [&>th]:border-line [&>th]:bg-paper-deep [&>th]:px-2 [&>th]:py-2.5 [&>th]:text-[0.7rem] [&>th]:font-bold [&>th]:tracking-[0.1em] [&>th]:text-muted [&>th]:uppercase">
                            <th scope="col" className="left-0 z-[3]! min-w-56 pl-4! text-left">
                                Student
                            </th>
                            {months.map((m, i) => (
                                <th
                                    key={m}
                                    scope="col"
                                    className={cx(
                                        "text-center",
                                        m === currentPeriod && "text-burgundy!",
                                    )}
                                >
                                    {MONTHS[i]}
                                </th>
                            ))}
                            <th scope="col" className="pr-4! text-right">
                                Due
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr
                                key={r.studentObjectId}
                                className={cx("group", r.inactive && "opacity-55")}
                            >
                                <th
                                    scope="row"
                                    className={cx(
                                        stickyCol,
                                        "border-b border-line/70 py-2 pr-3 pl-4 text-left font-normal group-hover:bg-paper",
                                    )}
                                >
                                    <span className="block font-semibold">{r.fullName}</span>
                                    <span className="block text-xs text-muted">
                                        <span className="font-mono">{r.studentId}</span> ·{" "}
                                        {r.batchLabel}
                                        {r.inactive && (
                                            <span className="font-semibold"> · Inactive</span>
                                        )}
                                    </span>
                                    {r.time && (
                                        <span className="block text-[0.7rem] text-muted">
                                            {r.time}
                                        </span>
                                    )}
                                </th>
                                {months.map((m) => {
                                    const c = r.cells[m];
                                    return (
                                        <td
                                            key={m}
                                            className={cx(
                                                "border-b border-line/70 px-1 py-2 text-center group-hover:bg-paper",
                                                m === currentPeriod && "bg-burgundy-tint/30",
                                            )}
                                        >
                                            {c ? (
                                                <button
                                                    type="button"
                                                    onClick={() => open(r, m, c)}
                                                    className={cx(
                                                        feeChipClass(c.status),
                                                        "cursor-pointer hover:ring-2 hover:ring-burgundy/20",
                                                    )}
                                                    aria-label={`${r.fullName}, ${m}: ${FEE_LABEL[c.status]}. Change`}
                                                    title={c.note || undefined}
                                                >
                                                    {FEE_LABEL[c.status]}
                                                </button>
                                            ) : (
                                                <span
                                                    className="text-line-strong"
                                                    aria-label="No record"
                                                >
                                                    ·
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="border-b border-line/70 pr-4 text-right font-semibold tabular-nums group-hover:bg-paper">
                                    {r.due || <span className="text-muted">0</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="[&>td]:sticky [&>td]:bottom-0 [&>td]:border-t [&>td]:border-line [&>td]:bg-paper-deep [&>td]:py-2.5 [&>td]:text-xs [&>td]:font-semibold">
                            <td className="left-0 z-[3]! pl-4 text-left text-muted uppercase">
                                Due per month
                            </td>
                            {months.map((m) => (
                                <td key={m} className="text-center tabular-nums">
                                    {dueByMonth[m] || <span className="text-muted">0</span>}
                                </td>
                            ))}
                            <td className="pr-4 text-right text-danger tabular-nums">{totalDue}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <FeeStatusDialog action={action} dialogRef={dialogRef} record={record} />
        </>
    );
}
