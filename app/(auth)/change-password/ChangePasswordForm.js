"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../actions.js";
import { PasswordField } from "@/components/ui/PasswordField.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { Alert } from "@/components/ui/Alert.js";

export function ChangePasswordForm() {
    const [state, formAction] = useActionState(changePasswordAction, null);
    const fe = state?.fieldErrors ?? {};
    return (
        <form action={formAction} className="mt-6 space-y-5" noValidate>
            {state?.error && <Alert tone="error">{state.error}</Alert>}
            <PasswordField
                name="currentPassword"
                label="Current password"
                error={fe.currentPassword}
                required
            />
            <PasswordField
                name="newPassword"
                label="New password"
                autoComplete="new-password"
                hint="At least 8 characters. A short sentence is easier to remember."
                error={fe.newPassword}
                minLength={8}
                required
            />
            <PasswordField
                name="confirmPassword"
                label="Confirm new password"
                autoComplete="new-password"
                error={fe.confirmPassword}
                required
            />
            <SubmitButton size="lg" className="w-full" pendingLabel="Saving…">
                Save password
            </SubmitButton>
        </form>
    );
}
