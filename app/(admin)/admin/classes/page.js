import Link from "next/link";
import { ChevronRight, Layers } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listClassesWithStats } from "@/server/services/academics.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { ClassForm } from "@/components/admin/forms/ClassForm.js";
import { createClassAction } from "./actions.js";

export const metadata = { title: "Classes & batches" };

export default async function ClassesPage() {
    await requireAuth(["super_admin", "admin"]);
    const classes = await listClassesWithStats();

    return (
        <>
            <PageHeader
                eyebrow="Academics"
                title="Classes & batches"
                description="A class is a level (e.g. Class 9). Each class has batches — A, B, C… — with their own days and time."
            />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div>
                    {classes.length === 0 ? (
                        <EmptyState icon={Layers} title="No classes yet">
                            Start by adding your first class on the right. Batches are added inside
                            each class.
                        </EmptyState>
                    ) : (
                        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                            {classes.map((c) => (
                                <li key={String(c._id)}>
                                    <Link
                                        href={`/admin/classes/${c._id}`}
                                        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper/70"
                                    >
                                        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/50 font-serif text-lg text-burgundy">
                                            {c.name.match(/\d+/)?.[0] ?? c.name[0]}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2">
                                                <span className="font-serif text-lg font-medium">
                                                    {c.name}
                                                </span>
                                                {!c.isActive && <StatusChip>Inactive</StatusChip>}
                                            </span>
                                            <span className="mt-0.5 block text-sm text-muted">
                                                {c.batchCount}{" "}
                                                {c.batchCount === 1 ? "batch" : "batches"} ·{" "}
                                                {c.activeStudents} active{" "}
                                                {c.activeStudents === 1 ? "student" : "students"}
                                            </span>
                                        </span>
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="size-5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-burgundy"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Panel title="Add a class" className="h-fit">
                    <ClassForm action={createClassAction} submitLabel="Add class" />
                </Panel>
            </div>
        </>
    );
}
