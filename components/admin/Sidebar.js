"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    Award,
    BookOpen,
    CalendarDays,
    FileQuestion,
    Home,
    Trophy,
    UserRound,
    Wallet,
    PanelsTopLeft,
    Images,
    MessageSquareQuote,
    SearchCheck,
    ChevronsUpDown,
    ClipboardCheck,
    ClipboardList,
    Inbox,
    KeyRound,
    Layers,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    ShieldCheck,
    Users,
    X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo.js";
import { cx } from "@/components/ui/cx.js";
import { ADMIN_NAV } from "./nav.js";

const ICONS = {
    LayoutDashboard,
    Users,
    Layers,
    ShieldCheck,
    Inbox,
    Megaphone,
    BookOpen,
    ClipboardList,
    ClipboardCheck,
    Award,
    PanelsTopLeft,
    Images,
    MessageSquareQuote,
    SearchCheck,
    // student portal
    Home,
    FileQuestion,
    CalendarDays,
    Trophy,
    UserRound,
    Wallet,
};

/**
 * Desktop: fixed left sidebar. Mobile: top bar + slide-in drawer.
 * Shared by the admin and the student portal: `nav` (groups of { href, label, icon })
 * defaults to ADMIN_NAV; `homeHref` is where the logo points.
 * `logoutAction` / `logoutAllAction` are Server Actions passed from the layout.
 */
export function Sidebar({
    user,
    roleLabel,
    logoutAction,
    logoutAllAction,
    badges = {},
    nav: navGroups = ADMIN_NAV,
    homeHref = "/admin",
    label = "Admin",
    profileHref,
}) {
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

    const groups = navGroups.filter((g) => !g.superAdminOnly || user.role === "super_admin");
    const isActive = (item) =>
        item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

    const nav = (
        <nav aria-label={label} className="flex-1 overflow-y-auto px-3 py-6">
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
                                                <span className="sr-only"> pending</span>
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
        <AccountMenu
            user={user}
            roleLabel={roleLabel}
            pathname={pathname}
            profileHref={profileHref}
            logoutAction={logoutAction}
            logoutAllAction={logoutAllAction}
        />
    );

    return (
        <>
            {/* Mobile top bar */}
            <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur-sm lg:hidden">
                <Logo href={homeHref} />
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
                    "grain fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col lg:w-68 border-r border-line bg-paper-deep transition-transform duration-300 ease-editorial lg:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-18 items-center justify-between gap-2 border-b border-line px-4 lg:px-5">
                    <Logo href={homeHref} />
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

/**
 * Compact account row at the bottom of the sidebar. Opens an upward menu
 * (Change password / Log out of all devices / Log out) — one row instead of four.
 */
function AccountMenu({ user, roleLabel, pathname, profileHref, logoutAction, logoutAllAction }) {
    const [openOn, setOpenOn] = useState(null); // closes itself on navigation
    const open = openOn === pathname;
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => !ref.current?.contains(e.target) && setOpenOn(null);
        const onKey = (e) => e.key === "Escape" && setOpenOn(null);
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const item =
        "flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm text-ink/80 hover:bg-paper-deep hover:text-ink";
    return (
        <div ref={ref} className="relative border-t border-line p-3">
            {open && (
                <div
                    id="account-menu"
                    role="menu"
                    className="absolute inset-x-3 bottom-full mb-2 rounded-lg border border-line bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgb(31_26_23/0.35)]"
                >
                    {profileHref && (
                        <Link href={profileHref} role="menuitem" className={item}>
                            <UserRound aria-hidden="true" className="size-4" /> My profile
                        </Link>
                    )}
                    <Link href="/change-password" role="menuitem" className={item}>
                        <KeyRound aria-hidden="true" className="size-4" /> Change password
                    </Link>
                    <form action={logoutAllAction}>
                        <button type="submit" role="menuitem" className={item}>
                            <LogOut aria-hidden="true" className="size-4" /> Log out of all devices
                        </button>
                    </form>
                    <div className="my-1 border-t border-line" />
                    <form action={logoutAction}>
                        <button
                            type="submit"
                            role="menuitem"
                            className={cx(
                                item,
                                "font-semibold text-burgundy hover:bg-burgundy-tint hover:text-burgundy",
                            )}
                        >
                            <LogOut aria-hidden="true" className="size-4" /> Log out
                        </button>
                    </form>
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpenOn(open ? null : pathname)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="account-menu"
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface/70"
            >
                <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-burgundy font-serif text-sm text-paper"
                >
                    {initials(user.name)}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-semibold">{user.name}</span>
                    <span className="block text-xs text-muted">{roleLabel}</span>
                </span>
                <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted" />
                <span className="sr-only">Account menu</span>
            </button>
        </div>
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
