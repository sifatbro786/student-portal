import { formatDate } from "@/lib/date.js";

/** One student's own results (FR-RES-04). `rows` from listResultsForStudent. */
export function ResultList({ rows }) {
    return (
        <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted">
                            <time dateTime={new Date(r.date).toISOString()}>
                                {formatDate(r.date)}
                            </time>
                        </p>
                        <p className="mt-0.5 font-serif text-lg leading-snug font-medium">
                            {r.title}
                        </p>
                        <p className="mt-1 text-sm">
                            <span className="font-semibold tabular-nums">
                                {r.marks} / {r.fullMarks}
                            </span>
                            <span className="text-muted"> · {r.percentage}%</span>
                        </p>
                        {r.remark && (
                            <p className="mt-1.5 border-l-2 border-gold pl-3 text-sm text-muted italic">
                                {r.remark}
                            </p>
                        )}
                    </div>
                    {r.grade && (
                        <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-burgundy bg-badge font-serif text-lg font-semibold text-ink">
                            {r.grade}
                            <span className="sr-only"> grade</span>
                        </span>
                    )}
                </li>
            ))}
        </ol>
    );
}
