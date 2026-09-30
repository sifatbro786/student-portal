// Sidebar navigation. Items appear as their phase ships — never show dead links.
// `icon` is a lucide-react component name, resolved in Sidebar.js.
export const ADMIN_NAV = [
    {
        label: "Overview",
        items: [{ href: "/admin", label: "Dashboard", icon: "LayoutDashboard", exact: true }],
    },
    {
        label: "People",
        items: [
            {
                href: "/admin/admissions",
                label: "Admissions",
                icon: "Inbox",
                badge: "pendingAdmissions",
            },
            { href: "/admin/students", label: "Students", icon: "Users" },
        ],
    },
    {
        label: "Academics",
        items: [
            { href: "/admin/classes", label: "Classes & batches", icon: "Layers" },
            { href: "/admin/exams", label: "Exams & results", icon: "ClipboardCheck" },
        ],
    },
    {
        label: "Content",
        items: [
            { href: "/admin/notices", label: "Notices", icon: "Megaphone" },
            { href: "/admin/materials", label: "Materials", icon: "BookOpen" },
            { href: "/admin/assignments", label: "Assignments", icon: "ClipboardList" },
        ],
    },
    {
        label: "Office",
        items: [{ href: "/admin/payments", label: "Payments", icon: "Wallet" }],
    },
    {
        label: "Website",
        items: [
            { href: "/admin/site-content", label: "Site content", icon: "PanelsTopLeft" },
            { href: "/admin/honor-board", label: "Honor board", icon: "Award" },
            { href: "/admin/gallery", label: "Gallery", icon: "Images" },
            {
                href: "/admin/reviews",
                label: "Reviews",
                icon: "MessageSquareQuote",
                badge: "pendingReviews",
            },
            { href: "/admin/seo", label: "SEO", icon: "SearchCheck" },
        ],
    },
    {
        label: "Settings",
        superAdminOnly: true,
        items: [
            { href: "/admin/admins", label: "Admins", icon: "ShieldCheck" },
            { href: "/admin/audit-log", label: "Audit log", icon: "ScrollText" },
        ],
    },
];
