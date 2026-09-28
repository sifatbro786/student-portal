"use client";

import { useActionState, useState } from "react";
import { Select } from "@/components/ui/Select.js";
import { Field } from "@/components/ui/Field.js";
import { Check } from "@/components/ui/Checkbox.js";
import { PasswordField } from "@/components/ui/PasswordField.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { scheduleLabel } from "@/lib/format.js";

/** FR-STU-04 — move to a batch in the same or another class. */
export function ChangeBatchForm({ action, options, currentClassId, currentBatchId }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const [classId, setClassId] = useState(currentClassId);
    const [seen, setSeen] = useState(state);
    if (state !== seen) {
        setSeen(state);
        setClassId(state?.values?.class ?? currentClassId); // form reset → back to these
    }
    const batches = options.find((c) => c.id === classId)?.batches ?? [];
    return (
        <form action={formAction} className="space-y-4">
            <FormAlert state={state} />
            <Select
                name="class"
                label="Class"
                defaultValue={state?.values?.class ?? currentClassId}
                onChange={(e) => setClassId(e.target.value)}
                error={fe.class}
            >
                {options.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </Select>
            <Select
                name="batch"
                label="New batch"
                key={classId}
                defaultValue=""
                error={fe.batch}
                required
            >
                <option value="">Choose a batch…</option>
                {batches.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === currentBatchId}>
                        Batch {b.name} — {scheduleLabel(b.schedule)}
                        {b.id === currentBatchId ? " (current)" : ""}
                    </option>
                ))}
            </Select>
            <Field
                name="reason"
                label="Reason (optional)"
                placeholder="e.g. Time clash with school"
                error={fe.reason}
            />
            <SubmitButton variant="secondary" pendingLabel="Moving…">
                Change batch
            </SubmitButton>
        </form>
    );
}

/** FR-AUTH-06 — set a temporary password; the student must change it. */
export function ResetPasswordForm({ action, who = "The student" }) {
    const [state, formAction] = useActionState(action, null);
    return (
        <form action={formAction} className="space-y-4" key={state?.ok ? "done" : "form"}>
            <FormAlert state={state} />
            <PasswordField
                name="password"
                label="New temporary password"
                autoComplete="new-password"
                withGenerator
                hint={`${who} will be signed out everywhere and asked to choose a new one.`}
                error={state?.fieldErrors?.password}
                required
            />
            <ConfirmSubmit
                title="Reset this password?"
                body="All their sessions end immediately. Remember to share the new temporary password in person."
                confirmLabel="Reset password"
            >
                Reset password
            </ConfirmSubmit>
        </form>
    );
}

/** FR-STU-06/07 — permanent delete, confirmed by typing the student ID. */
export function PurgeStudentForm({ action, studentId, honorCount }) {
    const [state, formAction] = useActionState(action, null);
    const [typed, setTyped] = useState("");
    return (
        <form action={formAction} className="space-y-4">
            <FormAlert state={state} />
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Removes the account, profile, submissions, results and payment history.</li>
                <li>Deletes their uploaded files. This cannot be undone.</li>
            </ul>
            {honorCount > 0 && (
                <fieldset className="rounded-md border border-line bg-paper/60 p-4">
                    <legend className="px-1 text-sm font-semibold">
                        On the Honor Board ({honorCount} {honorCount === 1 ? "entry" : "entries"})
                    </legend>
                    <div className="mt-1 space-y-2">
                        <Check
                            type="radio"
                            name="honorAction"
                            value="keep"
                            defaultChecked
                            label="Keep the Honor Board entry"
                            hint="It keeps its own name and photo."
                        />
                        <Check
                            type="radio"
                            name="honorAction"
                            value="delete"
                            label="Delete the Honor Board entry too"
                        />
                    </div>
                </fieldset>
            )}
            <Field
                name="confirmStudentId"
                label={`Type ${studentId} to confirm`}
                autoComplete="off"
                spellCheck={false}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                error={state?.fieldErrors?.confirmStudentId}
            />
            <ConfirmSubmit
                title="Permanently delete this student?"
                body={`All data for ${studentId} will be erased. There is no undo.`}
                confirmLabel="Delete permanently"
                danger
                variant="secondary"
                className={
                    typed.trim().toUpperCase() === studentId
                        ? "border-danger text-danger"
                        : "pointer-events-none opacity-50"
                }
            >
                Delete permanently
            </ConfirmSubmit>
        </form>
    );
}
