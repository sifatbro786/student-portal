import Link from "next/link";
import { cx } from "@/components/ui/cx.js";

/** Index-tab switch between the matrix and the list view. */
export function PaymentsNav({ current }) {
    const tabs = [
        ["/admin/payments", "Month × student"],
        ["/admin/payments/list", "List"],
    ];
    return (
        <nav
            aria-label="Payments view"
            className="mb-5 flex gap-1 border-b border-line"
        >
            {tabs.map(([href, label]) => (
                <Link
                    key={href}
                    href={href}
                    aria-current={href === current ? "page" : undefined}
                    className={cx(
                        "-mb-px shrink-0 rounded-t-md border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors",
                        href === current
                            ? "border-line bg-surface text-burgundy"
                            : "border-transparent text-muted hover:text-ink",
                    )}
                >
                    {label}
                </Link>
            ))}
        </nav>
    );
}
