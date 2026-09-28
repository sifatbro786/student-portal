import Image from "next/image";
import Link from "next/link";
import { cx } from "./cx.js";

/**
 * Client's TM quill monogram + wordmark. The mark PNGs in public/brand/ were cut from
 * public/logo.jpeg with a transparent background (swap for an SVG when the client sends one).
 * @param {{ tone?: 'burgundy' | 'paper', href?: string | null, className?: string }} props
 */
export function Logo({ tone = "burgundy", href = "/", className }) {
    const paper = tone === "paper";
    const mark = (
        <span className={cx("inline-flex items-center gap-3", className)}>
            <Image
                src={paper ? "/brand/tm-mark-light.png" : "/brand/tm-mark.png"}
                alt=""
                width={46}
                height={32}
                className="h-8 w-auto shrink-0"
                priority
            />
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
