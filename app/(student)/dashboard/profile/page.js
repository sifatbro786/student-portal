import { getStudentScope } from "@/server/auth/guards.js";
import { connectDB } from "@/server/db.js";
import { Student } from "@/server/models/Student.js";
import { Button } from "@/components/ui/Button.js";
import { formatDate } from "@/lib/date.js";
import { formatPhone, scheduleLabel } from "@/lib/format.js";

export const metadata = { title: "My profile" };

// FR-STU-09 — read-only. Corrections go through the office.
export default async function StudentProfilePage() {
    const scope = await getStudentScope();
    await connectDB();
    const s = await Student.findById(scope.studentObjectId)
        .populate("class", "name")
        .populate("batch", "name schedule")
        .lean();

    const rows = [
        [
            "Student ID",
            <span key="id" className="font-mono">
                {s.studentId}
            </span>,
        ],
        ["Class & batch", `${s.class?.name} · Batch ${s.batch?.name}`],
        ["Schedule", scheduleLabel(s.batch?.schedule)],
        ["Email", s.email],
        ["WhatsApp", formatPhone(s.whatsapp)],
        [
            "School",
            s.institution?.type === "school"
                ? s.institution.name
                : s.institution?.type === "private"
                  ? "Private candidate"
                  : "—",
        ],
        [
            "Father",
            [s.father?.name, formatPhone(s.father?.phone)].filter(Boolean).join(" · ") || "—",
        ],
        [
            "Mother",
            [s.mother?.name, formatPhone(s.mother?.phone)].filter(Boolean).join(" · ") || "—",
        ],
        ["Joined", formatDate(s.admittedAt)],
    ];

    return (
        <section>
            <p className="eyebrow text-gold-deep">My profile</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight">{s.fullName}</h1>
            <span className="gold-rule mt-4" />
            <dl className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface">
                {rows.map(([k, v]) => (
                    <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
                        <dt className="text-sm text-muted">{k}</dt>
                        <dd className="text-sm font-medium break-words">{v}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-4 text-sm text-muted">
                Something wrong? Tell the office and they’ll fix it.
            </p>
            <div className="mt-6">
                <Button href="/change-password" variant="secondary">
                    Change password
                </Button>
            </div>
        </section>
    );
}
