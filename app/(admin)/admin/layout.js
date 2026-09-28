import { requireAuth } from "@/server/auth/guards.js";
import { Logo } from "@/components/ui/Logo.js";
import { AccountBar } from "@/components/shell/AccountBar.js";

export const metadata = { robots: { index: false, follow: false } };

// Full sidebar navigation arrives in P2.5.
export default async function AdminLayout({ children }) {
    const user = await requireAuth(["super_admin", "admin"]);
    return (
        <div className="flex min-h-dvh flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <Logo href="/admin" />
                    <AccountBar user={user} />
                </div>
            </header>
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        </div>
    );
}
