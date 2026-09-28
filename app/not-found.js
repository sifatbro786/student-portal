import { Button } from "@/components/ui/Button.js";

export const metadata = { title: "Page not found" };

export default function NotFound() {
    return (
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-20">
            <p className="eyebrow text-gold-deep">Error 404</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
                This page isn&rsquo;t on the <em className="text-burgundy">syllabus.</em>
            </h1>
            <span className="gold-rule mt-6" />
            <p className="mt-6 leading-relaxed text-muted">
                The link may be old, or the page may not be available to your account.
            </p>
            <div className="mt-8">
                <Button href="/">Go to homepage</Button>
            </div>
        </main>
    );
}
