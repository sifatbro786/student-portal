"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { cx } from "@/components/ui/cx.js";

export const FEE_LABEL = { paid: "Paid", due: "Due", waived: "Waived" };

/** Status chip used in the matrix and the list. Text always present (not colour alone). */
export function feeChipClass(status) {
    return cx(
        "inline-flex h-7 min-w-14 items-center justify-center rounded-full border px-2 text-[0.72rem] font-bold",
        status === "paid" && "border-success/40 bg-success-tint text-success",
        status === "due" && "border-danger/45 bg-surface text-danger",
        status === "waived" && "border-line-strong bg-paper-deep text-muted",
    );
}

/**
 * FR-PAY-05 "click → confirm popover → toggle": one native <dialog> per page,
 * opened for the chosen record via `openFor(record)`.
 * `action` = setFeeStatusAction(id, prev, formData); bound to the record here.
 * @param {{ action: Function, dialogRef: any, record: null | { id: string,
 *   title: string, status: string, note: string } }} props
 */
export function FeeStatusDialog({ action, dialogRef, record }) {
    return (
        <dialog
            ref={dialogRef}
            aria-label="Change payment status"
            className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-left text-ink shadow-[0_30px_80px_-30px_rgb(31_26_23/0.5)] backdrop:bg-ink/40"
        >
            {record && (
                <DialogForm
                    key={`${record.id}-${record.status}`}
                    action={action.bind(null, record.id)}
                    record={record}
                    close={() => dialogRef.current?.close()}
                />
            )}
        </dialog>
    );
}

function DialogForm({ action, record, close }) {
    const [state, formAction] = useActionState(action, null);
    const uid = useId();
    const closed = useRef(false);
    useEffect(() => {
        if (state?.ok && !closed.current) {
            closed.current = true;
            close();
        }
    }, [state, close]);
    return (
        <form action={formAction}>
            <div className="space-y-4 p-6">
                <div>
                    <p className="eyebrow text-gold-deep">Payment status</p>
                    <h2 className="mt-1 text-xl font-medium">{record.title}</h2>
                    <p className="mt-1 text-sm text-muted">
                        Now:{" "}
                        <span className={feeChipClass(record.status)}>
                            {FEE_LABEL[record.status]}
                        </span>
                    </p>
                </div>
                <FormAlert state={state?.ok ? null : state} />
                <div className="space-y-1.5">
                    <label htmlFor={`${uid}-note`} className="block text-sm font-semibold">
                        Note <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <input
                        id={`${uid}-note`}
                        name="note"
                        maxLength={300}
                        defaultValue={record.note}
                        placeholder="e.g. paid in cash to office"
                        className={inputClass}
                    />
                </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-paper/60 px-6 py-4">
                <button
                    type="button"
                    className={buttonClass({ variant: "secondary", size: "sm" })}
                    onClick={close}
                >
                    Cancel
                </button>
                {["due", "waived", "paid"]
                    .filter((s) => s !== record.status)
                    .map((s) => (
                        <SubmitButton
                            key={s}
                            name="status"
                            value={s}
                            size="sm"
                            variant={s === "paid" ? "primary" : "secondary"}
                            pendingLabel="Saving…"
                        >
                            Mark {FEE_LABEL[s].toLowerCase()}
                        </SubmitButton>
                    ))}
            </div>
        </form>
    );
}
