"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, FileQuestion, Home, Megaphone } from "lucide-react";
import { cx } from "@/components/ui/cx.js";

const ITEMS = [
    { href: "/dashboard", label: "Home", icon: Home, exact: true },
    { href: "/dashboard/notices", label: "Notices", icon: Megaphone },
    { href: "/dashboard/materials", label: "Notes", icon: BookOpen },
    { href: "/dashboard/question-papers", label: "Papers", icon: FileQuestion },
    { href: "/dashboard/routine", label: "Routine", icon: CalendarDays },
];

/**
 * variant "tabs": quiet tab row (≥ sm), lives in the sticky header.
 * variant "bottom": fixed tab bar on phones — must NOT sit inside the header,
 * whose backdrop-filter would become its containing block.
 */
export function StudentNav({ variant }) {
    const pathname = usePathname();
    const active = (i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href));
    if (variant === "tabs")
        return (
            <nav aria-label="Student sections" className="hidden border-t border-line sm:block">
                <ul className="mx-auto flex max-w-3xl gap-1 px-4">
                    {ITEMS.map((i) => (
                        <li key={i.href}>
                            <Link
                                href={i.href}
                                aria-current={active(i) ? "page" : undefined}
                                className={cx(
                                    "-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                                    active(i)
                                        ? "border-burgundy text-burgundy"
                                        : "border-transparent text-muted hover:text-ink",
                                )}
                            >
                                <i.icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
                                {i.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        );
    return (
        <nav
            aria-label="Student sections"
            className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden"
        >
            <ul className="grid grid-cols-5">
                {ITEMS.map((i) => (
                    <li key={i.href}>
                        <Link
                            href={i.href}
                            aria-current={active(i) ? "page" : undefined}
                            className={cx(
                                "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold",
                                active(i) ? "text-burgundy" : "text-muted",
                            )}
                        >
                            <span
                                className={cx(
                                    "grid h-7 w-12 place-items-center rounded-full transition-colors",
                                    active(i) && "bg-burgundy-tint",
                                )}
                            >
                                <i.icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
                            </span>
                            {i.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
