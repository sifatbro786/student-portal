import { requireAuth } from "@/server/auth/guards.js";
import { Sidebar } from "@/components/admin/Sidebar.js";
import { logoutAction, logoutAllAction } from "@/app/(auth)/actions.js";
import { ROLE_LABELS } from "@/lib/constants.js";

export const metadata = {
    title: { template: "%s · Admin · Tauhid Mostafa", default: "Admin · Tauhid Mostafa" },
    robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
    const user = await requireAuth(["super_admin", "admin"]);
    return (
        <div className="flex min-h-dvh flex-1 flex-col lg:pl-[272px]">
            <Sidebar
                user={{ name: user.name, role: user.role }}
                roleLabel={ROLE_LABELS[user.role]}
                logoutAction={logoutAction}
                logoutAllAction={logoutAllAction}
            />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-10">
                {children}
            </main>
        </div>
    );
}
