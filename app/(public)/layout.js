import { SiteHeader } from "@/components/public/SiteHeader.js";
import { SiteFooter } from "@/components/public/SiteFooter.js";

// Public pages. The homepage joins this group in P8.
export default function PublicLayout({ children }) {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
        </>
    );
}
