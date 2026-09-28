import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, UserPlus } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { getAdmission } from "@/server/services/admissions.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Button } from "@/components/ui/Button.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { AdmissionStatus } from "@/components/admin/AdmissionStatus.js";
import { ReviewForm, VerifyScoreForm } from "@/components/admin/forms/AdmissionForms.js";
import { formatDateTime } from "@/lib/date.js";
import { formatPhone, scheduleLabel } from "@/lib/format.js";
import { deleteAdmissionAction, reviewAdmissionAction, verifyScoreAction } from "../actions.js";

export const metadata = { title: "Application" };

function Group({ title, rows }) {
    return (
        <div>
            <h3 className="eyebrow text-[0.65rem] text-gold-deep">{title}</h3>
            <dl className="mt-3 divide-y divide-line/70">
                {rows.map(([k, v]) => (
                    <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr]">
                        <dt className="text-sm text-muted">{k}</dt>
                        <dd className="text-sm font-medium wrap-break-word">{v || "—"}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default async function AdmissionDetailPage({ params }) {
    await requireAuth(["super_admin", "admin"]);
    const { admissionId } = await params;
    const id = objectId.safeParse(admissionId);
    if (!id.success) notFound();
    const a = await getAdmission(id.data).catch(() => notFound());
    const aid = String(a._id);
    const converted = !!a.student;

    return (
        <>
            <PageHeader
                back={{ href: "/admin/admissions", label: "Admissions" }}
                eyebrow={a.refNo}
                title={a.fullName}
                description={`Applied ${formatDateTime(a.createdAt)} for ${a.class?.name ?? "—"}`}
                actions={<AdmissionStatus status={a.status} converted={converted} />}
            />

            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <Panel>
                    <div className="flex flex-col gap-8 sm:flex-row">
                        <div className="shrink-0">
                            <div className="relative size-40 overflow-hidden rounded-full border-4 border-burgundy ring-4 ring-surface">
                                <Image
                                    src={`/api/files/admission-photo/${aid}`}
                                    alt={`Photo of ${a.fullName}`}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>
                            <a
                                href={`/api/files/admission-photo/${aid}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 block text-center text-xs font-semibold text-burgundy hover:underline"
                            >
                                Open full photo
                            </a>
                        </div>
                        <div className="min-w-0 flex-1 space-y-8">
                            <Group
                                title="Student"
                                rows={[
                                    ["Class", a.class?.name],
                                    [
                                        "Preferred batch",
                                        a.preferredBatch
                                            ? `Batch ${a.preferredBatch.name} · ${scheduleLabel(a.preferredBatch.schedule)}`
                                            : "No preference",
                                    ],
                                    [
                                        "Studies at",
                                        a.institution?.type === "school"
                                            ? a.institution.name
                                            : "Private candidate",
                                    ],
                                ]}
                            />
                            <Group
                                title="Contact"
                                rows={[
                                    [
                                        "WhatsApp",
                                        <a
                                            key="w"
                                            className="hover:text-burgundy"
                                            href={`https://wa.me/${a.whatsapp}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {formatPhone(a.whatsapp)}
                                        </a>,
                                    ],
                                    [
                                        "Email",
                                        <a
                                            key="e"
                                            className="hover:text-burgundy"
                                            href={`mailto:${a.email}`}
                                        >
                                            {a.email}
                                        </a>,
                                    ],
                                    ["Address", a.address],
                                ]}
                            />
                            <Group
                                title="Parents"
                                rows={[
                                    [
                                        "Father",
                                        [a.father?.name, formatPhone(a.father?.phone)]
                                            .filter(Boolean)
                                            .join(" · "),
                                    ],
                                    [
                                        "Mother",
                                        [a.mother?.name, formatPhone(a.mother?.phone)]
                                            .filter(Boolean)
                                            .join(" · "),
                                    ],
                                ]}
                            />
                            <Group
                                title="Admission test"
                                rows={[
                                    ["Applicant’s score", `${a.scoreSubmitted}%`],
                                    [
                                        "Verified score",
                                        a.scoreVerified != null
                                            ? `${a.scoreVerified}%`
                                            : "Not verified yet",
                                    ],
                                ]}
                            />
                            {a.reviewedAt && (
                                <p className="text-xs text-muted">
                                    Last reviewed {formatDateTime(a.reviewedAt)} by{" "}
                                    {a.reviewedBy?.name ?? "—"}
                                    {a.statusNote ? ` — “${a.statusNote}”` : ""}
                                </p>
                            )}
                        </div>
                    </div>
                </Panel>

                <div className="space-y-6">
                    {converted ? (
                        <Panel title="Student account">
                            <p className="text-sm text-muted">This application is now a student.</p>
                            <Link
                                href={`/admin/students/${a.student._id}`}
                                className="mt-3 inline-flex items-center gap-1.5 font-semibold text-burgundy hover:underline"
                            >
                                {a.student.fullName} ·{" "}
                                <span className="font-mono">{a.student.studentId}</span>
                                <ArrowRight aria-hidden="true" className="size-4" />
                            </Link>
                        </Panel>
                    ) : (
                        <>
                            {a.status === "approved" && (
                                <Panel
                                    title="Create the student account"
                                    description="Opens the student form already filled in. You only pick the batch and a temporary password."
                                >
                                    <Button
                                        href={`/admin/students/new?admission=${aid}`}
                                        className="w-full"
                                    >
                                        <UserPlus aria-hidden="true" className="size-4" /> Convert
                                        to student
                                    </Button>
                                </Panel>
                            )}
                            <Panel title="Decision">
                                <ReviewForm
                                    action={reviewAdmissionAction.bind(null, aid)}
                                    status={a.status}
                                    note={a.statusNote}
                                />
                            </Panel>
                            <Panel title="Verify test score">
                                <VerifyScoreForm
                                    action={verifyScoreAction.bind(null, aid)}
                                    submitted={a.scoreSubmitted}
                                    verified={a.scoreVerified}
                                />
                            </Panel>
                        </>
                    )}
                    <Panel
                        tone="danger"
                        title="Delete application"
                        description="Removes the application and its photo for good."
                    >
                        <ActionForm
                            action={deleteAdmissionAction.bind(null, aid)}
                            label="Delete application"
                            danger
                            confirm={{
                                title: `Delete ${a.refNo}?`,
                                body: converted
                                    ? "The student account stays; only the application is removed."
                                    : "This cannot be undone.",
                                confirmLabel: "Delete",
                            }}
                        />
                    </Panel>
                </div>
            </div>
        </>
    );
}
