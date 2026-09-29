import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { getResultGrid } from "@/server/services/results.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { Button } from "@/components/ui/Button.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { ResultGrid } from "@/components/admin/ResultGrid.js";
import { CsvImport } from "@/components/admin/CsvImport.js";
import { formatDate } from "@/lib/date.js";
import {
    deleteExamAction,
    importResultsCsvAction,
    saveResultsAction,
    setExamPublishedAction,
} from "../actions.js";

export const metadata = { title: "Exam results" };

export default async function ExamPage({ params, searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const [{ examId }, sp] = await Promise.all([params, searchParams]);
    const id = objectId.safeParse(examId);
    if (!id.success) notFound();
    const { exam, rows, stats } = await getResultGrid(id.data).catch(() => notFound());
    const eid = String(exam._id);
    const maxGrade = Math.max(1, ...stats.grades.map((g) => g.n));

    return (
        <>
            <PageHeader
                back={{ href: "/admin/exams", label: "Exams & results" }}
                eyebrow={`${formatDate(exam.date)} · full marks ${exam.fullMarks}`}
                title={exam.title}
                actions={
                    <>
                        {exam.isPublished ? (
                            <StatusChip tone="success" className="self-center">
                                Published
                            </StatusChip>
                        ) : (
                            <StatusChip className="self-center">Hidden from students</StatusChip>
                        )}
                        <Button href={`/admin/exams/${eid}/edit`} variant="secondary">
                            <Pencil aria-hidden="true" className="size-4" /> Edit exam
                        </Button>
                    </>
                }
            />
            {sp.saved && (
                <Alert tone="success" className="mb-6">
                    Exam saved.
                </Alert>
            )}

            {/* FR-RES-05 — plain figures, no animated counters (PRD §13) */}
            <section
                aria-label="Statistics"
                className="mb-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.6fr)]"
            >
                {[
                    [
                        "Results",
                        stats.count ? `${stats.count} / ${rows.length}` : `0 / ${rows.length}`,
                    ],
                    ["Average", stats.avg === null ? "—" : `${stats.avg}%`],
                    ["Highest", stats.max === null ? "—" : `${stats.max}%`],
                    ["Lowest", stats.min === null ? "—" : `${stats.min}%`],
                ].map(([k, v]) => (
                    <div key={k} className="bg-surface px-4 py-3.5">
                        <p className="eyebrow text-[0.62rem] text-muted">{k}</p>
                        <p className="mt-1 font-serif text-2xl tabular-nums">{v}</p>
                    </div>
                ))}
                <div className="bg-surface px-4 py-3.5">
                    <p className="eyebrow text-[0.62rem] text-muted">Grades</p>
                    <dl className="mt-2 grid grid-cols-8 items-end gap-1.5 text-center">
                        {stats.grades.map((g) => (
                            <div key={g.grade}>
                                <div className="flex h-10 items-end justify-center">
                                    <span
                                        aria-hidden="true"
                                        className="w-full max-w-5 rounded-t-sm bg-burgundy/80"
                                        style={{ height: `${(g.n / maxGrade) * 100}%` }}
                                    />
                                </div>
                                <dt className="mt-1 text-[0.7rem] font-semibold">{g.grade}</dt>
                                <dd className="text-[0.7rem] text-muted tabular-nums">{g.n}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {rows.length === 0 ? (
                <p className="mb-10 rounded-lg border border-dashed border-line-strong p-6 text-sm text-muted">
                    No active students in these batches yet.
                </p>
            ) : (
                <div className="mb-10">
                    <ResultGrid
                        action={saveResultsAction.bind(null, eid)}
                        fullMarks={exam.fullMarks}
                        rows={rows}
                    />
                </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-3">
                <Panel title="Import from CSV" className="lg:col-span-1">
                    <CsvImport action={importResultsCsvAction.bind(null, eid)} />
                </Panel>
                <Panel
                    title={exam.isPublished ? "Hide results" : "Publish results"}
                    description={
                        exam.isPublished
                            ? "Students stop seeing this exam’s results."
                            : "Each student will see only their own marks, grade and remark."
                    }
                >
                    <ActionForm
                        action={setExamPublishedAction.bind(null, eid, !exam.isPublished)}
                        label={exam.isPublished ? "Hide" : "Publish now"}
                    />
                </Panel>
                <Panel
                    tone="danger"
                    title="Delete exam"
                    description="Deletes the exam and every result in it."
                >
                    <ActionForm
                        action={deleteExamAction.bind(null, eid)}
                        label="Delete"
                        danger
                        confirm={{
                            title: `Delete “${exam.title}”?`,
                            body: `${stats.count} result(s) will be removed for good.`,
                            confirmLabel: "Delete exam",
                        }}
                    />
                </Panel>
            </div>
        </>
    );
}
