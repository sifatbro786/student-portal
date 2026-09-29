import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Paperclip } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import {
    getAssignmentForStudent,
    getOwnSubmission,
    studentStatus,
    submissionWindow,
} from "@/server/services/assignments.js";
import { objectId } from "@/server/validators/common.js";
import { AssignmentStatus } from "@/components/student/AssignmentStatus.js";
import { Countdown } from "@/components/student/Countdown.js";
import { SubmitWork } from "@/components/student/SubmitWork.js";
import { ASSIGNMENT_TYPE_LABELS } from "@/lib/constants.js";
import { formatDateTime } from "@/lib/date.js";

export const metadata = { title: "Assignment" };

const size = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

export default async function StudentAssignmentPage({ params }) {
    const scope = await getStudentScope();
    const id = objectId.safeParse((await params).assignmentId);
    if (!id.success) notFound();
    const a = await getAssignmentForStudent(id.data, scope);
    if (!a) notFound(); // other batch or unpublished — same 404 (SEC-10)
    const sub = await getOwnSubmission(id.data, scope); // own only (FR-ASG-07)

    const now = new Date();
    const status = studentStatus(a, sub, now);
    const win = submissionWindow(a, now);
    const aid = String(a._id);
    const hasFeedback = sub && (sub.feedback || sub.marks !== undefined);

    return (
        <article className="space-y-8">
            <div>
                <Link
                    href="/dashboard/assignments"
                    className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-burgundy"
                >
                    <ArrowLeft aria-hidden="true" className="size-4" /> Assignments
                </Link>
                <p className="eyebrow text-gold-deep">{ASSIGNMENT_TYPE_LABELS[a.type]}</p>
                <h1 className="mt-2 text-3xl leading-tight font-medium tracking-tight">
                    {a.title}
                </h1>
                <span className="gold-rule mt-4" />
            </div>

            {/* Deadline strip */}
            <section
                aria-label="Deadline"
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3.5"
            >
                <div>
                    <p className="text-xs text-muted">Due</p>
                    <p className="font-semibold">{formatDateTime(a.deadline)}</p>
                    {now < a.deadline ? (
                        <Countdown
                            deadline={a.deadline.toISOString()}
                            serverNow={now.toISOString()}
                            className="text-sm"
                        />
                    ) : (
                        <p className="text-sm text-muted">
                            {a.allowLate ? "Late work is still accepted." : "Deadline passed."}
                        </p>
                    )}
                </div>
                <AssignmentStatus status={status} />
            </section>

            {(a.instructions || a.attachment) && (
                <section aria-label="Instructions">
                    {/* Sanitised on save (server/sanitize.js) — never raw input (SEC-08) */}
                    {a.instructions && (
                        <div
                            className="prose-notice"
                            dangerouslySetInnerHTML={{ __html: a.instructions }}
                        />
                    )}
                    {a.attachment && (
                        <a
                            href={`/api/files/assignment-attachment/${aid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-surface p-4 hover:border-gold"
                        >
                            <Paperclip aria-hidden="true" className="size-5 text-burgundy" />
                            <span className="min-w-0">
                                <span className="block truncate font-semibold">
                                    {a.attachment.originalName}
                                </span>
                                <span className="text-xs text-muted">Open attachment</span>
                            </span>
                        </a>
                    )}
                </section>
            )}

            {hasFeedback && (
                <section
                    aria-labelledby="fb-h"
                    className="rounded-lg border border-line bg-surface p-5"
                >
                    <div className="flex items-baseline justify-between gap-4">
                        <h2 id="fb-h" className="text-xl font-medium">
                            Teacher’s feedback
                        </h2>
                        {sub.marks !== undefined && (
                            <p className="font-serif text-2xl text-burgundy">
                                {sub.marks}
                                <span className="ml-1 font-sans text-xs text-muted">marks</span>
                            </p>
                        )}
                    </div>
                    {sub.feedback && (
                        <blockquote className="mt-3 border-l-2 border-gold pl-4 font-serif text-lg leading-relaxed whitespace-pre-line italic">
                            {sub.feedback}
                        </blockquote>
                    )}
                </section>
            )}

            <section aria-labelledby="work-h" className="space-y-4">
                <h2 id="work-h" className="text-xl font-medium">
                    Your work
                </h2>
                {sub ? (
                    <div className="rounded-lg border border-line bg-surface">
                        <p className="border-b border-line px-4 py-3 text-sm">
                            Handed in <strong>{formatDateTime(sub.submittedAt)}</strong>
                            {sub.isLate && <span className="text-gold-deep"> · late</span>}
                        </p>
                        <ul className="divide-y divide-line">
                            {sub.files.map((f, i) => (
                                <li key={`${i}-${f.sha256}`}>
                                    <a
                                        href={`/api/files/submission-file/${sub._id}?i=${i}&download=1`}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-paper/60"
                                    >
                                        <Download
                                            aria-hidden="true"
                                            className="size-4 shrink-0 text-burgundy"
                                        />
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                            {f.originalName}
                                        </span>
                                        <span className="text-xs text-muted">{size(f.size)}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    !win.open && (
                        <p className="rounded-lg border border-dashed border-line-strong p-5 text-sm text-muted">
                            Submissions for this assignment are closed.
                        </p>
                    )
                )}

                {sub?.reviewedAt ? (
                    <p className="text-sm text-muted">
                        Your teacher has reviewed this, so it’s final and can’t be changed.
                    </p>
                ) : (
                    win.open && (
                        <SubmitWork
                            assignmentId={aid}
                            maxFiles={a.maxFiles}
                            maxFileSizeMB={a.maxFileSizeMB}
                            allowedTypes={[...a.allowedTypes]}
                            hasSubmission={!!sub}
                            late={win.isLate}
                        />
                    )
                )}
            </section>
        </article>
    );
}
