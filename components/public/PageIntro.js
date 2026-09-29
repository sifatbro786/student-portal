import { cx } from "@/components/ui/cx.js";

/** Top of an inner public page: eyebrow, serif h1 (one italic phrase), gold rule, intro. */
export function PageIntro({ eyebrow, title, accent, children, className, aside }) {
    return (
        <header
            className={cx(
                "mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-14 pb-10 sm:px-6 sm:pt-20 lg:flex-row lg:items-end lg:justify-between lg:px-8",
                className,
            )}
        >
            <div className="animate-rise max-w-3xl">
                {eyebrow && <p className="eyebrow text-gold-deep">{eyebrow}</p>}
                <h1 className="mt-4 text-[2.6rem] leading-[1.03] font-medium tracking-[-0.02em] sm:text-6xl lg:text-7xl">
                    {title}
                    {accent && (
                        <>
                            {" "}
                            <em className="font-normal text-burgundy">{accent}</em>
                        </>
                    )}
                </h1>
                <span className="gold-rule mt-7" />
                {children && (
                    <div className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
                        {children}
                    </div>
                )}
            </div>
            {aside}
        </header>
    );
}
