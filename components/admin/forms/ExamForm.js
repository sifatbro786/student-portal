"use client";

import { useActionState, useState } from "react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { Check } from "@/components/ui/Checkbox.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";

/**
 * FR-RES-01. `options` = classBatchOptions(); `initial` plain values (edit).
 * Uncontrolled inputs; the class <select> is mirrored in state only to show its batches.
 */
export function ExamForm({ action, options, initial }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const v = state?.values ?? initial ?? { isPublished: false };
    const [classId, setClassId] = useState(v.class ?? options[0]?.id ?? "");
    const cls = options.find((c) => c.id === classId);
    const picked = new Set(v.batches ?? []);

    return (
        <form action={formAction} noValidate className="space-y-6">
            <FormAlert state={state} />
            <Field
                name="title"
                label="Title"
                placeholder="e.g. Mock Test 3 — Paper 1"
                defaultValue={v.title}
                error={fe.title}
                required
            />
            <div className="grid gap-5 sm:grid-cols-3">
                <Select
                    name="class"
                    label="Class"
                    defaultValue={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    error={fe.class}
                >
                    {options.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select>
                <Field
                    name="date"
                    label="Exam date"
                    type="date"
                    defaultValue={v.date}
                    error={fe.date}
                    required
                />
                <Field
                    name="fullMarks"
                    label="Full marks"
                    type="number"
                    min={1}
                    max={1000}
                    inputMode="numeric"
                    defaultValue={v.fullMarks ?? 100}
                    error={fe.fullMarks}
                    required
                />
            </div>
            <fieldset>
                <legend className="text-sm font-semibold">Batches that sat the exam</legend>
                <div
                    key={classId} // new class → its batches, all ticked
                    className="mt-2 flex flex-wrap gap-x-6 gap-y-2 rounded-md border border-line bg-paper/60 p-4"
                >
                    {cls?.batches.length ? (
                        cls.batches.map((b) => (
                            <Check
                                key={b.id}
                                name="batches[]"
                                value={b.id}
                                label={`Batch ${b.name}`}
                                defaultChecked={
                                    v.batches && classId === v.class ? picked.has(b.id) : true
                                }
                            />
                        ))
                    ) : (
                        <span className="text-sm text-muted">This class has no batches yet.</span>
                    )}
                </div>
                <FieldError id="f-batches-error" message={fe.batches} />
            </fieldset>
            <Check
                name="isPublished"
                label="Published — students can see their own results"
                hint="Keep it off while you enter marks. Students never see other students’ results."
                defaultChecked={state?.values ? state.values.isPublished === "on" : v.isPublished}
            />
            <div className="flex justify-end border-t border-line pt-5">
                <SubmitButton size="lg" pendingLabel="Saving…">
                    {initial ? "Save exam" : "Create exam"}
                </SubmitButton>
            </div>
        </form>
    );
}
