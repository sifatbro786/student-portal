"use client";

import { useActionState } from "react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { Check } from "@/components/ui/Checkbox.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";

/** Caption, alt text, category and visibility of one gallery photo. `initial` is plain. */
export function GalleryEditForm({ action, initial, categories }) {
    const [state, formAction] = useActionState(action, null);
    const v = state?.values
        ? {
              ...state.values,
              isFeatured: state.values.isFeatured === "on",
              consentConfirmed: state.values.consentConfirmed === "on",
              isPublished: state.values.isPublished === "on",
          }
        : initial;
    const fe = state?.fieldErrors ?? {};
    return (
        <form action={formAction} className="space-y-5" noValidate>
            <FormAlert state={state} />
            <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
                <Select
                    name="category"
                    label="Category"
                    defaultValue={v.category}
                    error={fe.category}
                >
                    {categories.map(([k, l]) => (
                        <option key={k} value={k}>
                            {l}
                        </option>
                    ))}
                </Select>
                <Field
                    name="caption"
                    label="Caption"
                    maxLength={160}
                    defaultValue={v.caption}
                    error={fe.caption}
                />
            </div>
            <Field
                name="alt"
                label="Describe the photo (for screen readers & Google)"
                maxLength={200}
                defaultValue={v.alt}
                error={fe.alt}
                hint="e.g. “Class 9 students writing a mock test in the Dhanmondi classroom”. Defaults to the caption."
            />
            <div className="space-y-3 rounded-lg border border-gold/50 bg-gold-light/15 p-4">
                <Check
                    name="consentConfirmed"
                    label="Cleared for public display"
                    hint="If students can be recognised, guardian consent has been obtained."
                    defaultChecked={v.consentConfirmed}
                />
                <FieldError id="f-consentConfirmed-error" message={fe.consentConfirmed} />
                <Check
                    name="isPublished"
                    label="Show in the gallery"
                    defaultChecked={v.isPublished}
                />
                <Check
                    name="isFeatured"
                    label="Also show on the homepage"
                    defaultChecked={v.isFeatured}
                />
            </div>
            <div className="flex justify-end border-t border-line pt-5">
                <SubmitButton size="lg" pendingLabel="Saving…">
                    Save photo
                </SubmitButton>
            </div>
        </form>
    );
}
