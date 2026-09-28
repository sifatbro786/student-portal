"use client";

import { FileText } from "lucide-react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { Select } from "@/components/ui/Select.js";
import { Check } from "@/components/ui/Checkbox.js";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { AudiencePicker } from "@/components/admin/AudiencePicker.js";
import { useUpload } from "@/components/admin/useUpload.js";

const TYPES = [
    ["note", "Notes"],
    ["question_paper", "Question paper"],
    ["routine", "Routine"],
    ["other", "Other"],
];

/** FR-MAT-01/02. `initial` is plain. */
export function MaterialForm({ options, initial, defaultType = "note" }) {
    const isEdit = !!initial?.id;
    const { state, onSubmit, busy, fe } = useUpload(
        isEdit ? `/api/admin/materials/${initial.id}` : "/api/admin/materials",
        (b) => `/admin/materials/${b.id}?saved=1`,
    );
    const v = initial ?? { type: defaultType, isPublished: true };
    return (
        <form onSubmit={onSubmit} noValidate className="space-y-7">
            {state.status === "error" && <Alert tone="error">{state.error}</Alert>}
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <Field
                    name="title"
                    label="Title"
                    defaultValue={v.title}
                    error={fe.title}
                    required
                />
                <Select name="type" label="Type" defaultValue={v.type} error={fe.type}>
                    {TYPES.map(([k, l]) => (
                        <option key={k} value={k}>
                            {l}
                        </option>
                    ))}
                </Select>
            </div>
            <Textarea
                name="description"
                label="Description (optional)"
                rows={2}
                defaultValue={v.description}
                error={fe.description}
            />

            <div className="space-y-2">
                <span className="block text-sm font-semibold">File</span>
                {v.file && (
                    <p className="flex items-center gap-2 text-sm">
                        <FileText aria-hidden="true" className="size-4 text-burgundy" />
                        <a
                            className="font-medium text-burgundy hover:underline"
                            href={`/api/files/material/${v.id}?download=1`}
                        >
                            {v.file.originalName}
                        </a>
                        <span className="text-muted">({Math.round(v.file.size / 1024)} KB)</span>
                    </p>
                )}
                <input
                    type="file"
                    name="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    required={!isEdit}
                    className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:font-semibold file:text-ink hover:file:border-ink"
                />
                <p className="text-xs leading-relaxed text-muted">
                    PDF (preferred) or image, up to 25 MB. Word/PowerPoint files aren’t accepted —
                    export them to PDF.
                    {isEdit ? " Choosing a file replaces the current one." : ""}
                </p>
                <FieldError id="f-file-error" message={fe.file} />
            </div>

            <AudiencePicker options={options} initial={v} errors={fe} />

            <Check
                name="isPublished"
                label="Published — students can open it"
                defaultChecked={v.isPublished}
            />

            <Alert tone="info">
                Students read materials in a viewer without download or print buttons, and every
                copy is stamped with their name and student ID. Screenshots can’t be blocked on any
                website — the watermark is what makes a leaked copy traceable.
            </Alert>

            <div className="flex justify-end border-t border-line pt-6">
                <button type="submit" disabled={busy} className={buttonClass({ size: "lg" })}>
                    {busy ? "Uploading…" : isEdit ? "Save" : "Upload"}
                </button>
            </div>
        </form>
    );
}
