"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { Check } from "@/components/ui/Checkbox.js";
import { FieldError } from "@/components/ui/Field.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/constants.js";

/** Create (no `initial`) or edit a batch. `initial` is a flat batch: { name, days, startTime, … }. */
export function BatchForm({ action, initial, submitLabel = "Save batch" }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const isCreate = !initial;
    const fresh = isCreate && state?.ok;
    const v = fresh ? {} : (state?.values ?? initial ?? {});
    const days = v.days ?? [];
    return (
        <form action={formAction} key={fresh ? state.message : undefined} className="space-y-5">
            <FormAlert state={state} />
            <div className="grid gap-5 sm:grid-cols-3">
                <Field
                    name="name"
                    label="Batch name"
                    placeholder="A"
                    defaultValue={v.name}
                    error={fe.name}
                    required
                    className="sm:col-span-1"
                />
                <Field
                    name="startTime"
                    label="Starts"
                    type="time"
                    defaultValue={v.startTime}
                    error={fe.startTime}
                    required
                />
                <Field
                    name="endTime"
                    label="Ends"
                    type="time"
                    defaultValue={v.endTime}
                    error={fe.endTime}
                    required
                />
            </div>

            <fieldset aria-describedby={fe.days ? "f-days-error" : undefined}>
                <legend className="text-sm font-semibold text-ink">Class days</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => (
                        <label key={d} className="cursor-pointer">
                            <input
                                type="checkbox"
                                name="days[]"
                                value={d}
                                defaultChecked={days.includes(d)}
                                className="peer sr-only"
                            />
                            <span className="inline-flex h-10 min-w-12 items-center justify-center rounded-md border border-line-strong bg-surface px-3 text-sm font-semibold text-muted transition-colors peer-checked:border-burgundy peer-checked:bg-burgundy peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-burgundy hover:border-muted">
                                {WEEKDAY_LABELS[d]}
                            </span>
                        </label>
                    ))}
                </div>
                <FieldError id="f-days-error" message={fe.days} />
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field name="room" label="Room (optional)" defaultValue={v.room} error={fe.room} />
                <Textarea
                    name="notes"
                    label="Notes (optional)"
                    rows={2}
                    defaultValue={v.notes}
                    error={fe.notes}
                />
            </div>
            <Check
                name="isActive"
                label="Active"
                hint="New students can only join active batches."
                defaultChecked={
                    state?.values ? state.values.isActive === "on" : (initial?.isActive ?? true)
                }
            />
            <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
        </form>
    );
}
