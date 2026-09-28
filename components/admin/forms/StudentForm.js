"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { Check } from "@/components/ui/Checkbox.js";
import { PasswordField } from "@/components/ui/PasswordField.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { scheduleLabel } from "@/lib/format.js";

function Section({ title, description, children }) {
    return (
        <fieldset className="grid gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0 md:grid-cols-[13rem_minmax(0,1fr)]">
            <legend className="contents">
                <span className="block">
                    <span className="block font-serif text-lg font-medium">{title}</span>
                    {description && (
                        <span className="mt-1 block text-sm leading-relaxed text-muted">
                            {description}
                        </span>
                    )}
                </span>
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

/**
 * mode "create": account + placement + profile. mode "edit": profile only
 * (batch changes and password resets have their own audited forms).
 * `initial` must be plain (see studentFormValues) — no ObjectIds/Dates across the client boundary.
 * @param {{ action: Function, mode: 'create'|'edit', options?: any[], initial?: any }} props
 */
export function StudentForm({ action, mode, options = [], initial }) {
    const [state, formAction] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const v = state?.values ?? initial ?? {};
    // Uncontrolled inputs + mirrored state: React resets the form after each action,
    // and controlled radios/selects would silently lose their DOM value on that reset.
    const [classId, setClassId] = useState(v.class ?? "");
    const [instType, setInstType] = useState(v.institutionType ?? "");
    const [seen, setSeen] = useState(state);
    if (state !== seen) {
        setSeen(state);
        if (state?.values) {
            setClassId(state.values.class ?? "");
            setInstType(state.values.institutionType ?? "");
        }
    }
    const batches = options.find((c) => c.id === classId)?.batches ?? [];

    return (
        <form action={formAction} className="space-y-8" noValidate>
            <FormAlert state={state} />

            {mode === "create" && (
                <>
                    <Section
                        title="Placement"
                        description="Only active classes and batches are listed."
                    >
                        <Select
                            name="class"
                            label="Class"
                            defaultValue={v.class ?? ""}
                            onChange={(e) => setClassId(e.target.value)}
                            error={fe.class}
                            required
                        >
                            <option value="">Choose a class…</option>
                            {options.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>
                        <Select
                            name="batch"
                            label="Batch"
                            defaultValue={v.batch ?? ""}
                            key={classId}
                            disabled={!classId}
                            error={fe.batch}
                            hint={
                                classId && batches.length === 0
                                    ? "This class has no active batch yet."
                                    : undefined
                            }
                            required
                        >
                            <option value="">
                                {classId ? "Choose a batch…" : "Pick a class first"}
                            </option>
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    Batch {b.name} — {scheduleLabel(b.schedule)}
                                </option>
                            ))}
                        </Select>
                    </Section>

                    <Section
                        title="Login"
                        description="The student signs in with this email. Share the temporary password in person — they must change it on first sign-in."
                    >
                        <Field
                            name="email"
                            label="Email"
                            type="email"
                            autoComplete="off"
                            defaultValue={v.email}
                            error={fe.email}
                            required
                        />
                        <PasswordField
                            name="password"
                            label="Temporary password"
                            autoComplete="new-password"
                            withGenerator
                            hint="At least 8 characters."
                            error={fe.password}
                            required
                        />
                    </Section>
                </>
            )}

            <Section title="Student">
                <Field
                    name="fullName"
                    label="Full name"
                    autoComplete="off"
                    defaultValue={v.fullName}
                    error={fe.fullName}
                    required
                    className="sm:col-span-2"
                />
                {mode === "edit" && (
                    <Field
                        name="email"
                        label="Email (login)"
                        type="email"
                        defaultValue={v.email}
                        error={fe.email}
                        required
                    />
                )}
                <Field
                    name="whatsapp"
                    label="WhatsApp number"
                    type="tel"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    defaultValue={v.whatsapp}
                    error={fe.whatsapp}
                    required
                />
                <fieldset className="sm:col-span-2">
                    <legend className="text-sm font-semibold text-ink">Studies at</legend>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                        <Check
                            type="radio"
                            name="institutionType"
                            value="school"
                            label="A school"
                            defaultChecked={(v.institutionType ?? "") === "school"}
                            onChange={() => setInstType("school")}
                        />
                        <Check
                            type="radio"
                            name="institutionType"
                            value="private"
                            label="Private candidate"
                            defaultChecked={(v.institutionType ?? "") === "private"}
                            onChange={() => setInstType("private")}
                        />
                        <Check
                            type="radio"
                            name="institutionType"
                            value=""
                            label="Not specified"
                            defaultChecked={(v.institutionType ?? "") === ""}
                            onChange={() => setInstType("")}
                        />
                    </div>
                </fieldset>
                {instType === "school" && (
                    <Field
                        name="institutionName"
                        label="School name"
                        defaultValue={v.institutionName}
                        error={fe.institutionName}
                        required
                        className="sm:col-span-2"
                    />
                )}
            </Section>

            <Section
                title="Guardians"
                description="Optional, but helpful when you need to reach a parent."
            >
                <Field
                    name="fatherName"
                    label="Father’s name"
                    defaultValue={v.fatherName}
                    error={fe.fatherName}
                />
                <Field
                    name="fatherPhone"
                    label="Father’s phone"
                    type="tel"
                    inputMode="tel"
                    defaultValue={v.fatherPhone}
                    error={fe.fatherPhone}
                />
                <Field
                    name="motherName"
                    label="Mother’s name"
                    defaultValue={v.motherName}
                    error={fe.motherName}
                />
                <Field
                    name="motherPhone"
                    label="Mother’s phone"
                    type="tel"
                    inputMode="tel"
                    defaultValue={v.motherPhone}
                    error={fe.motherPhone}
                />
                <Textarea
                    name="address"
                    label="Address"
                    rows={2}
                    defaultValue={v.address}
                    error={fe.address}
                    className="sm:col-span-2"
                />
            </Section>

            <div className="flex justify-end border-t border-line pt-6">
                <SubmitButton size="lg" pendingLabel="Saving…">
                    {mode === "create" ? "Create student" : "Save profile"}
                </SubmitButton>
            </div>
        </form>
    );
}
