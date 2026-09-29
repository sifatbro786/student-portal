import Link from "next/link";
import { Logo } from "@/components/ui/Logo.js";
import { buttonClass } from "@/components/ui/Button.js";
import { HeaderShell, MobileMenu } from "./HeaderClient.js";

export const PUBLIC_NAV = [
    { href: "/#about", label: "About" },
    { href: "/honor-board", label: "Results" },
    { href: "/gallery", label: "Gallery" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/notices", label: "Notices" },
    { href: "/#classes", label: "Classes" },
];

/** Solid paper bar + gold hairline (no glass — PRD §13); gains a shadow once scrolled. */
export function SiteHeader() {
    return (
        <HeaderShell>
            <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Logo />
                <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
                    {PUBLIC_NAV.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="relative text-[0.92rem] font-semibold text-ink/80 transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-burgundy hover:after:scale-x-100"
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <Link
                        href="/login"
                        className="hidden px-2 text-sm font-semibold text-ink/80 hover:text-burgundy sm:inline"
                    >
                        Student login
                    </Link>
                    <span className="hidden sm:block">
                        <Link href="/admission" className={buttonClass({ size: "sm" })}>
                            Apply now
                        </Link>
                    </span>
                    <MobileMenu links={PUBLIC_NAV} />
                </div>
            </div>
        </HeaderShell>
    );
}
