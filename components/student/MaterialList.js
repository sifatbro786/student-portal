import Link from "next/link";
import { ChevronRight, FileImage, FileText } from "lucide-react";
import { formatDate } from "@/lib/date.js";

export function MaterialList({ rows }) {
    return (
        <ul className="grid gap-3">
            {rows.map((m) => {
                const Icon = m.file?.mime === "application/pdf" ? FileText : FileImage;
                return (
                    <li key={String(m._id)}>
                        <Link
                            href={`/dashboard/materials/${m._id}`}
                            className="group flex items-center gap-4 rounded-lg border border-line bg-surface p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold"
                        >
                            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-burgundy-tint text-burgundy">
                                <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold group-hover:text-burgundy">
                                    {m.title}
                                </span>
                                <span className="block truncate text-xs text-muted">
                                    {formatDate(m.createdAt)}
                                    {m.description ? ` · ${m.description}` : ""}
                                </span>
                            </span>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-5 shrink-0 text-muted"
                            />
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
