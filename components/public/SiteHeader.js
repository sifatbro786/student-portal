import Link from "next/link";
import { Phone } from "lucide-react";
import { Logo } from "@/components/ui/Logo.js";
import { buttonClass } from "@/components/ui/Button.js";
import { formatPhone } from "@/lib/format.js";
import { SITE_DEFAULTS } from "@/lib/site-defaults.js";

// Minimal public header. P8 adds the full navigation.
export function SiteHeader() {
    return (
        <header className="border-b border-line bg-paper/90 backdrop-blur-sm">
            <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <Logo />
                <nav aria-label="Main" className="flex items-center gap-2 sm:gap-5">
                    <a
                        href={`tel:+${SITE_DEFAULTS.phone}`}
                        className="hidden items-center gap-2 text-sm font-semibold text-ink/80 hover:text-burgundy md:inline-flex"
                    >
                        <Phone aria-hidden="true" className="size-4" />
                        {formatPhone(SITE_DEFAULTS.phone)}
                    </a>
                    <Link
                        href="/login"
                        className={buttonClass({ variant: "secondary", size: "sm" })}
                    >
                        Student login
                    </Link>
                </nav>
            </div>
        </header>
    );
}
