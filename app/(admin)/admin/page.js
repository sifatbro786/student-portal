import { requireAuth } from "@/server/auth/guards.js";
import { formatDate } from "@/lib/date.js";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
    // Re-checked here too: layouts are not re-run on every client navigation.
    const user = await requireAuth(["super_admin", "admin"]);
    return (
        <section>
            <p className="eyebrow text-gold-deep">{formatDate(new Date())}</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                Good to see you, {user.name.split(" ")[0]}.
            </h1>
            <span className="gold-rule mt-4" />
            <div className="mt-10 rounded-lg border border-dashed border-line-strong bg-surface/60 p-8">
                <h2 className="text-xl font-medium">Your dashboard is being set up</h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                    Students, batches, admissions and the rest of the tools will appear here as each
                    module goes live.
                </p>
            </div>
        </section>
    );
}
