import Link from "next/link";
import { BookOpen, Plus, Search } from "lucide-react";
import { requireAuth } from "@/server/auth/guards.js";
import { MATERIAL_TYPE_LABELS, listMaterialsAdmin } from "@/server/services/materials.js";
import { listQuery } from "@/server/validators/common.js";
import { contentListQuery } from "@/server/validators/content.js";
import { PageHeader } from "@/components/ui/PageHeader.js";
import { Button, buttonClass } from "@/components/ui/Button.js";
import { inputClass } from "@/components/ui/Field.js";
import { Table, Th, Td } from "@/components/ui/Table.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { EmptyState } from "@/components/ui/EmptyState.js";
import { Pagination } from "@/components/ui/Pagination.js";
import { Alert } from "@/components/ui/Alert.js";
import { cx } from "@/components/ui/cx.js";
import { formatDate } from "@/lib/date.js";

export const metadata = { title: "Materials" };

export default async function MaterialsPage({ searchParams }) {
    await requireAuth(["super_admin", "admin"]);
    const sp = await searchParams;
    const { q, page, pageSize } = listQuery.parse(sp);
    const { type } = contentListQuery.parse(sp);
    const result = await listMaterialsAdmin({ type, q, page, pageSize });
    const label = MATERIAL_TYPE_LABELS[type];

    return (
        <>
            <PageHeader
                eyebrow="Content"
                title="Materials"
                description="Notes, question papers and routines. Students only see published files for their own class or batch."
                actions={
                    <Button href={`/admin/materials/new?type=${type}`}>
                        <Plus aria-hidden="true" className="size-4" /> Upload
                    </Button>
                }
            />
            {sp.deleted === "1" && (
                <Alert tone="success" className="mb-6">
                    File deleted.
                </Alert>
            )}

            {/* Index-tab style type switcher */}
            <nav
                aria-label="Material type"
                className="mb-5 flex gap-1 overflow-x-auto border-b border-line"
            >
                {Object.entries(MATERIAL_TYPE_LABELS).map(([k, l]) => (
                    <Link
                        key={k}
                        href={`/admin/materials?type=${k}`}
                        aria-current={k === type ? "page" : undefined}
                        className={cx(
                            "-mb-px shrink-0 rounded-t-md border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors",
                            k === type
                                ? "border-line bg-surface text-burgundy"
                                : "border-transparent text-muted hover:text-ink",
                        )}
                    >
                        {l}
                    </Link>
                ))}
            </nav>

            <form role="search" className="mb-5 flex gap-2">
                <input type="hidden" name="type" value={type} />
                <label className="relative flex-1">
                    <span className="sr-only">Search</span>
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                        name="q"
                        type="search"
                        defaultValue={q}
                        placeholder={`Search ${label.toLowerCase()}`}
                        className={`${inputClass} pl-9`}
                    />
                </label>
                <button type="submit" className={buttonClass({ variant: "secondary" })}>
                    Search
                </button>
            </form>

            {result.total === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title={q ? "Nothing matches" : `No ${label.toLowerCase()} yet`}
                    action={
                        !q && (
                            <Button href={`/admin/materials/new?type=${type}`}>
                                Upload a file
                            </Button>
                        )
                    }
                >
                    {q
                        ? "Try another search."
                        : "Upload a PDF and choose which classes or batches can open it."}
                </EmptyState>
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Title</Th>
                                <Th>Audience</Th>
                                <Th>File</Th>
                                <Th>Added</Th>
                                <Th>Status</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((m) => (
                                <tr key={String(m._id)} className="hover:bg-paper/60">
                                    <Td>
                                        <Link
                                            href={`/admin/materials/${m._id}`}
                                            className="font-semibold hover:text-burgundy"
                                        >
                                            {m.title}
                                        </Link>
                                    </Td>
                                    <Td className="max-w-56 truncate">{m.audienceText}</Td>
                                    <Td className="text-muted">
                                        {m.file.mime === "application/pdf" ? "PDF" : "Image"} ·{" "}
                                        {Math.max(1, Math.round(m.file.size / 1024))} KB
                                    </Td>
                                    <Td className="whitespace-nowrap text-muted">
                                        {formatDate(m.createdAt)}
                                    </Td>
                                    <Td>
                                        {m.isPublished ? (
                                            <StatusChip tone="success">Published</StatusChip>
                                        ) : (
                                            <StatusChip>Hidden</StatusChip>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Pagination
                        page={result.page}
                        pages={result.pages}
                        total={result.total}
                        basePath="/admin/materials"
                        params={{ q, type }}
                    />
                </>
            )}
        </>
    );
}
