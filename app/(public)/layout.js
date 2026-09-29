import { SiteHeader } from "@/components/public/SiteHeader.js";
import { SiteFooter } from "@/components/public/SiteFooter.js";

// Public website: homepage, honor board, gallery, notices, admission.
export default function PublicLayout({ children }) {
    return (
        <>
            <a
                href="#main"
                className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
                {children}
            </main>
            <SiteFooter />
        </>
    );
}
