"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Field, FieldError, inputClass } from "@/components/ui/Field.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { Select } from "@/components/ui/Select.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { RichTextEditor } from "@/components/admin/RichTextEditor.js";
import { cx } from "@/components/ui/cx.js";

/** One titled block of the long CMS form. */
function Section({ id, title, description, children }) {
    return (
        <section id={id} className="scroll-mt-24 rounded-lg border border-line bg-surface">
            <header className="border-b border-line px-5 py-4">
                <h2 className="text-lg font-medium">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </header>
            <div className="space-y-5 px-5 py-5">{children}</div>
        </section>
    );
}

/**
 * Repeatable rows (education, campuses, …) with add / remove / move.
 * `fields`: [{ key, label, wide?, textarea?, placeholder?, options? }]
 */
function ListEditor({ name, items, onChange, fields, blank, max, addLabel, errors }) {
    const set = (i, key, value) =>
        onChange(items.map((row, j) => (j === i ? { ...row, [key]: value } : row)));
    const move = (i, d) => {
        const next = [...items];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        onChange(next);
    };
    return (
        <div className="space-y-3">
            <FieldError id={`f-${name}-error`} message={errors[name]} />
            {items.map((row, i) => (
                <div
                    key={i}
                    className="grid gap-3 rounded-md border border-line bg-paper/50 p-3 sm:grid-cols-[1fr_auto]"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        {fields.map((f) => {
                            const key = `${name}.${i}.${f.key}`;
                            const common = {
                                name: key,
                                label: f.label,
                                value: row[f.key] ?? "",
                                error: errors[key],
                                placeholder: f.placeholder,
                                onChange: (e) => set(i, f.key, e.target.value),
                            };
                            if (f.options)
                                return (
                                    <Select
                                        key={key}
                                        {...common}
                                        className={f.wide && "sm:col-span-2"}
                                    >
                                        {f.options.map(([v, l]) => (
                                            <option key={v} value={v}>
                                                {l}
                                            </option>
                                        ))}
                                    </Select>
                                );
                            return f.textarea ? (
                                <Textarea
                                    key={key}
                                    rows={2}
                                    {...common}
                                    className="sm:col-span-2"
                                />
                            ) : (
                                <Field
                                    key={key}
                                    {...common}
                                    className={f.wide && "sm:col-span-2"}
                                />
                            );
                        })}
                    </div>
                    <div className="flex gap-1 sm:flex-col">
                        <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp className="size-4" />
                        </IconBtn>
                        <IconBtn
                            label="Move down"
                            disabled={i === items.length - 1}
                            onClick={() => move(i, 1)}
                        >
                            <ArrowDown className="size-4" />
                        </IconBtn>
                        <IconBtn
                            label="Remove"
                            danger
                            onClick={() => onChange(items.filter((_, j) => j !== i))}
                        >
                            <Trash2 className="size-4" />
                        </IconBtn>
                    </div>
                </div>
            ))}
            {items.length < max && (
                <button
                    type="button"
                    onClick={() => onChange([...items, { ...blank }])}
                    className={buttonClass({ variant: "secondary", size: "sm" })}
                >
                    <Plus aria-hidden="true" className="size-4" /> {addLabel}
                </button>
            )}
        </div>
    );
}

function IconBtn({ label, danger, children, ...props }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cx(
                "grid size-9 place-items-center rounded-md border border-line bg-surface disabled:opacity-30",
                danger ? "hover:border-danger hover:text-danger" : "hover:border-ink",
            )}
            {...props}
        >
            <span aria-hidden="true">{children}</span>
        </button>
    );
}

const SOCIALS = [
    ["facebook", "Facebook"],
    ["youtube", "YouTube"],
    ["instagram", "Instagram"],
    ["linkedin", "LinkedIn"],
];

/**
 * FR-CMS-01 editor. Controlled state → one JSON payload (so nested lists keep their
 * order and React never resets the form). The bio comes from the rich text editor's
 * hidden input. `initial` is plain JSON.
 */
export function SiteContentForm({ action, initial }) {
    const [c, setC] = useState(initial);
    const [state, formAction, pending] = useActionState(action, null);
    const formRef = useRef(null);
    const fe = state?.fieldErrors ?? {};
    const up = (patch) => setC((prev) => ({ ...prev, ...patch }));
    const upIn = (group, patch) =>
        setC((prev) => ({ ...prev, [group]: { ...prev[group], ...patch } }));
    const text = (group, key, label, extra = {}) => {
        const path = group ? `${group}.${key}` : key;
        const value = group ? c[group][key] : c[key];
        const onChange = (e) =>
            group ? upIn(group, { [key]: e.target.value }) : up({ [key]: e.target.value });
        return extra.textarea ? (
            <Textarea
                name={path}
                label={label}
                value={value ?? ""}
                onChange={onChange}
                error={fe[path]}
                rows={extra.rows ?? 3}
                hint={extra.hint}
            />
        ) : (
            <Field
                name={path}
                label={label}
                value={value ?? ""}
                onChange={onChange}
                error={fe[path]}
                hint={extra.hint}
                placeholder={extra.placeholder}
                inputMode={extra.inputMode}
            />
        );
    };

    function onSubmit(e) {
        e.preventDefault();
        const about = String(new FormData(formRef.current).get("about") ?? "");
        const payload = { ...c, about };
        const fd = new FormData();
        fd.set("payload", JSON.stringify(payload));
        startTransition(() => formAction(fd));
    }

    return (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
            <FormAlert state={state} />

            <Section id="identity" title="Name & title">
                <div className="grid gap-5 sm:grid-cols-2">
                    {text(null, "name", "Name")}
                    {text(null, "jobTitle", "Title")}
                </div>
                {text(null, "boards", "Exam boards", {
                    hint: "Shown under the hero and in search results.",
                })}
            </Section>

            <Section
                id="hero"
                title="Hero (top of the homepage)"
                description="The italic phrase is printed in the serif accent right after the headline."
            >
                {text("hero", "eyebrow", "Small label above the headline")}
                <div className="grid gap-5 sm:grid-cols-2">
                    {text("hero", "headline", "Headline")}
                    {text("hero", "accent", "Italic phrase")}
                </div>
                {text("hero", "tagline", "Short intro", { textarea: true })}
                {text("hero", "note", "Handwritten note on the photo (optional)", {
                    hint: "e.g. “Seats open — enrol today!” Leave empty to hide it.",
                })}
            </Section>

            <Section
                id="highlights"
                title="Why learn with me (numbered 01–04)"
                description="Short points. Up to 6."
            >
                <ListEditor
                    name="highlights"
                    items={c.highlights}
                    onChange={(highlights) => up({ highlights })}
                    fields={[
                        { key: "title", label: "Title", wide: true },
                        { key: "body", label: "Text", textarea: true },
                    ]}
                    blank={{ title: "", body: "" }}
                    max={6}
                    addLabel="Add a point"
                    errors={fe}
                />
            </Section>

            <Section id="stats" title="Facts" description="Plain numbers, no animation. Up to 4.">
                <ListEditor
                    name="stats"
                    items={c.stats}
                    onChange={(stats) => up({ stats })}
                    fields={[
                        { key: "value", label: "Number", placeholder: "17+" },
                        { key: "label", label: "Label", placeholder: "Years teaching" },
                    ]}
                    blank={{ value: "", label: "" }}
                    max={4}
                    addLabel="Add a fact"
                    errors={fe}
                />
            </Section>

            <Section id="about" title="About / bio">
                <RichTextEditor
                    name="about"
                    label="Bio"
                    initialHTML={initial.about}
                    error={fe.about}
                />
            </Section>

            <Section id="education" title="Education">
                <ListEditor
                    name="education"
                    items={c.education}
                    onChange={(education) => up({ education })}
                    fields={[
                        { key: "degree", label: "Degree", wide: true },
                        { key: "institution", label: "Institution" },
                        { key: "year", label: "Year", placeholder: "2008" },
                    ]}
                    blank={{ degree: "", institution: "", year: "" }}
                    max={10}
                    addLabel="Add a degree"
                    errors={fe}
                />
            </Section>

            <Section
                id="experience"
                title="Teaching experience"
                description="Newest first. Leave “To” empty for a current role."
            >
                <ListEditor
                    name="experience"
                    items={c.experience}
                    onChange={(experience) => up({ experience })}
                    fields={[
                        { key: "institution", label: "Institution" },
                        { key: "role", label: "Role" },
                        { key: "from", label: "From", placeholder: "2012" },
                        { key: "to", label: "To", placeholder: "2019 (empty = present)" },
                    ]}
                    blank={{ institution: "", role: "", from: "", to: "" }}
                    max={15}
                    addLabel="Add a role"
                    errors={fe}
                />
            </Section>

            <Section
                id="faculties"
                title="“Taught at” strip"
                description="Names scrolling under the hero."
            >
                <FieldError id="f-faculties-error" message={fe.faculties} />
                <ul className="space-y-2">
                    {c.faculties.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <input
                                aria-label={`Institution ${i + 1}`}
                                aria-invalid={fe[`faculties.${i}`] ? true : undefined}
                                className={inputClass}
                                value={f}
                                onChange={(e) =>
                                    up({
                                        faculties: c.faculties.map((x, j) =>
                                            j === i ? e.target.value : x,
                                        ),
                                    })
                                }
                            />
                            <IconBtn
                                label="Remove"
                                danger
                                onClick={() =>
                                    up({ faculties: c.faculties.filter((_, j) => j !== i) })
                                }
                            >
                                <Trash2 className="size-4" />
                            </IconBtn>
                        </li>
                    ))}
                </ul>
                {c.faculties.length < 12 && (
                    <button
                        type="button"
                        onClick={() => up({ faculties: [...c.faculties, ""] })}
                        className={buttonClass({ variant: "secondary", size: "sm" })}
                    >
                        <Plus aria-hidden="true" className="size-4" /> Add a name
                    </button>
                )}
            </Section>

            <Section
                id="campuses"
                title="Campuses"
                description='Map: in Google Maps choose Share → Embed a map and paste the link inside src="…".'
            >
                <ListEditor
                    name="campuses"
                    items={c.campuses}
                    onChange={(campuses) => up({ campuses })}
                    fields={[
                        { key: "name", label: "Campus name" },
                        { key: "schedule", label: "Schedule", placeholder: "Fri & Sat — mornings" },
                        { key: "address", label: "Address", wide: true },
                        { key: "mapUrl", label: "Google Maps embed link", wide: true },
                    ]}
                    blank={{ name: "", address: "", schedule: "", mapUrl: "" }}
                    max={4}
                    addLabel="Add a campus"
                    errors={fe}
                />
            </Section>

            <Section id="contact" title="Contact">
                <div className="grid gap-5 sm:grid-cols-3">
                    {text("contact", "phone", "Phone", { inputMode: "tel" })}
                    {text("contact", "whatsapp", "WhatsApp", { inputMode: "tel" })}
                    {text("contact", "email", "Email")}
                </div>
                <ListEditor
                    name="socials"
                    items={c.socials}
                    onChange={(socials) => up({ socials })}
                    fields={[
                        { key: "platform", label: "Platform", options: SOCIALS },
                        { key: "url", label: "Link", placeholder: "https://facebook.com/…" },
                    ]}
                    blank={{ platform: "facebook", url: "" }}
                    max={6}
                    addLabel="Add a social link"
                    errors={fe}
                />
            </Section>

            <Section id="class-info" title="Class information">
                {text(null, "classInfo", "Shown in the “Classes” section", {
                    textarea: true,
                    rows: 4,
                })}
            </Section>

            <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 sm:mx-0 sm:rounded-lg sm:border">
                {state?.error && (
                    <span className="mr-auto text-sm font-medium text-danger">{state.error}</span>
                )}
                <button type="submit" disabled={pending} className={buttonClass({ size: "lg" })}>
                    {pending ? "Saving…" : "Save website content"}
                </button>
            </div>
        </form>
    );
}
