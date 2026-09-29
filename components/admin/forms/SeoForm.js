"use client";

import { startTransition, useActionState, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Field } from "@/components/ui/Field.js";
import { Textarea } from "@/components/ui/Textarea.js";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { cx } from "@/components/ui/cx.js";

// Google shows roughly 50–60 title characters and 150–160 description characters.
const LIMITS = { title: [30, 60], description: [110, 160] };

const splitKeywords = (s) =>
    s
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter(Boolean);

function Counter({ value, kind }) {
    const [min, max] = LIMITS[kind];
    const n = value.length;
    const tone =
        n === 0
            ? "text-muted"
            : n > max
              ? "text-danger"
              : n < min
                ? "text-gold-deep"
                : "text-success";
    const note =
        n === 0
            ? "uses the default"
            : n > max
              ? "too long — Google cuts it"
              : n < min
                ? "a bit short"
                : "good length";
    return (
        <span className={cx("text-xs font-medium tabular-nums", tone)}>
            {n}/{max} · {note}
        </span>
    );
}

/** Google-style result preview (approximation: Google may rewrite either line). */
function SnippetPreview({ origin, path, title, description, fallbackTitle }) {
    let host = origin;
    try {
        host = new URL(origin).host;
    } catch {}
    const crumbs = [host, ...path.split("/").filter(Boolean)].join(" › ");
    return (
        <div className="rounded-md border border-line bg-white p-4 font-sans" aria-hidden="true">
            <p className="truncate text-xs text-[#4d5156]">{crumbs}</p>
            <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">
                {title || fallbackTitle}
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#4d5156]">
                {description || "Google will pick text from the page."}
            </p>
        </div>
    );
}

/**
 * Admin → SEO. Controlled state → one JSON payload (React never resets it on errors).
 * Keywords are typed comma-separated and sent as arrays.
 */
export function SeoForm({ action, initial, recommended, pages, origin }) {
    const [v, setV] = useState(initial);
    const [state, formAction, pending] = useActionState(action, null);
    const fe = state?.fieldErrors ?? {};
    const setPage = (key, patch) =>
        setV((p) => ({ ...p, pages: { ...p.pages, [key]: { ...p.pages[key], ...patch } } }));

    function onSubmit(e) {
        e.preventDefault();
        const payload = {
            keywords: splitKeywords(v.keywords),
            googleVerification: v.googleVerification,
            bingVerification: v.bingVerification,
            pages: Object.fromEntries(
                Object.entries(v.pages).map(([k, p]) => [
                    k,
                    {
                        title: p.title,
                        description: p.description,
                        keywords: splitKeywords(p.keywords),
                    },
                ]),
            ),
        };
        const fd = new FormData();
        fd.set("payload", JSON.stringify(payload));
        startTransition(() => formAction(fd));
    }

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-6">
            <FormAlert state={state} />

            <section className="rounded-lg border border-line bg-surface">
                <header className="border-b border-line px-5 py-4">
                    <h2 className="text-lg font-medium">Whole website</h2>
                    <p className="mt-0.5 text-sm text-muted">
                        Keywords added to every public page, and the ownership codes for Google
                        Search Console and Bing Webmaster Tools.
                    </p>
                </header>
                <div className="space-y-5 px-5 py-5">
                    <Textarea
                        name="keywords"
                        label="Site keywords"
                        rows={2}
                        value={v.keywords}
                        onChange={(e) => setV({ ...v, keywords: e.target.value })}
                        error={fe.keywords}
                        hint="Separate with commas. Up to 20. Real search phrases work best, e.g. “O Level English teacher in Dhaka”."
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            name="googleVerification"
                            label="Google Search Console code (optional)"
                            value={v.googleVerification}
                            onChange={(e) => setV({ ...v, googleVerification: e.target.value })}
                            error={fe.googleVerification}
                            hint="Search Console → Add property → HTML tag. You can paste the whole tag."
                        />
                        <Field
                            name="bingVerification"
                            label="Bing Webmaster code (optional)"
                            value={v.bingVerification}
                            onChange={(e) => setV({ ...v, bingVerification: e.target.value })}
                            error={fe.bingVerification}
                            hint="Bing → Add site → HTML meta tag. You can paste the whole tag."
                        />
                    </div>
                </div>
            </section>

            {pages.map(({ key, label, path }) => {
                const p = v.pages[key];
                const base = `pages.${key}`;
                return (
                    <section
                        key={key}
                        id={key}
                        className="scroll-mt-24 rounded-lg border border-line bg-surface"
                    >
                        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                            <div>
                                <h2 className="text-lg font-medium">{label}</h2>
                                <p className="mt-0.5 font-mono text-xs text-muted">{path}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPage(key, recommended.pages[key])}
                                className={buttonClass({ variant: "ghost", size: "sm" })}
                            >
                                <RotateCcw aria-hidden="true" className="size-4" /> Use recommended
                            </button>
                        </header>
                        <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
                            <div className="space-y-5">
                                <div>
                                    <Field
                                        name={`${base}.title`}
                                        label="Page title"
                                        value={p.title}
                                        maxLength={70}
                                        onChange={(e) => setPage(key, { title: e.target.value })}
                                        error={fe[`${base}.title`]}
                                    />
                                    <Counter value={p.title} kind="title" />
                                </div>
                                <div>
                                    <Textarea
                                        name={`${base}.description`}
                                        label="Meta description"
                                        rows={3}
                                        maxLength={170}
                                        value={p.description}
                                        onChange={(e) =>
                                            setPage(key, { description: e.target.value })
                                        }
                                        error={fe[`${base}.description`]}
                                    />
                                    <Counter value={p.description} kind="description" />
                                </div>
                                <Textarea
                                    name={`${base}.keywords`}
                                    label="Page keywords"
                                    rows={2}
                                    value={p.keywords}
                                    onChange={(e) => setPage(key, { keywords: e.target.value })}
                                    error={fe[`${base}.keywords`]}
                                    hint="Separate with commas. Up to 15. Added to the site keywords."
                                />
                            </div>
                            <div>
                                <p className="eyebrow mb-2 text-[0.62rem] text-muted">
                                    Google preview
                                </p>
                                <SnippetPreview
                                    origin={origin}
                                    path={path}
                                    title={p.title}
                                    description={p.description}
                                    fallbackTitle={`${label} · (default title)`}
                                />
                            </div>
                        </div>
                    </section>
                );
            })}

            <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-paper/95 px-4 py-3 sm:mx-0 sm:rounded-lg sm:border">
                {state?.error && (
                    <span className="mr-auto text-sm font-medium text-danger">{state.error}</span>
                )}
                <button type="submit" disabled={pending} className={buttonClass({ size: "lg" })}>
                    {pending ? "Saving…" : "Save SEO settings"}
                </button>
            </div>
        </form>
    );
}
