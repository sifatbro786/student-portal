"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Field, FieldError } from "@/components/ui/Field.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { Check } from "@/components/ui/Checkbox.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { cx } from "@/components/ui/cx.js";

const MAX_PHOTO = 1024 * 1024; // client rule: 1 MB (the server checks again)
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Star rating as a real radio group (keyboard: arrows; screen readers: "4 stars, Very good"). */
function StarRating({ defaultValue, error }) {
    const [value, setValue] = useState(Number(defaultValue) || 0);
    const [hover, setHover] = useState(0);
    const shown = hover || value;
    return (
        <fieldset aria-describedby={error ? "f-rating-error" : undefined}>
            <legend className="text-sm font-semibold text-ink">Your rating</legend>
            <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <label
                        key={n}
                        onMouseEnter={() => setHover(n)}
                        className="group relative grid size-11 cursor-pointer place-items-center rounded-md has-focus-visible:outline-2 has-focus-visible:outline-burgundy"
                    >
                        <input
                            type="radio"
                            name="rating"
                            value={n}
                            defaultChecked={value === n}
                            onChange={() => setValue(n)}
                            className="sr-only"
                        />
                        <Star
                            aria-hidden="true"
                            strokeWidth={1.6}
                            className={cx(
                                "size-7 transition-[color,fill,transform] duration-200 group-active:scale-90",
                                n <= shown ? "fill-badge text-gold-deep" : "text-line-strong",
                            )}
                        />
                        <span className="sr-only">
                            {n} {n === 1 ? "star" : "stars"}, {LABELS[n]}
                        </span>
                    </label>
                ))}
                <span className="ml-2 text-sm font-medium text-muted" aria-hidden="true">
                    {LABELS[shown]}
                </span>
            </div>
            <FieldError id="f-rating-error" message={error} />
        </fieldset>
    );
}

/**
 * Student review form (P8). Uncontrolled inputs; values come back from the action on error.
 * @param {{ action: Function, initial: null | { quote: string, rating: number, resultLine: string,
 *   hasPhoto: boolean, photoUrl: string | null }, name: string }} props
 */
export function ReviewForm({ action, initial }) {
    const [state, formAction] = useActionState(action, null);
    const [count, setCount] = useState(initial?.quote?.length ?? 0);
    const [preview, setPreview] = useState(null);
    const [photoError, setPhotoError] = useState(null);
    const v = state?.values ?? initial ?? {};
    const fe = state?.fieldErrors ?? {};

    function onPhoto(e) {
        const f = e.currentTarget.files?.[0];
        setPhotoError(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (!f) return;
        if (f.size > MAX_PHOTO) {
            setPhotoError(
                `This photo is ${(f.size / 1048576).toFixed(1)} MB. Please choose one of 1 MB or less.`,
            );
            e.currentTarget.value = "";
            return;
        }
        setPreview(URL.createObjectURL(f));
    }

    const currentPhoto = preview ?? (initial?.hasPhoto ? initial.photoUrl : null);

    return (
        <form action={formAction} className="space-y-6" noValidate>
            <FormAlert state={state} />
            <StarRating defaultValue={v.rating} error={fe.rating} />

            <div>
                <Textarea
                    name="quote"
                    label="Your review"
                    rows={6}
                    maxLength={600}
                    defaultValue={v.quote}
                    error={fe.quote}
                    onChange={(e) => setCount(e.currentTarget.value.length)}
                    hint="What changed for you in these classes? A few honest sentences are best."
                    required
                />
                <p
                    className={cx(
                        "mt-1 text-right text-xs tabular-nums",
                        count > 560 ? "text-danger" : "text-muted",
                    )}
                    aria-live="polite"
                >
                    {count}/600
                </p>
            </div>

            <Field
                name="resultLine"
                label="Result or class (optional)"
                placeholder="e.g. A* · O Level 2026"
                maxLength={60}
                defaultValue={v.resultLine}
                error={fe.resultLine}
                hint="Shown under your name. The office may correct it."
            />

            <div className="space-y-2">
                <span className="block text-sm font-semibold" id="photo-label">
                    Your photo (optional)
                </span>
                <div className="flex items-center gap-4">
                    <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-paper-deep ring-2 ring-gold/60">
                        {currentPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element -- blob: preview
                            <img src={currentPhoto} alt="" className="size-full object-cover" />
                        ) : (
                            <span className="font-serif text-lg text-muted" aria-hidden="true">
                                ?
                            </span>
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <input
                            type="file"
                            name="photo"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={onPhoto}
                            aria-labelledby="photo-label"
                            aria-describedby="photo-hint"
                            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-2 file:font-semibold file:text-ink hover:file:border-ink"
                        />
                        <p id="photo-hint" className="mt-1 text-xs text-muted">
                            JPG, PNG or WebP · <strong>max 1 MB</strong>. Without a photo we show
                            your initials.
                        </p>
                    </div>
                </div>
                {initial?.hasPhoto && !preview && (
                    <Check name="removePhoto" label="Remove my photo" className="pt-1" />
                )}
                <FieldError id="f-photo-error" message={photoError ?? fe.photo} />
            </div>

            <div className="rounded-lg border border-gold/50 bg-gold-light/15 p-4">
                <Check
                    name="consent"
                    label="Tauhid Sir may show this review, my name and photo on his website."
                    hint="You can edit or delete it any time from this page."
                    defaultChecked={v.consent === true || v.consent === "on" || !!initial}
                />
                <FieldError id="f-consent-error" message={fe.consent} />
            </div>

            <div className="flex justify-end border-t border-line pt-5">
                <SubmitButton size="lg" pendingLabel="Sending…">
                    {initial ? "Update my review" : "Send for approval"}
                </SubmitButton>
            </div>
        </form>
    );
}
