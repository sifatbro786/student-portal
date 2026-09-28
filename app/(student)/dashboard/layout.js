import { requireAuth } from "@/server/auth/guards.js";
import { Logo } from "@/components/ui/Logo.js";
import { AccountBar } from "@/components/shell/AccountBar.js";
import { StudentNav } from "@/components/student/StudentNav.js";

export const metadata = { robots: { index: false, follow: false } };

// Mobile-first shell (PRD §13): bottom tab bar on phones.
export default async function StudentLayout({ children }) {
    const user = await requireAuth(["student"]);
    return (
        <div className="flex min-h-dvh flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur-sm">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
                    <Logo href="/dashboard" />
                    <AccountBar user={user} />
                </div>
                <StudentNav variant="tabs" />
            </header>
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-28 sm:pb-12">
                {children}
            </main>
            <StudentNav variant="bottom" />
        </div>
    );
}
