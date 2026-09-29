"use client";

import { useActionState } from "react";
import { Star } from "lucide-react";
import { Field } from "@/components/ui/Field.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { Check } from "@/components/ui/Checkbox.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { buttonClass } from "@/components/ui/Button.js";
import { initials } from "@/lib/format.js";

const STATUS = {
    pending: { tone: "gold", label: "Pending" },
    approved: { tone: "success", label: "On the website" },
    rejected: { tone: "danger", label: "Not approved" },
};

export function Stars({ value, className = "size-4" }) {
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    aria-hidden="true"
                    strokeWidth={1.6}
                    className={`${className} ${n <= value ? "fill-badge text-gold-deep" : "text-line-strong"}`}
                />
            ))}
        </span>
    );
}

/**
 * One review in the moderation queue. The admin may fix typos, the name and the result
 * line, then approve / reject / send back. Submit buttons carry `decision`.
 * @param {{ review: { id: string, name: string, studentId: string | null, resultLine: string,
 *   quote: string, rating: number, hasPhoto: boolean, status: string, statusNote: string,
 *   isPinned: boolean, submittedAt: string }, submittedLabel: string, action: Function }} props
 */
export function ReviewModeration({ review: r, submittedLabel, action }) {
    const [state, formAction, pending] = useActionState(action, null);
    const v = state?.values ?? r;
    const fe = state?.fieldErrors ?? {};
    const st = STATUS[r.status];
    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="version" value={r.submittedAt} />
            <input type="hidden" name="tab" value={r.status} />
            <div className="flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-paper-deep ring-2 ring-gold/60">
                    {r.hasPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked route
                        <img
                            src={`/api/files/testimonial-photo/${r.id}?v=${encodeURIComponent(r.submittedAt)}`}
                            alt={`Photo sent by ${r.name}`}
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="font-serif text-lg text-muted">{initials(r.name)}</span>
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusChip tone={st.tone}>{st.label}</StatusChip>
                        {r.isPinned && <StatusChip tone="ink">Pinned</StatusChip>}
                        <Stars value={r.rating} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                        {r.studentId ? <span className="font-mono">{r.studentId}</span> : "—"} ·
                        sent {submittedLabel}
                    </p>
                </div>
            </div>

            <FormAlert state={state} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Field name="name" label="Name shown" defaultValue={v.name} error={fe.name} />
                <Field
                    name="resultLine"
                    label="Result line"
                    placeholder="A* · O Level 2026"
                    defaultValue={v.resultLine}
                    error={fe.resultLine}
                />
            </div>
            <Textarea
                name="quote"
                label="Review text"
                rows={5}
                maxLength={600}
                defaultValue={v.quote}
                error={fe.quote}
                hint="Fix typos only — don’t change what the student meant."
            />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field
                    name="statusNote"
                    label="Note to the student (if not approved)"
                    defaultValue={v.statusNote}
                    error={fe.statusNote}
                />
                <Check
                    name="isPinned"
                    label="Pin to the top"
                    defaultChecked={!!r.isPinned}
                    className="pb-3"
                />
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                {r.status !== "pending" && (
                    <button
                        type="submit"
                        name="decision"
                        value="pending"
                        disabled={pending}
                        className={buttonClass({ variant: "ghost", size: "sm" })}
                    >
                        Back to pending
                    </button>
                )}
                <button
                    type="submit"
                    name="decision"
                    value="reject"
                    disabled={pending}
                    className={buttonClass({ variant: "secondary", size: "sm" })}
                >
                    Don’t approve
                </button>
                <button
                    type="submit"
                    name="decision"
                    value="approve"
                    disabled={pending}
                    className={buttonClass({ size: "sm" })}
                >
                    {r.status === "approved" ? "Save changes" : "Approve & publish"}
                </button>
            </div>
        </form>
    );
}
