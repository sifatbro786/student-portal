"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { FormAlert } from "@/components/ui/FormAlert.js";

/** FR-ADM-09 — approve / reject (with an optional note). */
export function ReviewForm({ action, status, note }) {
    const [state, formAction] = useActionState(action, null);
    return (
        <form action={formAction} className="space-y-4">
            <FormAlert state={state} />
            <Textarea
                name="note"
                label="Note (optional)"
                rows={2}
                placeholder="e.g. Called parent, joining Batch B"
                defaultValue={state?.values?.note ?? note ?? ""}
                error={state?.fieldErrors?.note}
            />
            <div className="flex flex-wrap gap-2">
                {status !== "approved" && (
                    <SubmitButton name="status" value="approved" pendingLabel="Saving…">
                        Approve
                    </SubmitButton>
                )}
                {status !== "rejected" && (
                    <SubmitButton
                        name="status"
                        value="rejected"
                        variant="secondary"
                        pendingLabel="Saving…"
                    >
                        Reject
                    </SubmitButton>
                )}
                {status !== "pending" && (
                    <SubmitButton
                        name="status"
                        value="pending"
                        variant="ghost"
                        pendingLabel="Saving…"
                    >
                        Back to pending
                    </SubmitButton>
                )}
            </div>
        </form>
    );
}

/** FR-ADM-03 — the applicant's own score is kept; this stores the checked one. */
export function VerifyScoreForm({ action, submitted, verified }) {
    const [state, formAction] = useActionState(action, null);
    return (
        <form action={formAction} className="space-y-4">
            <FormAlert state={state} />
            <p className="text-sm text-muted">
                Applicant wrote <span className="font-semibold text-ink">{submitted}%</span>
            </p>
            <Field
                name="scoreVerified"
                label="Verified score (%)"
                inputMode="decimal"
                defaultValue={state?.values?.scoreVerified ?? verified ?? ""}
                error={state?.fieldErrors?.scoreVerified}
                required
            />
            <SubmitButton variant="secondary" pendingLabel="Saving…">
                Save verified score
            </SubmitButton>
        </form>
    );
}
