import Link from "next/link";
import { buttonClass } from "./Button.js";

/**
 * Shared body of every error screen (error.js files). No details leak: in production
 * Next only forwards a digest, which we show so a user can quote it and we can find
 * the matching `request.failed` log line.
 */
export function ErrorView({ title, children, digest, retry, homeHref = "/", homeLabel }) {
    return (
        <div className="mx-auto flex w-full max-w-xl flex-col justify-center px-1 py-16 sm:py-24">
            <p className="eyebrow text-gold-deep">Something went wrong</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
            <span className="gold-rule mt-6" />
            <div className="mt-6 leading-relaxed text-muted">{children}</div>
            <div className="mt-8 flex flex-wrap gap-3">
                {retry && (
                    <button type="button" onClick={() => retry()} className={buttonClass()}>
                        Try again
                    </button>
                )}
                <Link href={homeHref} className={buttonClass({ variant: "secondary" })}>
                    {homeLabel ?? "Go to homepage"}
                </Link>
            </div>
            {digest && (
                <p className="mt-8 text-xs text-muted">
                    Reference: <span className="font-mono select-all">{digest}</span>
                </p>
            )}
        </div>
    );
}
