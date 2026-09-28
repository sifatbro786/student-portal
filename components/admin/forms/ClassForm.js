"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field.js";
import { Check } from "@/components/ui/Checkbox.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { FormAlert } from "@/components/ui/FormAlert.js";

/** Create (no `initial`) or edit a class. */
export function ClassForm({ action, initial, submitLabel = "Save class" }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const v = state?.values ?? initial ?? {};
    const isCreate = !initial;
    return (
        <form
            action={formAction}
            key={state?.ok && isCreate ? state.message : undefined} // reset after a successful create
            className="space-y-5"
        >
            <FormAlert state={state} />
            <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
                <Field
                    name="name"
                    label="Class name"
                    placeholder="e.g. Class 9, O Level Y1"
                    defaultValue={isCreate && state?.ok ? "" : v.name}
                    error={fe.name}
                    required
                />
                <Field
                    name="order"
                    label="Order"
                    type="number"
                    min={0}
                    max={999}
                    hint="Lower shows first"
                    defaultValue={isCreate && state?.ok ? 0 : (v.order ?? 0)}
                    error={fe.order}
                />
            </div>
            <Check
                name="isActive"
                label="Active"
                hint="Inactive classes are hidden from forms but keep their history."
                defaultChecked={
                    state?.values ? state.values.isActive === "on" : (initial?.isActive ?? true)
                }
            />
            <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
        </form>
    );
}
