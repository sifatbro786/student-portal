import { cx } from "./cx.js";
import { FieldError } from "./Field.js";

export function Textarea({ name, label, hint, error, className, rows = 3, ...props }) {
    const id = `f-${name}`;
    const describedBy =
        [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    return (
        <div className={cx("space-y-1.5", className)}>
            <label htmlFor={id} className="block text-sm font-semibold text-ink">
                {label}
            </label>
            <textarea
                id={id}
                name={name}
                rows={rows}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className="block w-full rounded-md border border-line-strong bg-surface px-3.5 py-2.5 text-[0.95rem] text-ink transition-colors placeholder:text-muted/70 hover:border-muted focus:border-burgundy focus:ring-2 focus:ring-burgundy/20 focus:outline-none aria-invalid:border-danger"
                {...props}
            />
            {hint && !error && (
                <p id={`${id}-hint`} className="text-xs text-muted">
                    {hint}
                </p>
            )}
            <FieldError id={`${id}-error`} message={error} />
        </div>
    );
}
