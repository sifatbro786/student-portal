import { getStudentScope } from "@/server/auth/guards.js";
import { getOwnTestimonial } from "@/server/services/testimonials.js";
import { ReviewForm } from "@/components/student/ReviewForm.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { formatDate } from "@/lib/date.js";
import { deleteReviewAction, saveReviewAction } from "./actions.js";

export const metadata = { title: "My review" };

const STATUS = {
    pending: { tone: "gold", label: "Waiting for approval" },
    approved: { tone: "success", label: "On the website" },
    rejected: { tone: "danger", label: "Not approved" },
};

export default async function StudentReviewPage() {
    const scope = await getStudentScope();
    const own = await getOwnTestimonial(scope);
    const initial = own && {
        quote: own.quote,
        rating: own.rating,
        resultLine: own.resultLine,
        hasPhoto: own.hasPhoto,
        // version in the URL so a new photo isn't served from the browser cache
        photoUrl: own.hasPhoto
            ? `/api/files/testimonial-photo/${own.id}?v=${own.photoVersion}`
            : null,
    };
    const st = own && STATUS[own.status];

    return (
        <section className="max-w-2xl">
            <p className="eyebrow text-gold-deep">Your voice</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight">
                {own ? "My review" : "Write a review"}
            </h1>
            <span className="gold-rule mt-4" />
            <p className="mt-4 text-sm leading-relaxed text-muted">
                Tell future students what learning with Tauhid Sir is like. The office reads every
                review first; approved ones appear on the homepage with your name.
            </p>

            {own && (
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
                    <StatusChip tone={st.tone}>{st.label}</StatusChip>
                    <span className="text-muted">Sent {formatDate(own.submittedAt)}</span>
                    {own.status === "rejected" && own.statusNote && (
                        <p className="w-full text-ink">
                            <span className="font-semibold">Note from the office:</span>{" "}
                            {own.statusNote}
                        </p>
                    )}
                    {own.status === "approved" && (
                        <p className="w-full text-muted">
                            Editing it takes it off the website until it’s approved again.
                        </p>
                    )}
                </div>
            )}

            <div className="mt-6 rounded-lg border border-line bg-surface p-5 sm:p-7">
                <ReviewForm action={saveReviewAction} initial={initial} />
            </div>

            {own && (
                <div className="mt-6">
                    <ActionForm
                        action={deleteReviewAction}
                        label="Delete my review"
                        variant="ghost"
                        size="sm"
                        confirm={{
                            title: "Delete your review?",
                            body: "It will be removed from the website too.",
                            confirmLabel: "Delete",
                        }}
                    />
                </div>
            )}
        </section>
    );
}
