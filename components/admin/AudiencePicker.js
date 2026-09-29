"use client";

import { useState } from "react";
import { Check } from "@/components/ui/Checkbox.js";
import { FieldError } from "@/components/ui/Field.js";

const LABELS = {
    public: ["Everyone (public)", "Shown on the website and to all students."],
    all_students: ["All students", "Every signed-in student."],
    class: ["Whole classes", "All batches of the classes you pick."],
    batches: ["Specific batches", "Only the batches you pick."],
};

/**
 * Audience + targets (FR-NOT-01 / FR-MAT-01). Uncontrolled inputs with mirrored
 * state so the right target list shows.
 * `kinds` overrides the audience choices (assignments: ["class", "batches"] only — FR-ASG-01).
 * @param {{ options: {id:string,name:string,batches:{id:string,name:string}[]}[], allowPublic?: boolean,
 *   kinds?: string[], initial?: { audience?: string, classes?: string[], batches?: string[] },
 *   errors?: Record<string,string> }} props
 */
export function AudiencePicker({
    options,
    allowPublic = false,
    kinds: only,
    initial = {},
    errors = {},
}) {
    const kinds =
        only ??
        (allowPublic
            ? ["public", "all_students", "class", "batches"]
            : ["all_students", "class", "batches"]);
    const [audience, setAudience] = useState(
        initial.audience ?? (kinds.includes("all_students") ? "all_students" : kinds.at(-1)),
    );
    const cls = new Set(initial.classes ?? []);
    const bat = new Set(initial.batches ?? []);
    return (
        <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Who can see this?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
                {kinds.map((k) => (
                    <label
                        key={k}
                        className="flex cursor-pointer gap-3 rounded-md border border-line bg-surface p-3 has-checked:border-burgundy has-checked:bg-burgundy-tint/50"
                    >
                        <input
                            type="radio"
                            name="audience"
                            value={k}
                            defaultChecked={audience === k}
                            onChange={() => setAudience(k)}
                            className="mt-0.5 size-4 accent-burgundy"
                        />
                        <span className="text-sm leading-snug">
                            <span className="font-semibold">{LABELS[k][0]}</span>
                            <span className="block text-xs text-muted">{LABELS[k][1]}</span>
                        </span>
                    </label>
                ))}
            </div>

            {audience === "class" && (
                <div className="rounded-md border border-line bg-paper/60 p-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {options.map((c) => (
                            <Check
                                key={c.id}
                                name="classes[]"
                                value={c.id}
                                label={c.name}
                                defaultChecked={cls.has(c.id)}
                            />
                        ))}
                    </div>
                    <FieldError id="f-classes-error" message={errors.classes} />
                </div>
            )}
            {audience === "batches" && (
                <div className="space-y-3 rounded-md border border-line bg-paper/60 p-4">
                    {options.map((c) => (
                        <div key={c.id}>
                            <p className="eyebrow text-[0.62rem] text-muted">{c.name}</p>
                            <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-2">
                                {c.batches.length === 0 && (
                                    <span className="text-sm text-muted">No batches</span>
                                )}
                                {c.batches.map((b) => (
                                    <Check
                                        key={b.id}
                                        name="batches[]"
                                        value={b.id}
                                        label={`Batch ${b.name}`}
                                        defaultChecked={bat.has(b.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    <FieldError id="f-batches-error" message={errors.batches} />
                </div>
            )}
            <FieldError id="f-audience-error" message={errors.audience} />
        </fieldset>
    );
}
