// Sidebar navigation. Items appear as their phase ships — never show dead links.
// `icon` is a lucide-react component name, resolved in Sidebar.js.
export const ADMIN_NAV = [
    {
        label: "Overview",
        items: [{ href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true }],
    },
    {
        label: "People",
        items: [{ href: "/admin/students", label: "Students", icon: "Users" }],
    },
    {
        label: "Academics",
        items: [{ href: "/admin/classes", label: "Classes & batches", icon: "Layers" }],
    },
    {
        label: "Settings",
        superAdminOnly: true,
        items: [{ href: "/admin/admins", label: "Admins", icon: "ShieldCheck" }],
    },
];
