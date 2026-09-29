// Student portal sidebar (same shell as the admin — components/admin/Sidebar.js).
// `icon` is a lucide-react component name resolved in Sidebar.js.
export const STUDENT_NAV = [
    {
        label: "Overview",
        items: [{ href: "/dashboard", label: "Home", icon: "Home", exact: true }],
    },
    {
        label: "Class",
        items: [
            { href: "/dashboard/notices", label: "Notices", icon: "Megaphone" },
            {
                href: "/dashboard/assignments",
                label: "Assignments",
                icon: "ClipboardList",
                badge: "dueAssignments",
            },
            { href: "/dashboard/routine", label: "Routine", icon: "CalendarDays" },
        ],
    },
    {
        label: "Study",
        items: [
            { href: "/dashboard/materials", label: "Notes", icon: "BookOpen" },
            { href: "/dashboard/question-papers", label: "Question papers", icon: "FileQuestion" },
            { href: "/dashboard/results", label: "Results", icon: "Trophy" },
        ],
    },
    {
        label: "Account",
        items: [
            { href: "/dashboard/profile", label: "My profile", icon: "UserRound" },
            { href: "/dashboard/review", label: "My review", icon: "MessageSquareQuote" },
        ],
    },
];
