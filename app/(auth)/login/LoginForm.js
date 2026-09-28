"use client";

import { useActionState } from "react";
import { loginAction } from "../actions.js";
import { Field } from "@/components/ui/Field.js";
import { PasswordField } from "@/components/ui/PasswordField.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { Alert } from "@/components/ui/Alert.js";

export function LoginForm() {
    const [state, formAction] = useActionState(loginAction, null);
    return (
        <form action={formAction} className="mt-8 space-y-5" noValidate>
            {state?.error && <Alert tone="error">{state.error}</Alert>}
            <Field
                name="email"
                label="Email"
                type="email"
                autoComplete="username"
                inputMode="email"
                required
                defaultValue={state?.email ?? ""}
                key={state?.email ?? "email"}
            />
            <PasswordField name="password" label="Password" required />
            <SubmitButton size="lg" className="w-full" pendingLabel="Signing in…">
                Sign in
            </SubmitButton>
        </form>
    );
}
