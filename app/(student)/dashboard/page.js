import { CalendarDays } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { getBatch } from "@/server/services/academics.js";
import { scheduleLabel } from "@/lib/format.js";

export const metadata = { title: "Dashboard" };

export default async function StudentHome() {
    const scope = await getStudentScope();
    const batch = await getBatch(String(scope.batchId));

    return (
        <section>
            <p className="eyebrow text-gold-deep">Welcome back</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight">{scope.fullName}</h1>
            <span className="gold-rule mt-4" />

            {/* Routine header (FR-BAT-04) */}
            <div className="mt-6 flex items-start gap-4 rounded-lg border border-line bg-surface p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-burgundy text-paper">
                    <CalendarDays aria-hidden="true" className="size-5" />
                </span>
                <div>
                    <p className="font-semibold">
                        {batch.class.name} · Batch {batch.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{scheduleLabel(batch.schedule)}</p>
                    {batch.room && <p className="text-sm text-muted">Room {batch.room}</p>}
                </div>
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-surface/60 p-6">
                <h2 className="text-lg font-medium">Your class space is almost ready</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Notices, notes, question papers and results for your batch will show up here.
                </p>
            </div>
        </section>
    );
}
