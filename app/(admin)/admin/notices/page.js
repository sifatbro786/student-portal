import Link from "next/link";
import { Megaphone, Paperclip, Pin, Plus, Search } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { listNoticesAdmin } from "@/server/services/notices.js";
import { listQuery } from "@/server/validators/common.js";
import { contentListQuery } from "@/server/validators/content.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Button, buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { selectClass } from "@/components/ui/Select.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { Alert } from "@/components/ui/Alert.js";
import { NoticeState } from "@/components/admin/NoticeState.js";
import { formatDateTime } from "@/lib/date.js";

export const metadata = { title: "Notices" };

export default async function NoticesPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const { q, page, pageSize } = listQuery.parse(sp);
    const { audience } = contentListQuery.parse(sp);
    const result = await listNoticesAdmin({ q, audience, page, pageSize });
    const filtered = Boolean(q || audience !== "all");

    return (
        <>
            <PageHeader
                eyebrow="Content"
                title="Notices"
                description="Public notices appear on the website. Everything else is only visible to signed-in students in its audience."
                actions={
                    <Button href="/admin/notices/new">
                        <Plus aria-hidden="true" className="size-4" /> New notice
                    </Button>
                }
            />
            {sp.deleted === "1" && (
                <Alert tone="success" className="mb-6">
                    Notice deleted.
                </Alert>
            )}
            <form
                role="search"
                className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]"
            >
                <label className="relative">
                    <span className="sr-only">Search</span>
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                        name="q"
                        type="search"
                        defaultValue={q}
                        placeholder="Search titles"
                        className={`${inputClass} pl-9`}
                    />
                </label>
                <label>
                    <span className="sr-only">Audience</span>
                    <select name="audience" defaultValue={audience} className={selectClass}>
                        <option value="all">All audiences</option>
                        <option value="public">Public</option>
                        <option value="all_students">All students</option>
                        <option value="class">Classes</option>
                        <option value="batches">Batches</option>
                    </select>
                </label>
                <div className="flex gap-2">
                    <button type="submit" className={buttonClass({ variant: "secondary" })}>
                        Apply
                    </button>
                    {filtered && (
                        <Link href="/admin/notices" className={buttonClass({ variant: "ghost" })}>
                            Clear
                        </Link>
                    )}
                </div>
            </form>

            {result.total === 0 ? (
                <EmptyState
                    icon={Megaphone}
                    title={filtered ? "No notices match" : "No notices yet"}
                    action={
                        !filtered && (
                            <Button href="/admin/notices/new">Write the first notice</Button>
                        )
                    }
                >
                    {filtered
                        ? "Try another search."
                        : "Class changes, holidays, exam dates — post them here and students see them on their phone."}
                </EmptyState>
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Notice</Th>
                                <Th>Audience</Th>
                                <Th>Publish</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((n) => (
                                <tr key={String(n._id)} className="hover:bg-paper/60">
                                    <Td>
                                        <span className="flex items-center gap-2">
                                            {n.isPinned && (
                                                <Pin
                                                    aria-label="Pinned"
                                                    className="size-3.5 shrink-0 text-gold-deep"
                                                />
                                            )}
                                            <Link
                                                href={`/admin/notices/${n._id}`}
                                                className="font-semibold hover:text-burgundy"
                                            >
                                                {n.title}
                                            </Link>
                                            {n.attachment && (
                                                <Paperclip
                                                    aria-label="Has attachment"
                                                    className="size-3.5 shrink-0 text-muted"
                                                />
                                            )}
                                        </span>
                                        {n.emailedAt && (
                                            <span className="block text-xs text-muted">
                                                Emailed {formatDateTime(n.emailedAt)}
                                            </span>
                                        )}
                                    </Td>
                                    <Td className="max-w-56 truncate">{n.audienceText}</Td>
                                    <Td className="whitespace-nowrap text-muted">
                                        {formatDateTime(n.publishAt)}
                                    </Td>
                                    <Td>
                                        <NoticeState state={n.state} />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination
                        page={result.page}
                        pages={result.pages}
                        total={result.total}
                        basePath="/admin/notices"
                        params={{ q, audience: audience === "all" ? undefined : audience }}
                    />
                </>
            )}
        </>
    );
}
