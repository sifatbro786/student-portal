"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { GRADES } from "@/lib/constants.js";

/** FR-HON-02 heading + subheading for one year. */
export function HonorYearForm({ action, year, heading, subheading }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    return (
        <form action={formAction} className="space-y-4">
            <FormAlert state={state} />
            <input type="hidden" name="year" value={year} />
            <Field name="heading" label="Heading" defaultValue={heading} error={fe.heading} />
            <Field
                name="subheading"
                label="Subheading"
                defaultValue={subheading}
                hint={`Empty = “Top Achievers : ${year}”`}
                error={fe.subheading}
            />
            <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
                Save heading
            </SubmitButton>
        </form>
    );
}

/** FR-HON-03 shortcut: copy a student's name/school/photo onto a new entry. */
export function HonorFromStudentForm({ action, year }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const v = state?.values ?? {};
    return (
        <form action={formAction} className="space-y-4">
            <FormAlert state={state} />
            <input type="hidden" name="year" value={year} />
            <Field
                name="studentId"
                label="Student ID"
                placeholder="TM-2026-0014"
                defaultValue={v.studentId}
                error={fe.studentId}
                autoCapitalize="characters"
            />
            <div className="grid grid-cols-2 gap-3">
                <Select name="grade" label="Grade" defaultValue={v.grade ?? "A*"} error={fe.grade}>
                    {GRADES.map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </Select>
                <Field
                    name="percentage"
                    label="%"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={v.percentage}
                    error={fe.percentage}
                />
            </div>
            <SubmitButton variant="secondary" size="sm" pendingLabel="Adding…">
                Add from student
            </SubmitButton>
        </form>
    );
}
