import { getStudentScope } from "@/server/auth/guards.js";
import { upcomingForStudent } from "@/server/services/assignments.js";
import { Sidebar } from "@/components/admin/Sidebar.js";
import { STUDENT_NAV } from "@/components/student/nav.js";
import { logoutAction, logoutAllAction } from "@/app/(auth)/actions.js";

export const metadata = { robots: { index: false, follow: false } };

// Same shell as the admin: fixed sidebar on desktop, top bar + drawer on phones.
export default async function StudentLayout({ children }) {
    const scope = await getStudentScope(); // student role + active record, else 404/redirect
    const due = await upcomingForStudent(scope, 99);
    return (
        <div className="flex min-h-dvh flex-1 flex-col lg:pl-68">
            <Sidebar
                user={{ name: scope.user.name, role: scope.user.role }}
                roleLabel={scope.studentId}
                nav={STUDENT_NAV}
                homeHref="/dashboard"
                label="Student portal"
                profileHref="/dashboard/profile"
                logoutAction={logoutAction}
                logoutAllAction={logoutAllAction}
                badges={{ dueAssignments: due.length }}
            />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 lg:py-10">
                {children}
            </main>
        </div>
    );
}
