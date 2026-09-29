"use client";

import { startTransition, useActionState, useState } from "react";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { cx } from "@/components/ui/cx.js";
import { GRADES } from "@/lib/constants.js";

const cell =
    "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm tabular-nums focus:border-burgundy focus:ring-2 focus:ring-burgundy/20 focus:outline-none aria-invalid:border-danger";

/**
 * FR-RES-02 result entry. Submitted manually (not <form action>) so React does not
 * reset the grid when some rows come back with errors. Blank marks = no result.
 * @param {{ action: Function, fullMarks: number, rows: Array<{ studentObjectId: string,
 *   studentId: string, fullName: string, batchLabel: string, note: string | null,
 *   marks: number | null, grade: string, remark: string }> }} props
 */
export function ResultGrid({ action, fullMarks, rows }) {
    const [state, formAction, pending] = useActionState(action, null);
    const [marks, setMarks] = useState(() =>
        Object.fromEntries(rows.map((r) => [r.studentObjectId, r.marks ?? ""])),
    );
    const [dirty, setDirty] = useState(false);
    const rowErrors = state?.rowErrors ?? {};
    const filled = Object.values(marks).filter((m) => String(m).trim() !== "").length;

    function onSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
        setDirty(false);
    }

    return (
        <form onSubmit={onSubmit} onInput={() => setDirty(true)} noValidate>
            <FormAlert state={state} className="mb-4" />
            <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                        <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:border-b [&>th]:border-line [&>th]:bg-paper-deep/80 [&>th]:px-3 [&>th]:py-2.5 [&>th]:text-[0.7rem] [&>th]:font-bold [&>th]:tracking-[0.12em] [&>th]:text-muted [&>th]:uppercase">
                            <th scope="col">Student</th>
                            <th scope="col" className="w-32">
                                Marks <span className="normal-case">/ {fullMarks}</span>
                            </th>
                            <th scope="col" className="w-20 text-right">
                                %
                            </th>
                            <th scope="col" className="w-24">
                                Grade
                            </th>
                            <th scope="col">Remark</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const id = r.studentObjectId;
                            const m = String(marks[id] ?? "").trim();
                            const n = Number(m);
                            const pct =
                                m !== "" && Number.isFinite(n) && n >= 0 && n <= fullMarks
                                    ? Math.round((n / fullMarks) * 10000) / 100
                                    : null;
                            const err = rowErrors[id];
                            return (
                                <tr
                                    key={id}
                                    className={cx(
                                        "border-b border-line/70 align-top",
                                        err && "bg-burgundy-tint/50",
                                    )}
                                >
                                    <td className="px-3 py-2">
                                        <input type="hidden" name="student[]" value={id} />
                                        <span className="block font-semibold">{r.fullName}</span>
                                        <span className="block text-xs text-muted">
                                            <span className="font-mono">{r.studentId}</span> ·{" "}
                                            {r.batchLabel}
                                            {r.note && (
                                                <span className="text-gold-deep"> · {r.note}</span>
                                            )}
                                        </span>
                                        {err && (
                                            <span
                                                id={`err-${id}`}
                                                className="mt-1 block text-xs font-medium text-danger"
                                            >
                                                ✕ {err}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            name="marks[]"
                                            type="number"
                                            min={0}
                                            max={fullMarks}
                                            step="0.01"
                                            inputMode="decimal"
                                            aria-label={`Marks for ${r.fullName}`}
                                            aria-invalid={err ? true : undefined}
                                            aria-describedby={err ? `err-${id}` : undefined}
                                            defaultValue={r.marks ?? ""}
                                            onChange={(e) =>
                                                setMarks((s) => ({ ...s, [id]: e.target.value }))
                                            }
                                            className={cell}
                                        />
                                    </td>
                                    <td className="px-3 py-2 pt-4 text-right text-muted tabular-nums">
                                        {pct === null ? "—" : `${pct}%`}
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            name="grade[]"
                                            aria-label={`Grade for ${r.fullName}`}
                                            defaultValue={r.grade}
                                            className={cell}
                                        >
                                            <option value="">—</option>
                                            {GRADES.map((g) => (
                                                <option key={g} value={g}>
                                                    {g}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            name="remark[]"
                                            maxLength={300}
                                            aria-label={`Remark for ${r.fullName}`}
                                            defaultValue={r.remark}
                                            className={cell}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/95 py-3 backdrop-blur-sm">
                <p className="text-sm text-muted">
                    {filled} of {rows.length} filled · empty marks = no result
                    {dirty && (
                        <span className="ml-2 font-semibold text-gold-deep">Unsaved changes</span>
                    )}
                </p>
                <button type="submit" disabled={pending} className={buttonClass()}>
                    {pending ? "Saving…" : "Save all results"}
                </button>
            </div>
        </form>
    );
}
