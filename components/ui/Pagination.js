import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "./cx.js";

/** Server-side pagination that keeps the current filters in the URL. */
export function Pagination({ page, pages, total, basePath, params }) {
    if (pages <= 1) return <p className="mt-4 text-sm text-muted">{total} total</p>;
    const href = (p) => {
        const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
        sp.set("page", String(p));
        return `${basePath}?${sp}`;
    };
    const link =
        "inline-flex h-9 items-center gap-1 rounded-md border border-line px-3 text-sm font-medium";
    return (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
                Page {page} of {pages} · {total} total
            </p>
            <div className="flex gap-2">
                {page > 1 ? (
                    <Link href={href(page - 1)} className={cx(link, "hover:border-ink")}>
                        <ChevronLeft aria-hidden="true" className="size-4" /> Previous
                    </Link>
                ) : null}
                {page < pages ? (
                    <Link href={href(page + 1)} className={cx(link, "hover:border-ink")}>
                        Next <ChevronRight aria-hidden="true" className="size-4" />
                    </Link>
                ) : null}
            </div>
        </nav>
    );
}
