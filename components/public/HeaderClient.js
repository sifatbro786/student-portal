"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { buttonClass } from "@/components/ui/Button.js";
import { cx } from "@/components/ui/cx.js";

/** Sticky header wrapper: adds a soft shadow after the first few pixels of scroll. */
export function HeaderShell({ children }) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const on = () => setScrolled(window.scrollY > 8);
        on();
        window.addEventListener("scroll", on, { passive: true });
        return () => window.removeEventListener("scroll", on);
    }, []);
    return (
        <header
            className={cx(
                "sticky top-0 z-40 border-b bg-paper transition-shadow duration-300",
                scrolled
                    ? "border-gold/40 shadow-[0_6px_24px_-12px_rgb(31_26_23/0.25)]"
                    : "border-gold/30",
            )}
        >
            {children}
        </header>
    );
}

/** Phone / tablet menu: full-width sheet under the bar. Closes on navigation and Escape. */
export function MobileMenu({ links }) {
    const pathname = usePathname();
    const [openOn, setOpenOn] = useState(null);
    const open = openOn === pathname;
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpenOn(null);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);
    return (
        <div className="lg:hidden">
            <button
                type="button"
                onClick={() => setOpenOn(open ? null : pathname)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                className="grid size-11 place-items-center rounded-md text-ink hover:bg-paper-deep"
            >
                {open ? (
                    <X aria-hidden="true" className="size-6" />
                ) : (
                    <Menu aria-hidden="true" className="size-6" />
                )}
                <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            </button>
            <div
                id="mobile-menu"
                hidden={!open}
                className="absolute inset-x-0 top-full border-b border-gold/40 bg-paper shadow-[0_18px_30px_-18px_rgb(31_26_23/0.35)]"
            >
                <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                    <ul className="divide-y divide-line">
                        {links.map((l) => (
                            <li key={l.href}>
                                <Link
                                    href={l.href}
                                    onClick={() => setOpenOn(null)}
                                    className="flex h-12 items-center font-serif text-xl text-ink hover:text-burgundy"
                                >
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 grid grid-cols-2 gap-3 pb-2">
                        <Link
                            href="/login"
                            onClick={() => setOpenOn(null)}
                            className={buttonClass({ variant: "secondary" })}
                        >
                            Student login
                        </Link>
                        <Link
                            href="/admission"
                            onClick={() => setOpenOn(null)}
                            className={buttonClass()}
                        >
                            Apply now
                        </Link>
                    </div>
                </nav>
            </div>
        </div>
    );
}
