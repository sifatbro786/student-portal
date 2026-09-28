"use client";

import { useRef, useState } from "react";
import { inputClass, FieldError } from "./Field.js";

export function PasswordField({
    name,
    label,
    hint,
    error,
    autoComplete = "current-password",
    withGenerator = false,
    ...props
}) {
    const [visible, setVisible] = useState(false);
    const inputRef = useRef(null);

    // Readable temporary password (no 0/O/1/l/I). Admin shares it in person.
    function generate() {
        const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        const bytes = crypto.getRandomValues(new Uint32Array(10));
        const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
        inputRef.current.value = `${raw.slice(0, 5)}-${raw.slice(5)}`;
        setVisible(true);
    }
    const id = `f-${name}`;
    const describedBy =
        [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="block text-sm font-semibold text-ink">
                    {label}
                </label>
                {withGenerator && (
                    <button
                        type="button"
                        onClick={generate}
                        className="text-xs font-semibold text-burgundy hover:underline"
                    >
                        Generate
                    </button>
                )}
            </div>
            <div className="relative">
                <input
                    ref={inputRef}
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
