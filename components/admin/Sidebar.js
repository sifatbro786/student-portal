"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Inbox,
    KeyRound,
    Layers,
    LayoutDashboard,
    LogOut,
    Menu,
    ShieldCheck,
    Users,
    X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo.js";
import { cx } from "@/components/ui/cx.js";
import { ADMIN_NAV } from "./nav.js";

const ICONS = { LayoutDashboard, Users, Layers, ShieldCheck, Inbox };

/**
 * Desktop: fixed left sidebar. Mobile: top bar + slide-in drawer.
 * `logoutAction` / `logoutAllAction` are Server Actions passed from the layout.
 */
export function Sidebar({ user, roleLabel, logoutAction, logoutAllAction, badges = {} }) {
    const pathname = usePathname();
    // The drawer is "open for a path": navigating away closes it without an effect.
    const [openOn, setOpenOn] = useState(null);
    const open = openOn === pathname;
    const setOpen = (v) => setOpenOn(v ? pathname : null);
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpenOn(null);
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open]);

    const groups = ADMIN_NAV.filter((g) => !g.superAdminOnly || user.role === "super_admin");
    const isActive = (item) =>
        item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

    const nav = (
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-6">
            {groups.map((g) => (
                <div key={g.label} className="mb-6">
                    <p className="eyebrow mb-2 px-3 text-[0.62rem] text-muted">{g.label}</p>
                    <ul className="space-y-0.5">
                        {g.items.map((item) => {
                            const Icon = ICONS[item.icon];
                            const active = isActive(item);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        className={cx(
                                            "relative flex h-10 items-center gap-3 rounded-md px-3 text-[0.92rem] font-medium transition-colors duration-200",
                                            active
                                                ? "bg-surface text-burgundy shadow-[0_1px_0_rgb(31_26_23/0.04)] before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-burgundy"
                                                : "text-ink/80 hover:bg-surface/70 hover:text-ink",
                                        )}
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4.5 shrink-0"
                                            strokeWidth={1.8}
                                        />
                                        {item.label}
                                        {item.badge && badges[item.badge] > 0 && (
                                            <span className="ml-auto rounded-full bg-burgundy px-2 py-0.5 text-[0.7rem] font-bold text-paper tabular-nums">
                                                {badges[item.badge]}
                                                <span className="sr-only"> waiting</span>
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );

    const account = (
        <div className="border-t border-line p-3">
            <div className="flex items-center gap-3 px-2 py-2">
                <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-burgundy font-serif text-sm text-paper"
                >
                    {initials(user.name)}
                </span>
                <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-semibold">{user.name}</span>
                    <span className="block text-xs text-muted">{roleLabel}</span>
                </span>
            </div>
            <div className="mt-1 grid gap-0.5">
                <Link
                    href="/change-password"
                    className="flex h-9 items-center gap-2.5 rounded-md px-3 text-sm text-ink/80 hover:bg-surface/70 hover:text-ink"
                >
                    <KeyRound aria-hidden="true" className="size-4" /> Change password
                </Link>
                <form action={logoutAllAction}>
                    <button
                        type="submit"
                        className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm text-ink/80 hover:bg-surface/70 hover:text-ink"
                    >
                        <LogOut aria-hidden="true" className="size-4" /> Log out of all devices
                    </button>
                </form>
                <form action={logoutAction}>
                    <button
                        type="submit"
                        className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm font-semibold text-burgundy hover:bg-burgundy-tint"
                    >
                        <LogOut aria-hidden="true" className="size-4" /> Log out
                    </button>
                </form>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile top bar */}
            <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur-sm lg:hidden">
                <Logo href="/admin" />
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-expanded={open}
                    aria-controls="admin-sidebar"
                    className="grid size-10 place-items-center rounded-md text-ink hover:bg-paper-deep"
                >
                    <Menu aria-hidden="true" className="size-5" />
                    <span className="sr-only">Open menu</span>
                </button>
            </div>

            {/* Backdrop (mobile) */}
            <div
                aria-hidden="true"
                onClick={() => setOpen(false)}
                className={cx(
                    "fixed inset-0 z-40 bg-ink/35 transition-opacity duration-300 lg:hidden",
                    open ? "opacity-100" : "pointer-events-none opacity-0",
                )}
            />

            <aside
                id="admin-sidebar"
                className={cx(
                    "grain fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-line bg-paper-deep transition-transform duration-300 ease-editorial lg:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-18 items-center justify-between border-b border-line px-5">
                    <Logo href="/admin" />
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="grid size-9 place-items-center rounded-md hover:bg-surface lg:hidden"
                    >
                        <X aria-hidden="true" className="size-5" />
                        <span className="sr-only">Close menu</span>
                    </button>
                </div>
                {nav}
                {account}
            </aside>
        </>
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
