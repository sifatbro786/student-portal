import { requireAuth } from "@/server/auth/guards.js";

export const metadata = { title: "Dashboard" };

export default async function StudentHome() {
    // P4 switches this to getStudentScope() once students/batches exist (P2).
    const user = await requireAuth(["student"]);
    return (
        <section>
            <p className="eyebrow text-gold-deep">Welcome back</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight">{user.name}</h1>
            <span className="gold-rule mt-4" />
            <div className="mt-8 rounded-lg border border-dashed border-line-strong bg-surface/60 p-6">
                <h2 className="text-lg font-medium">Your class space is almost ready</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Notices, notes, question papers and results for your batch will show up here.
                </p>
            </div>
        </section>
    );
}
