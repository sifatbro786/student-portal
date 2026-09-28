import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards.js";
import { getAdmin } from "@/server/services/admins.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { AdminForm } from "@/components/admin/forms/AdminForm.js";
import { ResetPasswordForm } from "@/components/admin/forms/StudentSideForms.js";
import { ROLE_LABELS } from "@/lib/constants.js";
import {
    deleteAdminAction,
    resetAdminPasswordAction,
    setAdminActiveAction,
    updateAdminAction,
} from "../actions.js";

export const metadata = { title: "Admin" };

export default async function AdminDetailPage({ params }) {
    const me = await requireAuth(["super_admin"]);
    const { adminId } = await params;
    const id = objectId.safeParse(adminId);
    if (!id.success) notFound();
    const a = await getAdmin(id.data, { id: me.id, role: me.role }).catch(() => notFound());
    const aid = String(a._id);
    const isMe = aid === me.id;

    return (
        <>
            <PageHeader
                back={{ href: "/admin/admins", label: "Admins" }}
                eyebrow={ROLE_LABELS[a.role]}
                title={a.name}
                description={a.email}
                actions={
                    a.isActive ? (
                        <StatusChip tone="success">Active</StatusChip>
                    ) : (
                        <StatusChip>Inactive</StatusChip>
                    )
                }
            />
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <Panel title="Details">
                    <AdminForm
                        action={updateAdminAction.bind(null, aid)}
                        initial={{ name: a.name, email: a.email, role: a.role }}
                        lockRole={isMe}
                    />
                </Panel>
                {isMe ? (
                    <Panel title="This is your account">
                        <p className="text-sm leading-relaxed text-muted">
                            Use “Change password” in the sidebar for your own password. You can’t
                            deactivate or delete yourself.
                        </p>
                    </Panel>
                ) : (
                    <div className="space-y-6">
                        <Panel title="Reset password">
                            <ResetPasswordForm
                                action={resetAdminPasswordAction.bind(null, aid)}
                                who="They"
                            />
                        </Panel>
                        <Panel title={a.isActive ? "Deactivate" : "Reactivate"}>
                            <ActionForm
                                action={setAdminActiveAction.bind(null, aid, !a.isActive)}
                                label={a.isActive ? "Deactivate admin" : "Reactivate admin"}
                                confirm={
                                    a.isActive
                                        ? {
                                              title: `Deactivate ${a.name}?`,
                                              body: "They are signed out immediately.",
                                              confirmLabel: "Deactivate",
                                          }
                                        : undefined
                                }
                            />
                        </Panel>
                        <Panel
                            tone="danger"
                            title="Delete admin"
                            description="Prefer deactivating — it keeps their name on past actions."
                        >
                            <ActionForm
                                action={deleteAdminAction.bind(null, aid)}
                                label="Delete admin"
                                danger
                                confirm={{
                                    title: `Delete ${a.name}?`,
                                    body: "This cannot be undone.",
                                    confirmLabel: "Delete",
                                }}
                            />
                        </Panel>
                    </div>
                )}
            </div>
        </>
    );
}
