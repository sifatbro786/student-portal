import { cx } from "./cx.js";

/** Checkbox / radio with a label to the right. */
export function Check({ label, hint, type = "checkbox", className, ...props }) {
    return (
        <label className={cx("flex cursor-pointer items-start gap-3", className)}>
            <input
                type={type}
                className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-burgundy"
                {...props}
            />
            <span className="text-sm leading-snug">
                <span className="font-medium text-ink">{label}</span>
                {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
            </span>
        </label>
    );
}
