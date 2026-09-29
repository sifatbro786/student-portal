"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { Check } from "@/components/ui/Checkbox.js";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { cx } from "@/components/ui/cx.js";

const MAX_FILES = 12;
const MAX_EACH = 10 * 1024 * 1024;
const MAX_TOTAL = 60 * 1024 * 1024; // server caps the request at 64 MB

/**
 * Multi-photo upload for the gallery (drop zone + previews). Posts to the admin
 * Route Handler; each photo is processed separately and failures are listed by name.
 * @param {{ categories: [string, string][] }} props
 */
export function GalleryUpload({ categories }) {
    const router = useRouter();
    const inputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [drag, setDrag] = useState(false);
    const [state, setState] = useState({ status: "idle" });
    const busy = state.status === "busy";

    function addFiles(list) {
        const incoming = [...list].filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
        const next = [...files, ...incoming.map((f) => ({ f, url: URL.createObjectURL(f) }))];
        setFiles(next.slice(0, MAX_FILES));
        setState(
            next.length > MAX_FILES
                ? { status: "error", error: `At most ${MAX_FILES} photos per upload.` }
                : { status: "idle" },
        );
    }
    function remove(i) {
        URL.revokeObjectURL(files[i].url);
        setFiles(files.filter((_, j) => j !== i));
    }

    const tooBig = files.filter((x) => x.f.size > MAX_EACH);
    const total = files.reduce((n, x) => n + x.f.size, 0);

    async function onSubmit(e) {
        e.preventDefault();
        if (!files.length) return setState({ status: "error", error: "Choose some photos first." });
        if (tooBig.length || total > MAX_TOTAL) return;
        const fd = new FormData(e.currentTarget);
        fd.delete("photos");
        for (const x of files) fd.append("photos", x.f, x.f.name);
        setState({ status: "busy" });
        try {
            const res = await fetch("/api/admin/gallery", { method: "POST", body: fd });
            const body = await res.json().catch(() => ({}));
            if (res.ok && body.ok) {
                files.forEach((x) => URL.revokeObjectURL(x.url));
                setFiles([]);
                setState({ status: "done", added: body.added, failed: body.failed ?? [] });
                router.refresh();
            } else {
                setState({
                    status: "error",
                    error: body.error ?? "Upload failed.",
                    fieldErrors: body.fieldErrors ?? {},
                });
            }
        } catch {
            setState({ status: "error", error: "No connection. Please try again." });
        }
    }

    const fe = state.fieldErrors ?? {};
    return (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
            {state.status === "error" && <Alert tone="error">{state.error}</Alert>}
            {state.status === "done" && (
                <Alert tone={state.failed.length ? "info" : "success"}>
                    {state.added} photo{state.added === 1 ? "" : "s"} added.
                    {state.failed.length > 0 && (
                        <ul className="mt-1 list-disc pl-5">
                            {state.failed.map((x) => (
                                <li key={x.name}>
                                    {x.name}: {x.error}
                                </li>
                            ))}
                        </ul>
                    )}
                </Alert>
            )}

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    addFiles(e.dataTransfer.files);
                }}
                className={cx(
                    "rounded-lg border-2 border-dashed p-5 transition-colors",
                    drag ? "border-burgundy bg-burgundy-tint/40" : "border-line-strong bg-paper/50",
                )}
            >
                {files.length === 0 ? (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex w-full flex-col items-center gap-2 py-6 text-center"
                    >
                        <ImageUp aria-hidden="true" className="size-8 text-burgundy" />
                        <span className="font-semibold">Drop photos here or click to choose</span>
                        <span className="text-xs text-muted">
                            JPG, PNG or WebP · up to {MAX_FILES} at a time · 10 MB each. Location
                            data (EXIF/GPS) is removed.
                        </span>
                    </button>
                ) : (
                    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                        {files.map((x, i) => (
                            <li key={x.url} className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview */}
                                <img
                                    src={x.url}
                                    alt=""
                                    className={cx(
                                        "aspect-square w-full rounded-md object-cover",
                                        x.f.size > MAX_EACH && "opacity-40 ring-2 ring-danger",
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => remove(i)}
                                    aria-label={`Remove ${x.f.name}`}
                                    className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full border border-line bg-surface shadow-sm hover:text-danger"
                                >
                                    <X aria-hidden="true" className="size-4" />
                                </button>
                            </li>
                        ))}
                        {files.length < MAX_FILES && (
                            <li>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="grid aspect-square w-full place-items-center rounded-md border border-dashed border-line-strong text-sm font-semibold text-muted hover:border-ink hover:text-ink"
                                >
                                    + Add
                                </button>
                            </li>
                        )}
                    </ul>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    name="photos"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(e) => {
                        addFiles(e.currentTarget.files ?? []);
                        e.currentTarget.value = "";
                    }}
                />
            </div>
            {tooBig.length > 0 && (
                <FieldError
                    id="f-photos-size"
                    message={`${tooBig.length} photo(s) are over 10 MB — remove them or resize first.`}
                />
            )}
            {total > MAX_TOTAL && (
                <FieldError
                    id="f-photos-total"
                    message="That’s more than 60 MB in one go — upload in two batches."
                />
            )}
            <FieldError id="f-photos-error" message={fe.photos} />

            <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
                <Select
                    name="category"
                    label="Category"
                    defaultValue="classroom"
                    error={fe.category}
                >
                    {categories.map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </Select>
                <Field
                    name="caption"
                    label="Caption (optional, applies to all)"
                    maxLength={160}
                    error={fe.caption}
                />
            </div>
            <div className="space-y-3 rounded-lg border border-gold/50 bg-gold-light/15 p-4">
                <Check
                    name="consentConfirmed"
                    label="Cleared for public display"
                    hint="If students can be recognised, guardian consent has been obtained."
                />
                <FieldError id="f-consentConfirmed-error" message={fe.consentConfirmed} />
                <Check name="isPublished" label="Publish on the website now" defaultChecked />
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={busy || !files.length}
                    className={buttonClass({ size: "lg" })}
                >
                    {busy
                        ? "Uploading…"
                        : `Upload ${files.length || ""} photo${files.length === 1 ? "" : "s"}`}
                </button>
            </div>
        </form>
    );
}
