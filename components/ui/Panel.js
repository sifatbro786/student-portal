import { cx } from "./cx.js";

/** Bordered surface section with an optional serif heading. */
export function Panel({ title, description, actions, tone, className, children }) {
    return (
        <section
            className={cx(
                "rounded-lg border bg-surface",
                tone === "danger" ? "border-danger/35" : "border-line",
                className,
            )}
        >
            {(title || actions) && (
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <div>
                        {title && (
                            <h2
                                className={cx(
                                    "text-lg font-medium",
                                    tone === "danger" && "text-danger",
                                )}
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-0.5 text-sm leading-relaxed text-muted">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions}
                </div>
            )}
            <div className="px-5 py-5">{children}</div>
        </section>
    );
}
