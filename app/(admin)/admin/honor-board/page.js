import Link from "next/link";
import { Award, Plus } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listHonorAdmin, listHonorYears } from "@/server/services/honor.js";
import { getPublicHonorBoard } from "@/server/services/honor-public.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Button } from "@/components/ui/Button.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { cx } from "@/components/ui/cx.js";
import { HonorOrderList } from "@/components/admin/HonorOrderList.js";
import { HonorFromStudentForm, HonorYearForm } from "@/components/admin/forms/HonorSideForms.js";
import { HonorCard } from "@/components/public/HonorCard.js";
import { addHonorFromStudentAction, reorderHonorAction, saveHonorYearAction } from "./actions.js";

export const metadata = { title: "Honor board" };

export default async function HonorBoardAdminPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const years = await listHonorYears();
    const y = Number(sp.year);
    const year = Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : years[0];
    const [board, pub] = await Promise.all([listHonorAdmin(year), getPublicHonorBoard(year)]);
    const tabs = years.includes(year) ? years : [year, ...years].sort((a, b) => b - a);
    const entries = board.entries.map((e) => ({
        id: String(e._id),
        name: e.name,
        grade: e.grade,
        percentage: e.percentage,
        thumbUrl: e.thumbUrl,
        isPublished: e.isPublished,
        consentConfirmed: e.consentConfirmed,
    }));
    const preview = pub.year === year ? pub.entries : [];

    return (
        <>
            <PageHeader
                eyebrow="Website"
                title="Honor board"
                description="The “Circle of Excellence” on the public website. Names and photos are stored on each entry, so they stay even if a student record is deleted."
                actions={
                    <Button href={`/admin/honor-board/new?year=${year}`}>
                        <Plus aria-hidden="true" className="size-4" /> Add entry
                    </Button>
                }
            />
            {sp.saved && (
                <Alert tone="success" className="mb-6">
                    Saved — the public board is updated.
                </Alert>
            )}
            {sp.deleted && (
                <Alert tone="success" className="mb-6">
                    Entry deleted.
                </Alert>
            )}

            {/* Year tabs styled like index tabs (PRD §13) */}
            <nav aria-label="Year" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
                {tabs.map((t) => (
                    <Link
                        key={t}
                        href={`/admin/honor-board?year=${t}`}
                        aria-current={t === year ? "page" : undefined}
                        className={cx(
                            "-mb-px shrink-0 rounded-t-md border border-b-0 px-4 py-2.5 font-serif text-base tabular-nums transition-colors",
                            t === year
                                ? "border-line bg-surface text-burgundy"
                                : "border-transparent text-muted hover:text-ink",
                        )}
                    >
                        {t}
                    </Link>
                ))}
                <Link
                    href={`/admin/honor-board?year=${Math.max(...tabs) + 1}`}
                    className="-mb-px shrink-0 px-4 py-2.5 text-sm font-semibold text-muted hover:text-burgundy"
                >
                    + {Math.max(...tabs) + 1}
                </Link>
            </nav>

            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-8">
                    <section aria-labelledby="order-h">
                        <div className="mb-3 flex items-baseline justify-between gap-4">
                            <h2 id="order-h" className="text-xl font-medium">
                                {board.heading} — {year}
                            </h2>
                            <span className="text-sm text-muted">
                                {entries.length} {entries.length === 1 ? "entry" : "entries"}
                            </span>
                        </div>
                        {entries.length ? (
                            <HonorOrderList
                                // remount when entries are added/removed, not when reordered
                                key={entries
                                    .map((e) => e.id)
                                    .sort()
                                    .join()}
                                action={reorderHonorAction.bind(null, year)}
                                entries={entries}
                            />
                        ) : (
                            <EmptyState
                                icon={Award}
                                title={`Nothing for ${year} yet`}
                                action={
                                    <Button href={`/admin/honor-board/new?year=${year}`}>
                                        Add the first achiever
                                    </Button>
                                }
                            >
                                Add entries one by one, or copy them from a student record.
                            </EmptyState>
                        )}
                    </section>

                    <section aria-labelledby="preview-h">
                        <h2 id="preview-h" className="text-xl font-medium">
                            Public preview
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            Exactly what visitors see: published entries only; photos only with
                            consent.
                        </p>
                        <div className="grain mt-4 rounded-lg border border-line bg-surface px-4 py-10 sm:px-8">
                            <p className="eyebrow text-center text-gold-deep">
                                {pub.subheading || board.subheading}
                            </p>
                            <p className="mt-2 text-center font-serif text-3xl">
                                {pub.heading || board.heading}
                            </p>
                            <span className="gold-rule mx-auto mt-4" />
                            {preview.length ? (
                                <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                                    {preview.map((e) => (
                                        <li key={e.id}>
                                            <HonorCard {...e} photoUrl={e.photoUrl} size="sm" />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-8 text-center text-sm text-muted">
                                    Nothing published for {year}.
                                </p>
                            )}
                            <p className="mt-10 text-center text-[0.7rem] font-bold tracking-[0.2em] text-muted uppercase">
                                Instructor: Tauhid Mostafa
                            </p>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <Panel
                        title="Add from a student"
                        description="Copies name, school and photo. With a photo it starts hidden until you tick consent."
                    >
                        <HonorFromStudentForm action={addHonorFromStudentAction} year={year} />
                    </Panel>
                    <Panel title="Heading for this year">
                        <HonorYearForm
                            key={year}
                            action={saveHonorYearAction}
                            year={year}
                            heading={board.heading}
                            subheading={board.subheading}
                        />
                    </Panel>
                </div>
            </div>
        </>
    );
}
