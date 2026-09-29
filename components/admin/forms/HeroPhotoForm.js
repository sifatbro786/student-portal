"use client";

import { Alert } from "@/components/ui/Alert.js";
import { FieldError } from "@/components/ui/Field.js";
import { buttonClass } from "@/components/ui/Button.js";
import { useUpload } from "@/components/admin/useUpload.js";

/** Hero portrait upload (≤ 8 MB; stored as a ≤ 1400px WebP, EXIF stripped). */
export function HeroPhotoForm() {
    const { state, onSubmit, busy, fe } = useUpload(
        "/api/admin/site-content/photo",
        () => "/admin/site-content?photo=1",
    );
    return (
        <form onSubmit={onSubmit} noValidate className="space-y-3">
            {state.status === "error" && <Alert tone="error">{state.error}</Alert>}
            <input
                type="file"
                name="photo"
                required
                accept="image/jpeg,image/png,image/webp"
                aria-label="New portrait photo"
                className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:font-semibold file:text-ink hover:file:border-ink"
            />
            <p className="text-xs text-muted">
                A portrait (taller than wide) works best. JPG, PNG or WebP up to 8 MB.
            </p>
            <FieldError id="f-photo-error" message={fe.photo} />
            <button type="submit" disabled={busy} className={buttonClass({ size: "sm" })}>
                {busy ? "Uploading…" : "Upload photo"}
            </button>
        </form>
    );
}
