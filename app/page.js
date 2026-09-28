import { Button } from "@/components/ui/Button.js";
import { Logo } from "@/components/ui/Logo.js";

// Temporary holding page — the real homepage is built in P8.
export default function Home() {
    return (
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8 sm:px-8">
            <Logo href={null} />
            <div className="flex flex-1 flex-col justify-center py-16">
                <p className="eyebrow text-gold-deep">Cambridge · Edexcel · Dhanmondi</p>
                <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] font-medium tracking-tight sm:text-7xl">
                    O&rsquo;Level English, taught with <em className="text-burgundy">care.</em>
                </h1>
                <span className="gold-rule mt-8" />
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                    The new website is on its way. Enrolled students can already sign in to the
                    portal.
                </p>
                <div className="mt-10">
                    <Button href="/login" size="lg">
                        Student &amp; staff login
                    </Button>
                </div>
            </div>
        </main>
    );
}
