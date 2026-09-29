"use client";

import { useActionState, useRef, useState } from "react";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { cx } from "@/components/ui/cx.js";
import { FEE_LABEL, FeeStatusDialog, feeChipClass } from "./FeeStatus.js";

const fmtPeriod = (p) =>
    new Date(`${p}-01T00:00:00Z`).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });

/** FR-PAY-06 list with row selection + bulk status. */
export function FeeList({ rows, bulkAction, rowAction }) {
    const [selected, setSelected] = useState(() => new Set());
    const [state, formAction, pending] = useActionState(bulkAction, null);
    const dialogRef = useRef(null);
    const [record, setRecord] = useState(null);
    const all = rows.length > 0 && rows.every((r) => selected.has(r.id));
    const toggle = (id) =>
        setSelected((s) => {
            const n = new Set(s);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    return (
        <>
            <form action={formAction}>
                <FormAlert state={state} className="mb-4" />
                {[...selected].map((id) => (
                    <input key={id} type="hidden" name="ids[]" value={id} />
                ))}
                <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="[&>th]:border-b [&>th]:border-line [&>th]:bg-paper-deep/80 [&>th]:px-4 [&>th]:py-2.5 [&>th]:text-[0.7rem] [&>th]:font-bold [&>th]:tracking-[0.12em] [&>th]:text-muted [&>th]:uppercase">
                                <th scope="col" className="w-10">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all on this page"
                                        checked={all}
                                        onChange={() =>
                                            setSelected(
                                                all ? new Set() : new Set(rows.map((r) => r.id)),
                                            )
                                        }
                                        className="size-4 accent-burgundy"
                                    />
                                </th>
                                <th scope="col">Student</th>
                                <th scope="col">Month</th>
                                <th scope="col">Batch · time</th>
                                <th scope="col">Status</th>
                                <th scope="col">Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className={cx(
                                        "border-b border-line/70 hover:bg-paper/60",
                                        selected.has(r.id) && "bg-burgundy-tint/40",
                                        r.inactive && "text-muted",
                                    )}
                                >
                                    <td className="px-4 py-2.5">
                                        <input
                                            type="checkbox"
                                            aria-label={`Select ${r.fullName}, ${r.period}`}
                                            checked={selected.has(r.id)}
                                            onChange={() => toggle(r.id)}
                                            className="size-4 accent-burgundy"
                                        />
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="block font-semibold">{r.fullName}</span>
                                        <span className="font-mono text-xs text-muted">
                                            {r.studentId}
                                        </span>
                                        {r.inactive && <span className="text-xs"> · Inactive</span>}
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        {fmtPeriod(r.period)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {r.batchLabel}
                                        <span className="block text-xs text-muted">{r.time}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            type="button"
                                            className={cx(feeChipClass(r.status), "cursor-pointer")}
                                            aria-label={`${r.fullName}, ${r.period}: ${FEE_LABEL[r.status]}. Change`}
                                            onClick={() => {
                                                setRecord({
                                                    id: r.id,
                                                    title: `${r.fullName} — ${fmtPeriod(r.period)}`,
                                                    status: r.status,
                                                    note: r.note,
                                                });
                                                requestAnimationFrame(() =>
                                                    dialogRef.current?.showModal(),
                                                );
                                            }}
                                        >
                                            {FEE_LABEL[r.status]}
                                        </button>
                                    </td>
                                    <td className="max-w-56 truncate px-4 py-2.5 text-muted">
                                        {r.note}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div
                    className={cx(
                        "sticky bottom-0 mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/95 py-3 backdrop-blur-sm",
                        !selected.size && "hidden",
                    )}
                >
                    <p className="text-sm font-semibold">
                        {selected.size} selected
                        <button
                            type="button"
                            onClick={() => setSelected(new Set())}
                            className="ml-3 font-normal text-muted underline"
                        >
                            Clear
                        </button>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["due", "waived", "paid"].map((s) => (
                            <button
                                key={s}
                                type="submit"
                                name="status"
                                value={s}
                                disabled={pending}
                                className={buttonClass({
                                    variant: s === "paid" ? "primary" : "secondary",
                                    size: "sm",
                                })}
                            >
                                Mark {FEE_LABEL[s].toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </form>
            {/* Outside the bulk <form>: the dialog has its own form (no nested forms). */}
            <FeeStatusDialog action={rowAction} dialogRef={dialogRef} record={record} />
        </>
    );
}
