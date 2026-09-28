import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Page title block used by every admin page. */
export function PageHeader({ eyebrow, title, description, actions, back }) {
    return (
        <header className="mb-8 flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                {back && (
                    <Link
                        href={back.href}
                        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-burgundy"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        {back.label}
                    </Link>
                )}
                {eyebrow && <p className="eyebrow text-gold-deep">{eyebrow}</p>}
                <h1 className="mt-1.5 text-3xl font-medium tracking-tight text-balance sm:text-[2.1rem]">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
    );
}
