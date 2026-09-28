import Link from "next/link";
import { cx } from "./cx.js";

const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-wide transition-[background-color,color,border-color,transform] duration-300 ease-(--ease-editorial) disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px";

const variants = {
    primary: "bg-burgundy text-paper hover:bg-burgundy-deep",
    secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
    ghost: "text-burgundy hover:bg-burgundy-tint",
    link: "text-burgundy underline decoration-gold decoration-1 underline-offset-4 hover:decoration-burgundy",
};

const sizes = {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 text-[0.95rem]",
    lg: "h-12 px-6 text-base",
};

export function buttonClass({ variant = "primary", size = "md", className } = {}) {
    return cx(base, variants[variant], variant !== "link" && sizes[size], className);
}

/** @param {{ variant?: keyof variants, size?: keyof sizes, href?: string } & Record<string, any>} props */
export function Button({ variant, size, className, href, ...props }) {
    const cls = buttonClass({ variant, size, className });
    if (href) return <Link href={href} className={cls} {...props} />;
    return <button type="button" className={cls} {...props} />;
}
