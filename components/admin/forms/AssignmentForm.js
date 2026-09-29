"use client";

import { Paperclip } from "lucide-react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { Check } from "@/components/ui/Checkbox.js";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { AudiencePicker } from "@/components/admin/AudiencePicker.js";
import { RichTextEditor } from "@/components/admin/RichTextEditor.js";
import { useUpload } from "@/components/admin/useUpload.js";
import {
    ASSIGNMENT_TYPE_LABELS,
    SUBMISSION_FILE_LABELS,
    SUBMISSION_FILE_TYPES,
} from "@/lib/constants.js";

const fileInputClass =
    "block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:font-semibold file:text-ink hover:file:border-ink";

/** FR-ASG-01. `initial` is plain (see assignments/[assignmentId]/edit/page.js). */
export function AssignmentForm({ options, initial }) {
    const isEdit = !!initial?.id;
    const { state, onSubmit, busy, fe } = useUpload(
        isEdit ? `/api/admin/assignments/${initial.id}` : "/api/admin/assignments",
        (b) => `/admin/assignments/${b.id}?saved=1`,
    );
    const v = initial ?? {
        type: "homework",
        audience: "batches",
        maxFiles: 5,
        maxFileSizeMB: 20,
        allowedTypes: [...SUBMISSION_FILE_TYPES],
        isPublished: true,
    };
    const allowed = new Set(v.allowedTypes);

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-8">
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
                    {Object.entries(ASSIGNMENT_TYPE_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>
                            {l}
                        </option>
                    ))}
                </Select>
            </div>

            <RichTextEditor
                name="instructions"
                label="Instructions"
                initialHTML={v.instructions ?? ""}
                error={fe.instructions}
            />

            <div className="space-y-2">
                <span className="block text-sm font-semibold">Attachment (optional)</span>
                {v.attachment && (
                    <div className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-paper/60 px-3 py-2 text-sm">
                        <a
                            href={`/api/files/assignment-attachment/${v.id}`}
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
                    className={fileInputClass}
                />
                <p className="text-xs text-muted">
                    A worksheet or question sheet — PDF or image, up to 20 MB.
                    {v.attachment ? " Choosing a file replaces the current one." : ""}
                </p>
                <FieldError id="f-attachment-error" message={fe.attachment} />
            </div>

            <AudiencePicker
                options={options}
                kinds={["class", "batches"]}
                initial={v}
                errors={fe}
            />
            {isEdit && (
                <p className="-mt-4 text-xs text-muted">
                    Changing who it’s for never deletes work that was already submitted.
                </p>
            )}

            <fieldset className="space-y-4 rounded-lg border border-line bg-paper/50 p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold">Deadline</legend>
                <Field
                    name="deadline"
                    label="Submit by"
                    type="datetime-local"
                    defaultValue={v.deadline}
                    hint="Dhaka time. The server clock decides — a student’s phone clock doesn’t matter."
                    error={fe.deadline}
                    required
                    className="max-w-xs"
                />
                <Check
                    name="allowLate"
                    label="Accept late submissions"
                    hint="After the deadline, work is still accepted but marked Late. Off = the upload closes at the deadline."
                    defaultChecked={v.allowLate}
                />
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-sm font-semibold">What students can upload</legend>
                <div className="grid max-w-md gap-5 sm:grid-cols-2">
                    <Field
                        name="maxFiles"
                        label="Max files"
                        type="number"
                        min={1}
                        max={10}
                        inputMode="numeric"
                        defaultValue={v.maxFiles}
                        error={fe.maxFiles}
                    />
                    <Field
                        name="maxFileSizeMB"
                        label="Max size per file (MB)"
                        type="number"
                        min={1}
                        max={20}
                        inputMode="numeric"
                        defaultValue={v.maxFileSizeMB}
                        error={fe.maxFileSizeMB}
                    />
                </div>
                <div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2.5">
                        {SUBMISSION_FILE_TYPES.map((t) => (
                            <Check
                                key={t}
                                name="allowedTypes[]"
                                value={t}
                                label={SUBMISSION_FILE_LABELS[t]}
                                defaultChecked={allowed.has(t)}
                            />
                        ))}
                    </div>
                    <FieldError id="f-allowedTypes-error" message={fe.allowedTypes} />
                </div>
            </fieldset>

            <Check
                name="isPublished"
                label="Published — students in this audience can see it"
                defaultChecked={v.isPublished}
            />

            <div className="flex justify-end border-t border-line pt-6">
                <button type="submit" disabled={busy} className={buttonClass({ size: "lg" })}>
                    {busy ? "Saving…" : isEdit ? "Save changes" : "Create assignment"}
                </button>
            </div>
        </form>
    );
}
