"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field.js";
import { Check } from "@/components/ui/Checkbox.js";
import { PasswordField } from "@/components/ui/PasswordField.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { FormAlert } from "@/components/ui/FormAlert.js";

/** Create (with password) or edit an admin. `initial` must be plain. */
export function AdminForm({ action, initial, lockRole = false }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const isCreate = !initial;
    const fresh = isCreate && state?.ok;
    const v = fresh ? {} : (state?.values ?? initial ?? {});
    const role = v.role ?? "admin";
    return (
        <form action={formAction} key={fresh ? state.message : undefined} className="space-y-5">
            <FormAlert state={state} />
            <Field name="name" label="Full name" defaultValue={v.name} error={fe.name} required />
            <Field
                name="email"
                label="Email (login)"
                type="email"
                autoComplete="off"
                defaultValue={v.email}
                error={fe.email}
                required
            />
            {isCreate && (
                <PasswordField
                    name="password"
                    label="Temporary password"
                    autoComplete="new-password"
                    withGenerator
                    hint="They must change it at first sign-in."
                    error={fe.password}
                    required
                />
            )}
            <fieldset disabled={lockRole}>
                <legend className="text-sm font-semibold text-ink">Role</legend>
                <div className="mt-2 space-y-2.5">
                    <Check
                        type="radio"
                        name="role"
                        value="admin"
                        defaultChecked={role === "admin"}
                        label="Admin"
                        hint="Runs students, batches and content. Cannot manage admins."
                    />
                    <Check
                        type="radio"
                        name="role"
                        value="super_admin"
                        defaultChecked={role === "super_admin"}
                        label="Super admin"
                        hint="Everything, including managing admins."
                    />
                </div>
                {lockRole && (
                    <p className="mt-2 text-xs text-muted">You can’t change your own role.</p>
                )}
                {fe.role && <p className="mt-2 text-xs font-medium text-danger">{fe.role}</p>}
            </fieldset>
            {lockRole && <input type="hidden" name="role" value={role} />}
            <SubmitButton pendingLabel="Saving…">{isCreate ? "Add admin" : "Save"}</SubmitButton>
        </form>
    );
}
