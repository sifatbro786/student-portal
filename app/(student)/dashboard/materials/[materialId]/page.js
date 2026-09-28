import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getStudentScope } from "@/server/auth/guards.js";
import { getMaterialForStudent } from "@/server/services/materials.js";
import { objectId } from "@/server/validators/common.js";
import { DocumentViewer } from "@/components/student/DocumentViewer.js";
import { formatDate } from "@/lib/date.js";

export const metadata = { title: "Viewer" };

const BACK = {
    note: ["/dashboard/materials", "Notes"],
    question_paper: ["/dashboard/question-papers", "Question papers"],
    routine: ["/dashboard/routine", "Routine"],
    other: ["/dashboard/materials", "Notes"],
};

export default async function MaterialViewerPage({ params }) {
    const scope = await getStudentScope();
    const id = objectId.safeParse((await params).materialId);
    if (!id.success) notFound();
    const m = await getMaterialForStudent(id.data, scope);
    if (!m) notFound(); // other batch, unpublished or missing — same 404 (SEC-10)
    const [href, label] = BACK[m.type];

    return (
        <article>
            <Link
                href={href}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-burgundy"
            >
                <ArrowLeft aria-hidden="true" className="size-4" /> {label}
            </Link>
            <h1 className="text-2xl leading-tight font-medium tracking-tight">{m.title}</h1>
            <p className="mt-1 text-sm text-muted">
                {formatDate(m.createdAt)}
                {m.description ? ` · ${m.description}` : ""}
            </p>
            <p className="mt-3 mb-5 flex items-start gap-2 text-xs leading-relaxed text-muted">
                <ShieldCheck aria-hidden="true" className="mt-px size-4 shrink-0 text-gold-deep" />
                This copy is marked with your name and student ID. Please don’t share it.
            </p>
            <DocumentViewer
                url={`/api/files/material/${m._id}`}
                kind={m.file.mime === "application/pdf" ? "pdf" : "image"}
                title={m.title}
            />
        </article>
    );
}
