"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { FieldError } from "@/components/ui/Field.js";

/** FR-RES-03: upload `studentId,marks,grade,remark`; shows the row-level report. */
export function CsvImport({ action }) {
    const [state, formAction] = useActionState(action, null);
    const report = state?.report ?? [];
    return (
        <form action={formAction} className="space-y-4">
            <FormAlert state={state} />
            <p className="text-sm leading-relaxed text-muted">
                One row per student:{" "}
                <code className="font-mono text-ink">studentId,marks,grade,remark</code> (header
                optional, grade and remark optional). If any row is wrong, nothing is saved and the
                report shows why.
            </p>
            <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                aria-describedby={state?.fieldErrors?.file ? "f-csv-error" : undefined}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:font-semibold file:text-ink hover:file:border-ink"
            />
            <FieldError id="f-csv-error" message={state?.fieldErrors?.file} />
            <SubmitButton variant="secondary" pendingLabel="Checking…">
                Import CSV
            </SubmitButton>
            {report.length > 0 && (
                <div className="max-h-72 overflow-auto rounded-md border border-line">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-paper-deep">
                            <tr className="[&>th]:px-3 [&>th]:py-2">
                                <th scope="col">Line</th>
                                <th scope="col">Student ID</th>
                                <th scope="col">Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.map((r) => (
                                <tr
                                    key={r.line}
                                    className="border-t border-line/70 [&>td]:px-3 [&>td]:py-1.5"
                                >
                                    <td className="tabular-nums">{r.line}</td>
                                    <td className="font-mono">{r.studentId || "—"}</td>
                                    <td
                                        className={
                                            r.ok ? "text-success" : "font-medium text-danger"
                                        }
                                    >
                                        {r.ok ? "✓ " : "✕ "}
                                        {r.message}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </form>
    );
}
