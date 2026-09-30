import Link from "next/link";
import { Logo } from "@/components/ui/Logo.js";
import { buttonClass } from "@/components/ui/Button.js";

export const metadata = { title: "Page not found", robots: { index: false } };

const LINKS = [
    ["/honor-board", "Honor board"],
    ["/admission", "Admission"],
    ["/notices", "Notices"],
    ["/login", "Student login"],
];

// Root 404: any unknown URL, and private pages outside the user's scope (SEC-10).
export default function NotFound() {
    return (
        <div className="relative flex min-h-dvh flex-1 flex-col">
            <div
                className="grain pointer-events-none absolute inset-0 opacity-60"
                aria-hidden="true"
            />
            <header className="relative mx-auto w-full max-w-5xl px-5 pt-6">
                <Logo priority={false} />
            </header>
            <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-16">
                <p className="eyebrow text-gold-deep">Error 404</p>
                <h1 className="mt-3 max-w-2xl text-5xl leading-[1.04] font-medium tracking-tight sm:text-7xl">
                    This page isn&rsquo;t on the{" "}
                    <em className="font-normal text-burgundy">syllabus.</em>
                </h1>
                <span className="gold-rule mt-7" />
                <p className="mt-6 max-w-lg leading-relaxed text-muted">
                    The link may be old or mistyped, or the page isn&rsquo;t available to your
                    account.
                </p>
                <p className="mt-5 -rotate-2 font-hand text-2xl text-burgundy">
                    Let&rsquo;s get you back to class.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link href="/" className={buttonClass()}>
                        Go to homepage
                    </Link>
                    <nav
                        aria-label="Popular pages"
                        className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold"
                    >
                        {LINKS.map(([href, label]) => (
                            <Link
                                key={href}
                                href={href}
                                className="text-ink/80 underline decoration-gold underline-offset-4 hover:text-burgundy"
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </main>
        </div>
    );
}
