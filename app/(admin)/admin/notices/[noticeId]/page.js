import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards.js";
import { getNoticeAdmin, noticeState } from "@/server/services/notices.js";
import { classBatchOptions } from "@/server/services/academics.js";
import { objectId } from "@/server/validators/common.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Panel } from "@/components/ui/Panel.js";
import { Alert } from "@/components/ui/Alert.js";
import { ActionForm } from "@/components/ui/ActionForm.js";
import { NoticeState } from "@/components/admin/NoticeState.js";
import { NoticeForm } from "@/components/admin/forms/NoticeForm.js";
import { formatDateTime, toDhakaLocal } from "@/lib/date.js";
import { deleteNoticeAction } from "../actions.js";

export const metadata = { title: "Notice" };

export default async function NoticeEditPage({ params, searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const [{ noticeId }, sp] = await Promise.all([params, searchParams]);
    const id = objectId.safeParse(noticeId);
    if (!id.success) notFound();
    const n = await getNoticeAdmin(id.data).catch(() => notFound());
    const options = await classBatchOptions({ includeInactive: true });
    const nid = String(n._id);
    const emailed = /^emailed-(\d+)$/.exec(sp.saved ?? "")?.[1];

    // Plain values only across the client boundary.
    const initial = {
        id: nid,
        title: n.title,
        body: n.body,
        audience: n.audience,
        classes: n.classes.map(String),
        batches: n.batches.map(String),
        isPinned: n.isPinned,
        publishAt: toDhakaLocal(n.publishAt),
        expiresAt: toDhakaLocal(n.expiresAt),
        emailedAt: n.emailedAt ? formatDateTime(n.emailedAt) : null,
        attachment: n.attachment ? { originalName: n.attachment.originalName } : null,
    };

    return (
        <>
            <PageHeader
                back={{ href: "/admin/notices", label: "Notices" }}
                eyebrow={`Published ${formatDateTime(n.publishAt)}`}
                title={n.title}
                actions={<NoticeState state={noticeState(n)} />}
            />
            {sp.saved && (
                <Alert tone="success" className="mb-6">
                    Notice saved.
                    {emailed
                        ? ` Email queued for ${emailed} student${emailed === "1" ? "" : "s"}.`
                        : ""}
                </Alert>
            )}
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
                    <NoticeForm options={options} initial={initial} />
                </div>
                <div className="space-y-6">
                    <Panel
                        tone="danger"
                        title="Delete notice"
                        description="Removes it for everyone, including its attachment."
                    >
                        <ActionForm
                            action={deleteNoticeAction.bind(null, nid)}
                            label="Delete notice"
                            danger
                            confirm={{
                                title: "Delete this notice?",
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
