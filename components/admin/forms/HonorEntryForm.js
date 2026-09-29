"use client";

import Image from "next/image";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { Check } from "@/components/ui/Checkbox.js";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { useUpload } from "@/components/admin/useUpload.js";
import { GRADES } from "@/lib/constants.js";

/** FR-HON-01/04/05. `initial` is plain. Photo is cropped to a square on the server. */
export function HonorEntryForm({ initial, defaultYear }) {
    const isEdit = !!initial?.id;
    const { state, onSubmit, busy, fe } = useUpload(
        isEdit ? `/api/admin/honor/${initial.id}` : "/api/admin/honor",
        (b) => `/admin/honor-board?year=${b.year}&saved=1`,
    );
    const v = initial ?? { year: defaultYear, grade: "A*", isPublished: true };
    return (
        <form onSubmit={onSubmit} noValidate className="space-y-6">
            {state.status === "error" && <Alert tone="error">{state.error}</Alert>}
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <Field
                    name="name"
                    label="Name (as printed)"
                    defaultValue={v.name}
                    error={fe.name}
                    required
                />
                <Field
                    name="year"
                    label="Year"
                    type="number"
                    min={2000}
                    max={2100}
                    inputMode="numeric"
                    defaultValue={v.year}
                    error={fe.year}
                    required
                />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
                <Select name="grade" label="Grade" defaultValue={v.grade} error={fe.grade}>
                    {GRADES.map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </Select>
                <Field
                    name="percentage"
                    label="Percentage mark"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={v.percentage}
                    error={fe.percentage}
                    required
                />
                <Field
                    name="school"
                    label="School (optional)"
                    defaultValue={v.school}
                    error={fe.school}
                />
            </div>

            <div className="space-y-2">
                <span className="block text-sm font-semibold">Photo</span>
                {v.thumbUrl && (
                    <div className="flex items-center gap-4 rounded-md border border-line bg-paper/60 p-3">
                        <Image
                            src={v.thumbUrl}
                            alt=""
                            width={64}
                            height={64}
                            unoptimized
                            className="size-16 rounded-full object-cover ring-2 ring-burgundy"
                        />
                        <Check name="removePhoto" label="Remove photo" />
                    </div>
                )}
                <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:font-semibold file:text-ink hover:file:border-ink"
                />
                <p className="text-xs text-muted">
                    JPG, PNG or WebP up to 5 MB. Cropped to a square around the face. Without a
                    photo the board shows a neutral placeholder.
                </p>
                <FieldError id="f-photo-error" message={fe.photo} />
            </div>

            <div className="space-y-3 rounded-lg border border-gold/50 bg-gold-light/15 p-4">
                <Check
                    name="consentConfirmed"
                    label="Guardian consent obtained for public display"
                    hint="Required before a real photo can appear on the public website."
                    defaultChecked={v.consentConfirmed}
                />
                <FieldError id="f-consentConfirmed-error" message={fe.consentConfirmed} />
                <Check
                    name="isPublished"
                    label="Show on the public Honor Board"
                    defaultChecked={v.isPublished}
                />
            </div>

            <div className="flex justify-end border-t border-line pt-5">
                <button type="submit" disabled={busy} className={buttonClass({ size: "lg" })}>
                    {busy ? "Saving…" : isEdit ? "Save entry" : "Add to the board"}
                </button>
            </div>
        </form>
    );
}
