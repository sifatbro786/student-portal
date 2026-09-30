"use client";

import "./globals.css";

// Last resort: the root layout itself failed, so this renders its own <html>/<body>.
export default function GlobalError({ error, retry }) {
    return (
        <html lang="en">
            <body className="grid min-h-dvh place-items-center bg-paper px-5 text-ink">
                <main className="max-w-md">
                    <p className="eyebrow text-gold-deep">Something went wrong</p>
                    <h1 className="mt-3 font-serif text-4xl font-medium">
                        The site is having a moment.
                    </h1>
                    <p className="mt-4 leading-relaxed text-muted">
                        Please reload the page in a minute.
                    </p>
                    <button
                        type="button"
                        onClick={() => retry()}
                        className="mt-6 h-11 rounded-md bg-burgundy px-5 font-semibold text-paper"
                    >
                        Try again
                    </button>
                    {error?.digest && (
                        <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>
                    )}
                </main>
            </body>
        </html>
    );
}
