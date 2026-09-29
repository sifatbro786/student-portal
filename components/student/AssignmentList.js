import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AssignmentStatus } from "./AssignmentStatus.js";
import { Countdown } from "./Countdown.js";
import { ASSIGNMENT_TYPE_LABELS } from "@/lib/constants.js";
import { formatDateTime } from "@/lib/date.js";

/** Student-side assignment cards. `rows` from listAssignmentsForStudent (server). */
export function AssignmentList({ rows, serverNow }) {
    return (
        <ul className="grid gap-3">
            {rows.map((a) => (
                <li key={String(a._id)}>
                    <Link
                        href={`/dashboard/assignments/${a._id}`}
                        className="group flex items-center gap-4 rounded-lg border border-line bg-surface p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold"
                    >
                        <span className="min-w-0 flex-1">
                            <span className="eyebrow text-[0.62rem] text-gold-deep">
                                {ASSIGNMENT_TYPE_LABELS[a.type]}
                            </span>
                            <span className="mt-0.5 block font-serif text-lg leading-snug font-medium group-hover:text-burgundy">
                                {a.title}
                            </span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
                                <AssignmentStatus status={a.status} />
                                <span>Due {formatDateTime(a.deadline)}</span>
                                {a.upcoming && a.status === "not_submitted" && (
                                    <Countdown
                                        deadline={new Date(a.deadline).toISOString()}
                                        serverNow={serverNow}
                                    />
                                )}
                                {a.marks !== null && (
                                    <span className="font-semibold text-ink">Marks: {a.marks}</span>
                                )}
                            </span>
                        </span>
                        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
