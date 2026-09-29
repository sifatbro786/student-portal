"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { FieldError, inputClass } from "@/components/ui/Field.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { SubmitButton } from "@/components/ui/SubmitButton.js";
import { buttonClass } from "@/components/ui/Button.js";

/**
 * FR-ASG-06: feedback + marks for one submission, in a native <dialog>
 * (focus trap + Esc for free). `action` is reviewSubmissionAction bound to ids.
 * @param {{ action: Function, studentName: string, feedback: string, marks: number | null,
 *   reviewed: boolean, files: { href: string, name: string }[] }} props
 */
export function ReviewDialog({ action, studentName, feedback, marks, reviewed, files }) {
    const ref = useRef(null);
    const uid = useId(); // many dialogs on one page → ids must be unique
    const [state, formAction] = useActionState(action, null);
    const values = state?.values ?? {};
    const fe = state?.fieldErrors ?? {};

    useEffect(() => {
        if (state?.ok) ref.current?.close();
    }, [state]);

    return (
        <>
            <button
                type="button"
                className={buttonClass({ variant: reviewed ? "ghost" : "secondary", size: "sm" })}
                onClick={() => ref.current?.showModal()}
            >
                <MessageSquareText aria-hidden="true" className="size-4" />
                {reviewed ? "Edit" : "Review"}
            </button>
            <dialog
                ref={ref}
                aria-label={`Review — ${studentName}`}
                className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-left text-ink shadow-[0_30px_80px_-30px_rgb(31_26_23/0.5)] backdrop:bg-ink/40"
            >
                <form action={formAction} noValidate>
                    <div className="space-y-5 p-6">
                        <div>
                            <p className="eyebrow text-gold-deep">Review</p>
                            <h2 className="mt-1 text-xl font-medium">{studentName}</h2>
                        </div>
                        {files.length > 0 && (
                            <ul className="space-y-1 text-sm">
                                {files.map((f) => (
                                    <li key={f.href} className="truncate">
                                        <a
                                            href={f.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-burgundy hover:underline"
                                        >
                                            {f.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <FormAlert state={state?.ok ? null : state} />
                        <div className="space-y-1.5">
                            <label htmlFor={`${uid}-fb`} className="block text-sm font-semibold">
                                Feedback{" "}
                                <span className="font-normal text-muted">
                                    (the student sees this)
                                </span>
                            </label>
                            <textarea
                                id={`${uid}-fb`}
                                name="feedback"
                                rows={4}
                                maxLength={2000}
                                defaultValue={values.feedback ?? feedback}
                                aria-invalid={fe.feedback ? true : undefined}
                                aria-describedby={fe.feedback ? `${uid}-fb-err` : undefined}
                                className={`${inputClass} h-auto py-2.5`}
                            />
                            <FieldError id={`${uid}-fb-err`} message={fe.feedback} />
                        </div>
                        <div className="max-w-40 space-y-1.5">
                            <label htmlFor={`${uid}-mk`} className="block text-sm font-semibold">
                                Marks <span className="font-normal text-muted">(optional)</span>
                            </label>
                            <input
                                id={`${uid}-mk`}
                                name="marks"
                                type="number"
                                min={0}
                                step="0.01"
                                inputMode="decimal"
                                defaultValue={values.marks ?? marks ?? ""}
                                aria-invalid={fe.marks ? true : undefined}
                                aria-describedby={fe.marks ? `${uid}-mk-err` : undefined}
                                className={inputClass}
                            />
                            <FieldError id={`${uid}-mk-err`} message={fe.marks} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-6 py-4">
                        <button
                            type="button"
                            className={buttonClass({ variant: "secondary", size: "sm" })}
                            onClick={() => ref.current?.close()}
                        >
                            Cancel
                        </button>
                        <SubmitButton size="sm" pendingLabel="Saving…">
                            Save review
                        </SubmitButton>
                    </div>
                </form>
            </dialog>
        </>
    );
}
