import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { getClass, listBatchesOfClass } from "@/server/services/academics.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { ClassForm } from "@/components/admin/forms/ClassForm.js";
import { BatchForm } from "@/components/admin/forms/BatchForm.js";
import { scheduleLabel } from "@/lib/format.js";
import { createBatchAction, deleteClassAction, updateClassAction } from "../actions.js";

export async function generateMetadata({ params }) {
    const { classId } = await params;
    const id = objectId.safeParse(classId);
    if (!id.success) return {};
    const c = await getClass(id.data).catch(() => null);
    return { title: c?.name ?? "Class" };
}

export default async function ClassDetailPage({ params }) {
    await requireAuth(["super_admin", "admin"]);
    const { classId } = await params;
    const id = objectId.safeParse(classId);
    if (!id.success) notFound();
    const cls = await getClass(id.data).catch(() => notFound());
    const batches = await listBatchesOfClass(id.data);
    const cid = String(cls._id);

    return (
        <>
            <PageHeader
                back={{ href: "/admin/classes", label: "All classes" }}
                eyebrow="Class"
                title={cls.name}
                description={`${batches.length} ${batches.length === 1 ? "batch" : "batches"}. Open a batch to change its schedule.`}
                actions={!cls.isActive && <StatusChip>Inactive</StatusChip>}
            />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="space-y-8">
                    <section aria-labelledby="batches-h">
                        <h2 id="batches-h" className="mb-3 text-xl font-medium">
                            Batches
                        </h2>
                        {batches.length === 0 ? (
                            <EmptyState icon={CalendarDays} title="No batches in this class">
                                Add batch A with its days and time using the form below.
                            </EmptyState>
                        ) : (
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {batches.map((b) => (
                                    <li key={String(b._id)}>
                                        <Link
                                            href={`/admin/batches/${b._id}`}
                                            className="group block h-full rounded-lg border border-line bg-surface p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold"
                                        >
                                            <span className="flex items-start justify-between gap-3">
                                                <span className="font-serif text-2xl font-medium text-burgundy">
                                                    Batch {b.name}
                                                </span>
                                                {b.isActive ? (
                                                    <StatusChip tone="success">Active</StatusChip>
                                                ) : (
                                                    <StatusChip>Inactive</StatusChip>
                                                )}
                                            </span>
                                            <span className="mt-2 block text-sm text-ink/85">
                                                {scheduleLabel(b.schedule)}
                                            </span>
                                            <span className="mt-3 flex items-center justify-between text-sm text-muted">
                                                <span>
                                                    {b.activeStudents} active{" "}
                                                    {b.activeStudents === 1
                                                        ? "student"
                                                        : "students"}
                                                    {b.room ? ` · Room ${b.room}` : ""}
                                                </span>
                                                <ChevronRight
                                                    aria-hidden="true"
                                                    className="size-4 transition-transform group-hover:translate-x-0.5"
                                                />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <Panel
                        title="Add a batch"
                        description="Batch names must be unique inside this class."
                    >
                        <BatchForm
                            action={createBatchAction.bind(null, cid)}
                            submitLabel="Add batch"
                        />
                    </Panel>
                </div>

                <div className="space-y-6">
                    <Panel title="Class details">
                        <ClassForm
                            action={updateClassAction.bind(null, cid)}
                            initial={{ name: cls.name, order: cls.order, isActive: cls.isActive }}
                        />
                    </Panel>
                    <Panel
                        tone="danger"
                        title="Delete class"
                        description="Only possible while the class has no batches and no students. Otherwise, untick “Active”."
                    >
                        <ActionForm
                            action={deleteClassAction.bind(null, cid)}
                            label="Delete class"
                            danger
                            confirm={{
                                title: `Delete ${cls.name}?`,
                                body: "This cannot be undone.",
                                confirmLabel: "Delete",
                            }}
                        />
                    </Panel>
                </div>
            </div>
        </>
    );
}
