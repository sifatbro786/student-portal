import Link from "next/link";
import { cx } from "./cx.js";

/**
 * Typographic "TM" monogram — placeholder until the client's SVG logo arrives.
 * @param {{ tone?: 'burgundy' | 'paper', href?: string | null, className?: string }} props
 */
export function Logo({ tone = "burgundy", href = "/", className }) {
    const paper = tone === "paper";
    const mark = (
        <span className={cx("inline-flex items-center gap-3", className)}>
            <span
                aria-hidden="true"
                className={cx(
                    "grid size-11 place-items-center rounded-full border font-serif text-lg font-semibold italic tracking-tight",
                    paper ? "border-gold-light/70 text-paper" : "border-burgundy/40 text-burgundy",
                )}
            >
                TM
            </span>
            <span className="leading-tight">
                <span
                    className={cx(
                        "block font-serif text-lg font-semibold",
                        paper ? "text-paper" : "text-ink",
                    )}
                >
                    Tauhid Mostafa
                </span>
                <span
                    className={cx(
                        "eyebrow block text-[0.6rem] tracking-[0.14em] whitespace-nowrap",
                        paper ? "text-gold-light" : "text-gold-deep",
                    )}
                >
                    O-Level English Language
                </span>
            </span>
        </span>
    );
    return href ? (
        <Link href={href} className="inline-block rounded-md">
            {mark}
        </Link>
    ) : (
        mark
    );
}
