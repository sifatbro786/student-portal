"use client";

import { Paperclip } from "lucide-react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Check } from "@/components/ui/Checkbox.js";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { AudiencePicker } from "@/components/admin/AudiencePicker.js";
import { RichTextEditor } from "@/components/admin/RichTextEditor.js";
import { useUpload } from "@/components/admin/useUpload.js";

/** FR-NOT-01. `initial` is plain (see notices/[id]/page.js). */
export function NoticeForm({ options, initial }) {
    const isEdit = !!initial?.id;
    const { state, onSubmit, busy, fe } = useUpload(
        isEdit ? `/api/admin/notices/${initial.id}` : "/api/admin/notices",
        (b) => `/admin/notices/${b.id}?saved=${b.emailed ? `emailed-${b.emailed}` : "1"}`,
    );
    const v = initial ?? {};
    return (
        <form onSubmit={onSubmit} noValidate className="space-y-7">
            {state.status === "error" && <Alert tone="error">{state.error}</Alert>}
            <Field name="title" label="Title" defaultValue={v.title} error={fe.title} required />
            <RichTextEditor name="body" label="Notice" initialHTML={v.body ?? ""} error={fe.body} />

            <div className="space-y-2">
                <span className="block text-sm font-semibold">Attachment (optional)</span>
                {v.attachment && (
                    <div className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-paper/60 px-3 py-2 text-sm">
                        <a
                            href={`/api/files/notice-attachment/${v.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-burgundy hover:underline"
                        >
                            <Paperclip aria-hidden="true" className="size-4" />{" "}
                            {v.attachment.originalName}
                        </a>
                        <Check name="removeAttachment" label="Remove" />
                    </div>
                )}
                <input
                    type="file"
                    name="attachment"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:font-semibold file:text-ink hover:file:border-ink"
                />
                <p className="text-xs text-muted">
                    PDF or image, up to 10 MB.
                    {v.attachment ? " Choosing a file replaces the current one." : ""}
                </p>
                <FieldError id="f-attachment-error" message={fe.attachment} />
            </div>

            <AudiencePicker options={options} allowPublic initial={v} errors={fe} />

            <div className="grid gap-5 sm:grid-cols-2">
                <Field
                    name="publishAt"
                    label="Publish at"
                    type="datetime-local"
                    defaultValue={v.publishAt}
                    hint="Leave empty to publish now. Dhaka time."
                    error={fe.publishAt}
                />
                <Field
                    name="expiresAt"
                    label="Hide after (optional)"
                    type="datetime-local"
                    defaultValue={v.expiresAt}
                    hint="Students stop seeing it after this."
                    error={fe.expiresAt}
                />
            </div>
            <div className="space-y-3">
                <Check name="isPinned" label="Pin to the top" defaultChecked={v.isPinned} />
                <Check
                    name="emailAudience"
                    label="Also email this notice to the students in this audience"
                    hint={`${v.emailedAt ? `Last emailed ${v.emailedAt}. ` : ""}Sent in BCC groups of 50. Gmail allows about 500 recipients a day.`}
                />
            </div>
            <div className="flex justify-end border-t border-line pt-6">
                <button type="submit" disabled={busy} className={buttonClass({ size: "lg" })}>
                    {busy ? "Saving…" : isEdit ? "Save notice" : "Publish notice"}
                </button>
            </div>
        </form>
    );
}
