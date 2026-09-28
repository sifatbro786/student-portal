import Link from "next/link";
import { Paperclip, Pin } from "lucide-react";
import { formatDate } from "@/lib/date.js";

/** Editorial list of notices (student side). `rows` from listNoticesForStudent. */
export function NoticeList({ rows }) {
    return (
        <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {rows.map((n) => (
                <li key={String(n._id)}>
                    <Link
                        href={`/dashboard/notices/${n._id}`}
                        className="group block px-4 py-4 transition-colors hover:bg-paper/60 sm:px-5"
                    >
                        <span className="flex items-center gap-2 text-xs text-muted">
                            {n.isPinned && (
                                <span className="inline-flex items-center gap-1 font-semibold text-gold-deep">
                                    <Pin aria-hidden="true" className="size-3" /> Pinned
                                </span>
                            )}
                            <time dateTime={new Date(n.publishAt).toISOString()}>
                                {formatDate(n.publishAt)}
                            </time>
                            {n.attachment && (
                                <Paperclip aria-label="Has attachment" className="size-3" />
                            )}
                        </span>
                        <span className="mt-1 block font-serif text-lg leading-snug font-medium group-hover:text-burgundy">
                            {n.title}
                        </span>
                        {n.excerpt && (
                            <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted">
                                {n.excerpt}
                            </span>
                        )}
                    </Link>
                </li>
            ))}
        </ol>
    );
}
