import Link from "next/link";
import { logoutAction, logoutAllAction } from "@/app/(auth)/actions.js";
import { StatusChip } from "@/components/ui/StatusChip.js";

const ROLE_LABEL = { super_admin: "Super admin", admin: "Admin", student: "Student" };

/** Name, role and account actions. Server component; forms post Server Actions. */
export function AccountBar({ user }) {
    return (
        <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-2 py-1.5 hover:bg-paper-deep [&::-webkit-details-marker]:hidden">
                <span
                    aria-hidden="true"
                    className="grid size-9 place-items-center rounded-full bg-burgundy font-serif text-sm text-paper"
                >
                    {initials(user.name)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-semibold">{user.name}</span>
                    <span className="block text-xs text-muted">{ROLE_LABEL[user.role]}</span>
                </span>
                <span
                    aria-hidden="true"
                    className="text-xs text-muted transition-transform group-open:rotate-180"
                >
                    ▾
                </span>
                <span className="sr-only">Account menu</span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-line bg-surface p-2 shadow-[0_18px_40px_-20px_rgb(31_26_23/0.35)]">
                <div className="border-b border-line px-3 pt-1 pb-3 sm:hidden">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <StatusChip className="mt-1.5">{ROLE_LABEL[user.role]}</StatusChip>
                </div>
                {user.role === "student" && (
                    <Link
                        href="/dashboard/profile"
                        className="block rounded-md px-3 py-2 text-sm hover:bg-paper-deep"
                    >
                        My profile
                    </Link>
                )}
                <Link
                    href="/change-password"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-paper-deep"
                >
                    Change password
                </Link>
                <form action={logoutAllAction}>
                    <button
                        type="submit"
                        className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-paper-deep"
                    >
                        Log out of all devices
                    </button>
                </form>
                <form action={logoutAction} className="mt-1 border-t border-line pt-1">
                    <button
                        type="submit"
                        className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-burgundy hover:bg-burgundy-tint"
                    >
                        Log out
                    </button>
                </form>
            </div>
        </details>
    );
}

function initials(name = "") {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("");
}
