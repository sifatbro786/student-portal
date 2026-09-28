import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { getNoticeForStudent } from "@/server/services/notices.js";
import { objectId } from "@/server/validators/common.js";
import { formatDateTime } from "@/lib/date.js";

export const metadata = { title: "Notice" };

export default async function StudentNoticePage({ params }) {
    const scope = await getStudentScope();
    const id = objectId.safeParse((await params).noticeId);
    if (!id.success) notFound();
    const n = await getNoticeForStudent(id.data, scope);
    if (!n) notFound(); // out of scope, unpublished or expired — same 404 (SEC-10)

    return (
        <article>
            <Link
                href="/dashboard/notices"
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-burgundy"
            >
                <ArrowLeft aria-hidden="true" className="size-4" /> Notices
            </Link>
            <p className="eyebrow text-gold-deep">{formatDateTime(n.publishAt)}</p>
            <h1 className="mt-2 text-3xl leading-tight font-medium tracking-tight">{n.title}</h1>
            <span className="gold-rule mt-4" />
            {/* Sanitised on save (server/sanitize.js) — never raw input (SEC-08) */}
            <div className="prose-notice mt-6" dangerouslySetInnerHTML={{ __html: n.body }} />
            {n.attachment && (
                <a
                    href={`/api/files/notice-attachment/${n._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 flex items-center gap-3 rounded-lg border border-line bg-surface p-4 hover:border-gold"
                >
                    <Paperclip aria-hidden="true" className="size-5 text-burgundy" />
                    <span className="min-w-0">
                        <span className="block truncate font-semibold">
                            {n.attachment.originalName}
                        </span>
                        <span className="text-xs text-muted">Open attachment</span>
                    </span>
                </a>
            )}
        </article>
    );
}
