"use client";

import { useActionState } from "react";
import { FormAlert } from "./FormAlert.js";
import { ConfirmSubmit } from "./ConfirmSubmit.js";
import { SubmitButton } from "./SubmitButton.js";

/**
 * Small one-purpose form (delete, deactivate, …) bound to a Server Action.
 * With `confirm`, submission goes through a confirmation dialog.
 */
export function ActionForm({
    action,
    label,
    pendingLabel,
    confirm,
    variant = "secondary",
    danger = false,
    size = "md",
    className,
    children,
}) {
    const [state, formAction] = useActionState(action, null);
    return (
        <form action={formAction} className={className}>
            <FormAlert state={state} className="mb-4" />
            {children}
            {confirm ? (
                <ConfirmSubmit
                    title={confirm.title}
                    body={confirm.body}
                    confirmLabel={confirm.confirmLabel ?? label}
                    variant={variant}
                    danger={danger}
                    size={size}
                >
                    {label}
                </ConfirmSubmit>
            ) : (
                <SubmitButton variant={variant} size={size} pendingLabel={pendingLabel}>
                    {label}
                </SubmitButton>
            )}
        </form>
    );
}
