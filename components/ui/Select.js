import { cx } from "./cx.js";
import { FieldError } from "./Field.js";

export const selectClass =
    "block h-11 w-full appearance-none rounded-md border border-line-strong bg-surface bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b625a' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[position:right_0.9rem_center] bg-no-repeat pr-9 pl-3.5 text-[0.95rem] text-ink transition-colors hover:border-muted focus:border-burgundy focus:ring-2 focus:ring-burgundy/20 focus:outline-none aria-invalid:border-danger disabled:opacity-60";

/** Labelled native <select>. Pass <option>/<optgroup> as children. */
export function Select({ name, label, hint, error, className, children, ...props }) {
    const id = `f-${name}`;
    const describedBy =
        [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    return (
        <div className={cx("space-y-1.5", className)}>
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-ink">
                    {label}
                </label>
            )}
            <select
                id={id}
                name={name}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={selectClass}
                {...props}
            >
                {children}
            </select>
            {hint && !error && (
                <p id={`${id}-hint`} className="text-xs text-muted">
                    {hint}
                </p>
            )}
            <FieldError id={`${id}-error`} message={error} />
        </div>
    );
}
