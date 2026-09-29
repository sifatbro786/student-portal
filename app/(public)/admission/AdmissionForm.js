"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check as CheckIcon } from "lucide-react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Select } from "@/components/ui/Select.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { Check } from "@/components/ui/Checkbox.js";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { scheduleLabel } from "@/lib/format.js";
import { cx } from "@/components/ui/cx.js";

const MAX_PHOTO = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STEPS = ["Student", "Contact", "Parents", "Test score"];

/** Is every required control inside this fieldset filled in? (radios: one checked per name) */
function sectionDone(fs) {
    const controls = [...fs.querySelectorAll("input, select, textarea")];
    const radios = new Set(controls.filter((c) => c.type === "radio").map((c) => c.name));
    for (const name of radios) {
        if (!controls.some((c) => c.name === name && c.checked)) return false;
    }
    return controls
        .filter((c) => c.required && c.type !== "radio")
        .every((c) => (c.type === "file" ? c.files?.length > 0 : c.value.trim() !== ""));
}

function Progress({ done }) {
    const count = done.filter(Boolean).length;
    return (
        <div className="sticky top-18 z-10 -mx-5 border-b border-line bg-surface/95 px-5 py-3 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
            <p className="sr-only" aria-live="polite">
                {count} of {STEPS.length} sections complete
            </p>
            <ol aria-hidden="true" className="flex items-center gap-2 sm:gap-3">
                {STEPS.map((label, i) => (
                    <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                            className={cx(
                                "grid size-6 shrink-0 place-items-center rounded-full border text-[0.7rem] font-bold transition-colors duration-300",
                                done[i]
                                    ? "border-burgundy bg-burgundy text-paper"
                                    : "border-line-strong bg-paper text-muted",
                            )}
                        >
                            {done[i] ? <CheckIcon className="size-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        <span
                            className={cx(
                                "hidden truncate text-xs font-semibold sm:block",
                                done[i] ? "text-ink" : "text-muted",
                            )}
                        >
                            {label}
                        </span>
                        {i < STEPS.length - 1 && (
                            <span
                                className={cx(
                                    "h-px flex-1 transition-colors duration-300",
                                    done[i] ? "bg-burgundy" : "bg-line-strong",
                                )}
                            />
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
}

function Section({ n, title, hint, children }) {
    return (
        <fieldset
            data-step
            className="grid gap-6 border-t border-line pt-8 first-of-type:border-t-0 first-of-type:pt-0 md:grid-cols-[10rem_minmax(0,1fr)]"
        >
            <legend className="contents">
                <span className="block">
                    <span className="font-serif text-3xl text-gold-deep">{n}</span>
                    <span className="mt-1 block font-serif text-xl font-medium">{title}</span>
                    {hint && (
                        <span className="mt-1 block text-sm leading-relaxed text-muted">
                            {hint}
                        </span>
                    )}
                </span>
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

/** FR-ADM-01..07 — posts multipart to /api/admissions (photo upload). */
export function AdmissionForm({ options, formToken }) {
    const [state, setState] = useState({ status: "idle" });
    const [token, setToken] = useState(formToken);
    const [done, setDone] = useState(() => STEPS.map(() => false));
    const formRef = useRef(null);
    const [classId, setClassId] = useState("");
    const [instType, setInstType] = useState("");
    const [preview, setPreview] = useState(null);
    const [photoError, setPhotoError] = useState("");
    const alertRef = useRef(null);
    const doneRef = useRef(null);
    const batches = options.find((c) => c.id === classId)?.batches ?? [];
    const fe = state.fieldErrors ?? {};

    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
    useEffect(() => {
        if (state.status === "error") alertRef.current?.focus();
        if (state.status === "done") doneRef.current?.focus();
    }, [state.status]);

    function updateProgress() {
        const sets = formRef.current?.querySelectorAll("fieldset[data-step]") ?? [];
        const next = [...sets].map(sectionDone);
        setDone((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
    }
    // School name appears/disappears with the radio choice — recount after render.
    useEffect(updateProgress, [instType]);

    function onPhoto(e) {
        const f = e.target.files?.[0];
        setPhotoError("");
        if (!f) return setPreview(null);
        if (!PHOTO_TYPES.includes(f.type)) setPhotoError("Use a JPG, PNG or WebP photo.");
        else if (f.size > MAX_PHOTO) setPhotoError("Photo must be 3 MB or smaller.");
        setPreview(URL.createObjectURL(f));
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (photoError) return;
        setState({ status: "submitting" });
        try {
            const res = await fetch("/api/admissions", {
                method: "POST",
                body: new FormData(e.currentTarget),
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok && body.refNo) setState({ status: "done", refNo: body.refNo });
            else {
                if (body.formToken) setToken(body.formToken); // long-open page: resubmit works
                setState({
                    status: "error",
                    error: body.error,
                    fieldErrors: body.fieldErrors ?? {},
                });
            }
        } catch {
            setState({
                status: "error",
                error: "No connection. Check your internet and try again.",
            });
        }
    }

    if (state.status === "done") {
        return (
            <div
                ref={doneRef}
                tabIndex={-1}
                className="animate-rise text-center outline-none"
                aria-live="polite"
            >
                <p className="eyebrow text-gold-deep">Application received</p>
                <h2 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
                    Thank you. <em className="text-burgundy">We’ll be in touch.</em>
                </h2>
                <div className="mx-auto mt-10 max-w-sm rounded-lg border-2 border-dashed border-gold/70 bg-surface px-6 py-7">
                    <p className="text-sm text-muted">Your reference number</p>
                    <p className="mt-1 font-mono text-3xl font-semibold tracking-wider text-burgundy">
                        {state.refNo}
                    </p>
                    <p className="mt-3 text-xs text-muted">Save it or take a screenshot.</p>
                </div>
                <p className="mx-auto mt-8 max-w-md leading-relaxed text-muted">
                    We’ve emailed you a copy. The office will review your application and contact
                    you on WhatsApp to confirm your batch.
                </p>
                <Link href="/" className={buttonClass({ variant: "secondary", className: "mt-8" })}>
                    Back to the homepage
                </Link>
            </div>
        );
    }

    const busy = state.status === "submitting";
    return (
        <form
            ref={formRef}
            onSubmit={onSubmit}
            onInput={updateProgress}
            onChange={updateProgress}
            noValidate
            className="space-y-10"
            aria-labelledby="adm-form-title"
            aria-describedby="adm-intro"
        >
            <header>
                <p className="eyebrow text-gold-deep">Online application</p>
                <h2
                    id="adm-form-title"
                    className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl"
                >
                    Admission form
                </h2>
                <p id="adm-intro" className="mt-2 text-muted">
                    All fields are required unless marked optional. It takes about five minutes.
                </p>
            </header>
            <Progress done={done} />

            {state.status === "error" && (
                <div ref={alertRef} tabIndex={-1} className="outline-none">
                    <Alert tone="error">
                        {state.error ?? "Something went wrong. Please try again."}
                    </Alert>
                </div>
            )}

            <input type="hidden" name="formToken" value={token} />
            {/* Honeypot — hidden from people and screen readers */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                    Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
            </div>

            <Section n="01" title="Student" hint="As it should appear on your records.">
                <div className="flex items-center gap-5 sm:col-span-2">
                    <label
                        htmlFor="f-photo"
                        className="group relative grid size-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-[3px] border-burgundy bg-paper-deep ring-4 ring-paper outline-offset-4 focus-within:outline-2 focus-within:outline-burgundy"
                    >
                        {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                            <img
                                src={preview}
                                alt="Selected photo preview"
                                className="size-full object-cover"
                            />
                        ) : (
                            <Camera
                                aria-hidden="true"
                                className="size-7 text-burgundy/70 transition-transform group-hover:scale-110"
                            />
                        )}
                        <input
                            id="f-photo"
                            name="photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                            onChange={onPhoto}
                            aria-describedby="f-photo-hint f-photo-error"
                            aria-invalid={photoError || fe.photo ? true : undefined}
                            className="sr-only"
                        />
                    </label>
                    <div>
                        <p className="font-semibold">Student photo</p>
                        <p id="f-photo-hint" className="mt-1 text-sm text-muted">
                            A clear, recent face photo. JPG, PNG or WebP, up to 3 MB.
                        </p>
                        <label
                            htmlFor="f-photo"
                            className="mt-2 inline-block cursor-pointer text-sm font-semibold text-burgundy underline decoration-gold underline-offset-4"
                        >
                            {preview ? "Change photo" : "Choose photo"}
                        </label>
                        <FieldError id="f-photo-error" message={photoError || fe.photo} />
                    </div>
                </div>
                <Field
                    name="fullName"
                    label="Full name"
                    autoComplete="name"
                    error={fe.fullName}
                    required
                    className="sm:col-span-2"
                />
                <Select
                    name="class"
                    label="Class"
                    defaultValue=""
                    onChange={(e) => setClassId(e.target.value)}
                    error={fe.class}
                    required
                >
                    <option value="" disabled>
                        Choose a class…
                    </option>
                    {options.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select>
                <Select
                    name="preferredBatch"
                    label="Preferred batch (optional)"
                    key={classId}
                    defaultValue=""
                    disabled={!classId || batches.length === 0}
                    error={fe.preferredBatch}
                >
                    <option value="">{classId ? "No preference" : "Choose a class first"}</option>
                    {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                            Batch {b.name} — {scheduleLabel(b.schedule)}
                        </option>
                    ))}
                </Select>
                <fieldset
                    className="sm:col-span-2"
                    aria-describedby={fe.institutionType ? "f-inst-error" : undefined}
                >
                    <legend className="text-sm font-semibold">Studies at</legend>
                    <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
                        <Check
                            type="radio"
                            name="institutionType"
                            value="school"
                            label="A school"
                            onChange={() => setInstType("school")}
                        />
                        <Check
                            type="radio"
                            name="institutionType"
                            value="private"
                            label="Private candidate"
                            onChange={() => setInstType("private")}
                        />
                    </div>
                    <FieldError id="f-inst-error" message={fe.institutionType} />
                </fieldset>
                {instType === "school" && (
                    <Field
                        name="institutionName"
                        label="School name"
                        error={fe.institutionName}
                        required
                        className="sm:col-span-2"
                    />
                )}
            </Section>

            <Section n="02" title="Contact" hint="We’ll confirm your batch here.">
                <Field
                    name="whatsapp"
                    label="WhatsApp number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    error={fe.whatsapp}
                    required
                />
                <Field
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    hint="Your reference number is sent here."
                    error={fe.email}
                    required
                />
                <Textarea
                    name="address"
                    label="Address"
                    rows={2}
                    autoComplete="street-address"
                    error={fe.address}
                    required
                    className="sm:col-span-2"
                />
            </Section>

            <Section n="03" title="Parents" hint="For attendance and result updates.">
                <Field name="fatherName" label="Father’s name" error={fe.fatherName} required />
                <Field
                    name="fatherPhone"
                    label="Father’s phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    error={fe.fatherPhone}
                    required
                />
                <Field name="motherName" label="Mother’s name" error={fe.motherName} required />
                <Field
                    name="motherPhone"
                    label="Mother’s phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    error={fe.motherPhone}
                    required
                />
            </Section>

            <Section n="04" title="Admission test" hint="The score you received at the campus.">
                <Field
                    name="score"
                    label="Your score (%)"
                    inputMode="decimal"
                    placeholder="e.g. 78.5"
                    hint="Between 0 and 100. The office will verify it."
                    error={fe.score}
                    required
                />
            </Section>

            <div className="space-y-6 border-t border-line pt-8 md:pl-[calc(10rem+1.5rem)]">
                <div>
                    <Check name="consent" label="I confirm the information above is correct." />
                    <FieldError id="f-consent-error" message={fe.consent} />
                </div>
                <button
                    type="submit"
                    disabled={busy}
                    className={buttonClass({ size: "lg", className: "w-full sm:w-auto sm:px-10" })}
                >
                    {busy ? (
                        <>
                            <span
                                aria-hidden="true"
                                className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                            />
                            Sending…
                        </>
                    ) : (
                        "Submit application"
                    )}
                </button>
            </div>
        </form>
    );
}
