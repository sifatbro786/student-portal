import { Logo } from "@/components/ui/Logo.js";

export const metadata = {
    robots: { index: false, follow: false },
};

const HIGHLIGHTS = [
    ["01", "Notices & routine for your batch"],
    ["02", "Notes and question papers"],
    ["03", "Homework & assignment submission"],
    ["04", "Mock test results"],
];

export default function AuthLayout({ children }) {
    return (
        <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            {/* Editorial panel — desktop only */}
            <aside className="relative hidden overflow-hidden bg-burgundy text-paper lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                <div
                    aria-hidden="true"
                    className="grain pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-6 -bottom-16 font-serif text-[18rem] leading-none font-semibold italic text-paper/4 select-none"
                >
                    TM
                </span>

                <Logo tone="paper" className="relative" />

                <div className="relative max-w-lg animate-rise">
                    <p className="eyebrow text-gold-light">Expert guidance • Better results</p>
                    <p className="mt-5 font-serif text-5xl leading-[1.05] font-medium tracking-tight xl:text-6xl">
                        Face the exam with{" "}
                        <em className="font-normal text-gold-light">confidence.</em>
                    </p>
                    <span className="gold-rule mt-8" />
                    <ol className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5">
                        {HIGHLIGHTS.map(([n, text]) => (
                            <li key={n} className="border-t border-paper/15 pt-3">
                                <span className="font-serif text-xl text-gold-light">{n}</span>
                                <span className="mt-1 block text-sm leading-snug text-paper/85">
                                    {text}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>

                <p className="relative text-xs tracking-wide text-paper/70">
                    Cambridge Assessment International Education · Pearson Edexcel
                </p>
            </aside>

            {/* Form column */}
            <main className="flex flex-col">
                <div className="h-1.5 bg-burgundy lg:hidden" aria-hidden="true" />
                <div className="flex flex-1 flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
                    <div className="lg:hidden">
                        <Logo />
                    </div>
                    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
