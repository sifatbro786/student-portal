import { cx } from "./cx.js";

const tones = {
    error: { cls: "border-danger/30 bg-burgundy-tint text-danger", mark: "!" },
    success: { cls: "border-success/30 bg-success-tint text-success", mark: "✓" },
    info: { cls: "border-line bg-paper-deep text-ink", mark: "i" },
};

/** Form-level message, announced to screen readers (PRD §13 a11y). */
export function Alert({ tone = "info", children, className }) {
    const t = tones[tone];
    return (
        <div
            role={tone === "error" ? "alert" : "status"}
            aria-live={tone === "error" ? "assertive" : "polite"}
            className={cx(
                "flex items-start gap-3 rounded-md border px-3.5 py-3 text-sm",
                t.cls,
                className,
            )}
        >
            <span
                aria-hidden="true"
                className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-current text-[0.7rem] font-bold"
            >
                {t.mark}
            </span>
            <div className="leading-relaxed">{children}</div>
        </div>
    );
}
