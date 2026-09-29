import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Paperclip, Pencil } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { getAssignmentReview } from "@/server/services/assignments.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { Button, buttonClass } from "@/components/ui/Button.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { cx } from "@/components/ui/cx.js";
import { AssignmentState, SubmissionState } from "@/components/admin/AssignmentState.js";
import { ReviewDialog } from "@/components/admin/ReviewDialog.js";
import { ASSIGNMENT_TYPE_LABELS, SUBMISSION_FILE_LABELS } from "@/lib/constants.js";
import { formatDateTime } from "@/lib/date.js";
import {
    deleteAssignmentAction,
    reviewSubmissionAction,
    setAssignmentPublishedAction,
} from "../actions.js";

export const metadata = { title: "Assignment" };

const FILTERS = [
    ["all", "Everyone"],
    ["submitted", "On time"],
    ["late", "Late"],
    ["missing", "Missing"],
];

const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

export default async function AssignmentReviewPage({ params, searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const [{ assignmentId }, sp] = await Promise.all([params, searchParams]);
    const id = objectId.safeParse(assignmentId);
    if (!id.success) notFound();
    const review = await getAssignmentReview(id.data).catch(() => notFound());
    const { assignment: a, stats, audienceText, state } = review;
    const aid = String(a._id);
    const show = FILTERS.some(([k]) => k === sp.show) ? sp.show : "all";
    const rows = show === "all" ? review.rows : review.rows.filter((r) => r.status === show);
    const fileCount = review.rows.reduce((n, r) => n + (r.submission?.files.length ?? 0), 0);

    return (
        <>
            <PageHeader
                back={{ href: "/admin/assignments", label: "Assignments" }}
                eyebrow={`${ASSIGNMENT_TYPE_LABELS[a.type]} · ${audienceText}`}
                title={a.title}
                actions={
                    <>
                        <Button href={`/admin/assignments/${aid}/edit`} variant="secondary">
                            <Pencil aria-hidden="true" className="size-4" /> Edit
                        </Button>
                        {fileCount > 0 && (
                            <a
                                href={`/api/admin/assignments/${aid}/zip`}
                                className={buttonClass()}
                                download
                            >
                                <Download aria-hidden="true" className="size-4" /> Download all
                                (ZIP)
                            </a>
                        )}
                    </>
                }
            />
            {sp.saved && (
                <Alert tone="success" className="mb-6">
                    Assignment saved.
                </Alert>
            )}

            {/* Summary — plain figures, no animated counters (PRD §13). */}
            <dl className="mb-8 grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-5 [&>div]:border-line [&>div]:px-4 [&>div]:py-3.5">
                <div className="col-span-2 border-b sm:col-span-1 sm:border-r sm:border-b-0">
                    <dt className="eyebrow text-[0.62rem] text-muted">Deadline</dt>
                    <dd className="mt-1 text-sm font-semibold">{formatDateTime(a.deadline)}</dd>
                    <dd className="mt-1">
                        <AssignmentState state={state} />
                    </dd>
                </div>
                <div className="border-r">
                    <dt className="eyebrow text-[0.62rem] text-muted">Handed in</dt>
                    <dd className="mt-1 font-serif text-2xl">
                        {stats.submitted + stats.late}
                        <span className="text-base text-muted"> / {stats.expected}</span>
                    </dd>
                </div>
                <div className="sm:border-r">
                    <dt className="eyebrow text-[0.62rem] text-muted">Late</dt>
                    <dd className="mt-1 font-serif text-2xl">{stats.late}</dd>
                </div>
                <div className="border-t border-r sm:border-t-0">
                    <dt className="eyebrow text-[0.62rem] text-muted">Missing</dt>
                    <dd className="mt-1 font-serif text-2xl text-danger">{stats.missing}</dd>
                </div>
                <div className="border-t sm:border-t-0">
                    <dt className="eyebrow text-[0.62rem] text-muted">Reviewed</dt>
                    <dd className="mt-1 font-serif text-2xl">{stats.reviewed}</dd>
                </div>
            </dl>

            <nav aria-label="Filter students" className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map(([k, l]) => (
                    <Link
                        key={k}
                        href={`/admin/assignments/${aid}?show=${k}`}
                        aria-current={k === show ? "page" : undefined}
                        className={cx(
                            "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                            k === show
                                ? "border-burgundy bg-burgundy text-paper"
                                : "border-line-strong text-muted hover:border-ink hover:text-ink",
                        )}
                    >
                        {l}
                    </Link>
                ))}
            </nav>

            {rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line-strong p-6 text-sm text-muted">
                    {review.rows.length === 0
                        ? "No active students in this audience yet."
                        : "No students in this group."}
                </p>
            ) : (
                <Table className="mb-10">
                    <thead>
                        <tr>
                            <Th>Student</Th>
                            <Th>Status</Th>
                            <Th>Handed in</Th>
                            <Th>Files</Th>
                            <Th className="text-right">Marks</Th>
                            <Th>
                                <span className="sr-only">Review</span>
                            </Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const s = r.submission;
                            const files =
                                s?.files.map((f) => ({
                                    href: `/api/files/submission-file/${s.id}?i=${f.index}`,
                                    name: f.originalName,
                                    size: f.size,
                                })) ?? [];
                            return (
                                <tr key={r.studentObjectId} className="align-top hover:bg-paper/60">
                                    <Td>
                                        <span className="block font-semibold">{r.fullName}</span>
                                        <span className="block text-xs text-muted">
                                            <span className="font-mono">{r.studentId}</span> ·{" "}
                                            {r.batchLabel}
                                        </span>
                                        {!r.inScope && (
                                            <span className="mt-1 block text-xs font-medium text-gold-deep">
                                                {r.inactive
                                                    ? "Inactive student"
                                                    : "No longer in this audience"}
                                            </span>
                                        )}
                                    </Td>
                                    <Td>
                                        <SubmissionState status={r.status} />
                                    </Td>
                                    <Td className="whitespace-nowrap text-muted">
                                        {s ? formatDateTime(s.submittedAt) : "—"}
                                    </Td>
                                    <Td>
                                        {files.length ? (
                                            <ul className="space-y-1">
                                                {files.map((f) => (
                                                    <li key={f.href} className="max-w-60">
                                                        <a
                                                            href={f.href}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex max-w-full items-center gap-1.5 text-burgundy hover:underline"
                                                        >
                                                            <FileText
                                                                aria-hidden="true"
                                                                className="size-3.5 shrink-0"
                                                            />
                                                            <span className="truncate">
                                                                {f.name}
                                                            </span>
                                                        </a>
                                                        <span className="ml-5 block text-xs text-muted">
                                                            {kb(f.size)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </Td>
                                    <Td className="text-right font-semibold tabular-nums">
                                        {s?.marks ?? "—"}
                                    </Td>
                                    <Td className="text-right">
                                        {s && (
                                            <ReviewDialog
                                                action={reviewSubmissionAction.bind(
                                                    null,
                                                    aid,
                                                    s.id,
                                                )}
                                                studentName={r.fullName}
                                                feedback={s.feedback}
                                                marks={s.marks}
                                                reviewed={!!s.reviewedAt}
                                                files={files.map(({ href, name }) => ({
                                                    href,
                                                    name,
                                                }))}
                                            />
                                        )}
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-3">
                <Panel title="Rules">
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted">Late work</dt>
                            <dd className="font-medium">
                                {a.allowLate ? "Accepted, marked late" : "Not accepted"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted">Files</dt>
                            <dd className="font-medium">
                                Up to {a.maxFiles} × {a.maxFileSizeMB} MB
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted">Types</dt>
                            <dd className="text-right font-medium">
                                {a.allowedTypes
                                    .map((t) => SUBMISSION_FILE_LABELS[t]?.split(" ")[0] ?? t)
                                    .join(", ")}
                            </dd>
                        </div>
                    </dl>
                    {a.attachment && (
                        <a
                            href={`/api/files/assignment-attachment/${aid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-burgundy hover:underline"
                        >
                            <Paperclip aria-hidden="true" className="size-4" />
                            {a.attachment.originalName}
                        </a>
                    )}
                </Panel>
                <Panel
                    title={a.isPublished ? "Hide from students" : "Publish"}
                    description={
                        a.isPublished
                            ? "Students stop seeing it. Submitted work is kept."
                            : "Students in the audience will see it and can upload."
                    }
                >
                    <ActionForm
                        action={setAssignmentPublishedAction.bind(null, aid, !a.isPublished)}
                        label={a.isPublished ? "Hide" : "Publish now"}
                    />
                </Panel>
                <Panel
                    tone="danger"
                    title="Delete assignment"
                    description="Deletes the assignment, every submission and all uploaded files."
                >
                    <ActionForm
                        action={deleteAssignmentAction.bind(null, aid)}
                        label="Delete"
                        danger
                        confirm={{
                            title: `Delete “${a.title}”?`,
                            body: `${stats.submitted + stats.late} submission(s) and their files will be removed for good. Download the ZIP first if you need them.`,
                            confirmLabel: "Delete everything",
                        }}
                    />
                </Panel>
            </div>
        </>
    );
}
