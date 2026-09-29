import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listTestimonialsAdmin } from "@/server/services/testimonials.js";
import { listQuery } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { cx } from "@/components/ui/cx.js";
import { Alert } from "@/components/ui/Alert.js";
import { ReviewModeration } from "@/components/admin/ReviewModeration.js";
import { formatDateTime } from "@/lib/date.js";
import { deleteReviewAdminAction, moderateReviewAction } from "./actions.js";

export const metadata = { title: "Reviews" };

const DONE = {
    approve: "Approved — it’s on the homepage now.",
    reject: "Marked as not approved. The student sees your note in their portal.",
    pending: "Moved back to pending (removed from the homepage).",
};

const TABS = [
    ["pending", "Waiting"],
    ["approved", "On the website"],
    ["rejected", "Not approved"],
];

export default async function ReviewsAdminPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const status = TABS.some(([k]) => k === sp.status) ? sp.status : "pending";
    const { page, pageSize } = listQuery.parse(sp);
    const { rows, total, counts } = await listTestimonialsAdmin({ status, page, pageSize });

    return (
        <>
            <PageHeader
                eyebrow="Website"
                title="Student reviews"
                description="Students write reviews from their portal. Nothing appears on the homepage until you approve it; editing a review sends it back here."
            />
            {DONE[sp.done] && (
                <Alert tone="success" className="mb-6">
                    {DONE[sp.done]}
                </Alert>
            )}
            <nav
                aria-label="Status"
                className="mb-6 flex gap-1 overflow-x-auto border-b border-line"
            >
                {TABS.map(([k, label]) => (
                    <Link
                        key={k}
                        href={`/admin/reviews?status=${k}`}
                        aria-current={k === status ? "page" : undefined}
                        className={cx(
                            "-mb-px flex shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors",
                            k === status
                                ? "border-line bg-surface text-burgundy"
                                : "border-transparent text-muted hover:text-ink",
                        )}
                    >
                        {label}
                        <span className="rounded-full bg-paper-deep px-2 py-0.5 text-xs tabular-nums">
                            {counts[k] ?? 0}
                        </span>
                    </Link>
                ))}
            </nav>

            {rows.length === 0 ? (
                <EmptyState icon={MessageSquareQuote} title="Nothing here">
                    {status === "pending"
                        ? "No reviews are waiting. Students can write one from “My review” in their portal."
                        : "No reviews with this status yet."}
                </EmptyState>
            ) : (
                <ul className="space-y-5">
                    {rows.map((r) => (
                        <li key={r.id} className="rounded-lg border border-line bg-surface p-5">
                            {/* key: a student edit (new submittedAt) resets the uncontrolled form */}
                            <ReviewModeration
                                key={r.submittedAt}
                                review={r}
                                submittedLabel={formatDateTime(r.submittedAt)}
                                action={moderateReviewAction}
                            />
                            <div className="mt-3 flex justify-start">
                                <ActionForm
                                    action={deleteReviewAdminAction.bind(null, r.id)}
                                    label="Delete"
                                    variant="ghost"
                                    size="sm"
                                    danger
                                    confirm={{
                                        title: `Delete ${r.name}’s review?`,
                                        body: "It is removed for good (the student can write a new one).",
                                        confirmLabel: "Delete",
                                    }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {total > 0 && (
                <Pagination
                    page={page}
                    pages={Math.ceil(total / pageSize)}
                    total={total}
                    basePath="/admin/reviews"
                    params={{ status }}
                />
            )}
        </>
    );
}
