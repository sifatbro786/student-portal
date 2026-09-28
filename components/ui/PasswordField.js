"use client";

import { useState } from "react";
import { inputClass, FieldError } from "./Field.js";

export function PasswordField({
    name,
    label,
    hint,
    error,
    autoComplete = "current-password",
    ...props
}) {
    const [visible, setVisible] = useState(false);
    const id = `f-${name}`;
    const describedBy =
        [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-semibold text-ink">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    name={name}
                    type={visible ? "text" : "password"}
                    autoComplete={autoComplete}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={`${inputClass} pr-16`}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-controls={id}
                    aria-pressed={visible}
                    className="absolute inset-y-1 right-1 rounded px-2.5 text-xs font-semibold tracking-wide text-muted hover:bg-paper-deep hover:text-ink"
                >
                    {visible ? "Hide" : "Show"}
                    <span className="sr-only"> password</span>
                </button>
            </div>
            {hint && !error && (
                <p id={`${id}-hint`} className="text-xs text-muted">
                    {hint}
                </p>
            )}
            <FieldError id={`${id}-error`} message={error} />
        </div>
    );
}
