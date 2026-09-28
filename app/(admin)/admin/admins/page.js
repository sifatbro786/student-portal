import Link from "next/link";
import { requireAuth } from "@/server/auth/guards.js";
import { listAdmins } from "@/server/services/admins.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { AdminForm } from "@/components/admin/forms/AdminForm.js";
import { formatDateTime } from "@/lib/date.js";
import { ROLE_LABELS } from "@/lib/constants.js";
import { createAdminAction } from "./actions.js";

export const metadata = { title: "Admins" };

export default async function AdminsPage() {
    const me = await requireAuth(["super_admin"]);
    const admins = await listAdmins({ id: me.id, role: me.role });

    return (
        <>
            <PageHeader
                eyebrow="Settings"
                title="Admins"
                description="Staff who can use this dashboard. Only super admins see this page."
            />
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <Table>
                    <thead>
                        <tr>
                            <Th>Name</Th>
                            <Th>Role</Th>
                            <Th>Last sign-in</Th>
                            <Th>Status</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map((a) => (
                            <tr key={String(a._id)} className="hover:bg-paper/60">
                                <Td>
                                    <Link
                                        href={`/admin/admins/${a._id}`}
                                        className="font-semibold hover:text-burgundy"
                                    >
                                        {a.name}
                                    </Link>
                                    {String(a._id) === me.id && (
                                        <span className="ml-2 text-xs text-muted">(you)</span>
                                    )}
                                    <span className="block text-xs text-muted">{a.email}</span>
                                </Td>
                                <Td>
                                    <StatusChip
                                        tone={a.role === "super_admin" ? "gold" : "neutral"}
                                    >
                                        {ROLE_LABELS[a.role]}
                                    </StatusChip>
                                </Td>
                                <Td className="text-muted">
                                    {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}
                                </Td>
                                <Td>
                                    {a.isActive ? (
                                        <StatusChip tone="success">Active</StatusChip>
                                    ) : (
                                        <StatusChip>Inactive</StatusChip>
                                    )}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Panel title="Add an admin">
                    <AdminForm action={createAdminAction} />
                </Panel>
            </div>
        </>
    );
}
