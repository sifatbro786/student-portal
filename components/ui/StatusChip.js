import { cx } from "./cx.js";

const tones = {
    neutral: "border-line-strong text-muted",
    success: "border-success/40 bg-success-tint text-success",
    danger: "border-danger/40 bg-burgundy-tint text-danger",
    gold: "border-gold/60 bg-gold-light/40 text-gold-deep",
    ink: "border-ink bg-ink text-paper",
};

/** Status is always spelled out — never colour alone (WCAG 1.4.1). */
export function StatusChip({ tone = "neutral", children, className }) {
    return (
        <span
            className={cx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                tones[tone],
                className,
            )}
        >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {children}
        </span>
    );
}
