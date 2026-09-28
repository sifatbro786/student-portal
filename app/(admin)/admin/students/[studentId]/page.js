import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards.js";
import { getStudentDetail } from "@/server/services/students.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { Alert } from "@/components/ui/Alert.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { StudentForm } from "@/components/admin/forms/StudentForm.js";
import {
    ChangeBatchForm,
    PurgeStudentForm,
    ResetPasswordForm,
} from "@/components/admin/forms/StudentSideForms.js";
import { formatDate, formatDateTime } from "@/lib/date.js";
import { scheduleLabel, studentFormValues } from "@/lib/format.js";
import {
    changeBatchAction,
    purgeStudentAction,
    resetStudentPasswordAction,
    setStudentActiveAction,
    updateStudentAction,
} from "../actions.js";

export const metadata = { title: "Student" };

export default async function StudentDetailPage({ params, searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const [{ studentId: rawId }, sp] = await Promise.all([params, searchParams]);
    const id = objectId.safeParse(rawId);
    if (!id.success) notFound();
    const s = await getStudentDetail(id.data).catch(() => notFound());
    const options = await classBatchOptions();
    const sid = String(s._id);
    const active = s.status === "active";

    return (
        <>
            <PageHeader
                back={{ href: "/admin/students", label: "Students" }}
                eyebrow={s.studentId}
                title={s.fullName}
                description={`${s.class?.name} · Batch ${s.batch?.name} · ${scheduleLabel(s.batch?.schedule)}`}
                actions={
                    active ? (
                        <StatusChip tone="success">Active</StatusChip>
                    ) : (
                        <StatusChip>Inactive</StatusChip>
                    )
                }
            />

            {sp.created === "1" && (
                <Alert tone="success" className="mb-6">
                    Student created with ID <strong className="font-mono">{s.studentId}</strong>.
                    Share the temporary password in person — they’ll be asked to change it at first
                    sign-in.
                </Alert>
            )}
            {!active && (
                <Alert tone="info" className="mb-6">
                    This student is inactive: they can’t sign in and no new fee months are created.
                    All history is kept.
                </Alert>
            )}

            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <Panel title="Profile">
                    <StudentForm
                        action={updateStudentAction.bind(null, sid)}
                        mode="edit"
                        initial={studentFormValues(s)}
                    />
                </Panel>

                <div className="space-y-6">
                    <Panel title="Account">
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                            <dt className="text-muted">Joined</dt>
                            <dd>{formatDate(s.admittedAt)}</dd>
                            <dt className="text-muted">Last sign-in</dt>
                            <dd>
                                {s.user?.lastLoginAt ? formatDateTime(s.user.lastLoginAt) : "Never"}
                            </dd>
                            <dt className="text-muted">Password</dt>
                            <dd>
                                {s.user?.mustChangePassword
                                    ? "Temporary — not changed yet"
                                    : "Set by student"}
                            </dd>
                        </dl>
                    </Panel>

                    <Panel
                        title="Change batch"
                        description="History is kept; past fee months keep the old batch."
                    >
                        <ChangeBatchForm
                            action={changeBatchAction.bind(null, sid)}
                            options={options}
                            currentClassId={String(s.class?._id)}
                            currentBatchId={String(s.batch?._id)}
                        />
                        {s.history.length > 0 && (
                            <ol className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
                                {s.history.map((h) => (
                                    <li key={String(h._id)}>
                                        <span className="font-medium">
                                            {h.fromClass?.name} {h.fromBatch?.name} →{" "}
                                            {h.toClass?.name} {h.toBatch?.name}
                                        </span>
                                        <span className="block text-xs text-muted">
                                            {formatDateTime(h.at)} · {h.changedBy?.name ?? "—"}
                                            {h.reason ? ` · ${h.reason}` : ""}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Panel>

                    <Panel title="Reset password">
                        <ResetPasswordForm action={resetStudentPasswordAction.bind(null, sid)} />
                    </Panel>

                    <Panel
                        title={active ? "Deactivate" : "Reactivate"}
                        description={
                            active
                                ? "Blocks sign-in immediately. Everything is kept and can be restored."
                                : "Restores sign-in. Their batch must be active."
                        }
                    >
                        <ActionForm
                            action={setStudentActiveAction.bind(null, sid, !active)}
                            label={active ? "Deactivate student" : "Reactivate student"}
                            confirm={
                                active
                                    ? {
                                          title: `Deactivate ${s.fullName}?`,
                                          body: "They will be signed out right away.",
                                          confirmLabel: "Deactivate",
                                      }
                                    : undefined
                            }
                        />
                    </Panel>

                    <Panel
                        tone="danger"
                        title="Delete permanently"
                        description="Only when the student or guardian asks for their data to be erased."
                    >
                        <PurgeStudentForm
                            action={purgeStudentAction.bind(null, sid)}
                            studentId={s.studentId}
                            honorCount={s.honorCount}
                        />
                    </Panel>
                </div>
            </div>
        </>
    );
}
