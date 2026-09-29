import { cx } from "@/components/ui/cx.js";

/**
 * Editorial section title: letter-spaced eyebrow, serif title (optional italic accent),
 * thin gold rule (PRD §13). `tone="dark"` for burgundy/ink bands.
 */
export function SectionHeading({
    id,
    eyebrow,
    title,
    accent,
    children,
    align = "left",
    tone = "light",
    className,
}) {
    const dark = tone === "dark";
    return (
        <div
            className={cx(
                align === "center" && "mx-auto flex flex-col items-center text-center",
                "max-w-2xl",
                className,
            )}
        >
            {eyebrow && (
                <p className={cx("eyebrow", dark ? "text-gold-light" : "text-gold-deep")}>
                    {eyebrow}
                </p>
            )}
            <h2
                id={id}
                className={cx(
                    "mt-3 text-[2.1rem] leading-[1.08] font-medium tracking-tight sm:text-5xl",
                    dark ? "text-paper" : "text-ink",
                )}
            >
                {title}
                {accent && (
                    <>
                        {" "}
                        <em
                            className={cx(
                                "font-normal",
                                dark ? "text-gold-light" : "text-burgundy",
                            )}
                        >
                            {accent}
                        </em>
                    </>
                )}
            </h2>
            <span className={cx("gold-rule mt-6", dark && "bg-gold-light")} />
            {children && (
                <div
                    className={cx(
                        "mt-5 text-[1.02rem] leading-relaxed",
                        dark ? "text-paper/75" : "text-muted",
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
