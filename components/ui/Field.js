import { cx } from "./cx.js";

export const inputClass =
    "block h-11 w-full rounded-md border border-line-strong bg-surface px-3.5 text-[0.95rem] text-ink placeholder:text-muted/70 transition-colors duration-200 hover:border-muted focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20 aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

/**
 * Label + control + hint + error with correct aria wiring.
 * `children` (optional) replaces the default <input> — it receives nothing,
 * so pass `id={`f-${name}`}` and `aria-describedby` yourself when using it.
 */
export function Field({ name, label, hint, error, className, children, ...inputProps }) {
    const id = `f-${name}`;
    const describedBy =
        [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    return (
        <div className={cx("space-y-1.5", className)}>
            <label htmlFor={id} className="block text-sm font-semibold text-ink">
                {label}
            </label>
            {children ?? (
                <input
                    id={id}
                    name={name}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={inputClass}
                    {...inputProps}
                />
            )}
            {hint && !error && (
                <p id={`${id}-hint`} className="text-xs text-muted">
                    {hint}
                </p>
            )}
            <FieldError id={`${id}-error`} message={error} />
        </div>
    );
}

export function FieldError({ id, message }) {
    if (!message) return null;
    return (
        <p id={id} className="flex items-start gap-1.5 text-xs font-medium text-danger">
            <span aria-hidden="true">✕</span>
            {message}
        </p>
    );
}
