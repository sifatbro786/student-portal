"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { buttonClass } from "@/components/ui/Button.js";
import { cx } from "@/components/ui/cx.js";

/**
 * Gallery photos in display order. Drag (mouse) or ←/→ buttons (keyboard, touch), then Save.
 * @param {{ action: Function, photos: Array<{ id: string, thumbUrl: string, width: number,
 *   height: number, caption: string, category: string, isFeatured: boolean,
 *   isPublished: boolean, consentConfirmed: boolean, isPlaceholder: boolean }>,
 *   labels: Record<string, string> }} props
 */
export function GalleryGrid({ action, photos, labels }) {
    const [items, setItems] = useState(photos);
    const [dragId, setDragId] = useState(null);
    const [state, formAction, pending] = useActionState(action, null);
    const changed = items.some((p, i) => p.id !== photos[i]?.id);

    const move = (from, to) => {
        if (to < 0 || to >= items.length || from === to) return;
        const next = [...items];
        const [x] = next.splice(from, 1);
        next.splice(to, 0, x);
        setItems(next);
    };
    function save() {
        const fd = new FormData();
        fd.set("ids", JSON.stringify(items.map((p) => p.id)));
        startTransition(() => formAction(fd));
    }

    return (
        <div>
            <FormAlert state={state} className="mb-3" />
            {changed && (
                <div className="sticky top-16 z-10 mb-4 flex items-center justify-between gap-3 rounded-lg border border-gold/60 bg-surface px-4 py-3 shadow-sm lg:top-4">
                    <span className="text-sm font-medium">The order has changed.</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setItems(photos)}
                            className={buttonClass({ variant: "ghost", size: "sm" })}
                        >
                            Undo
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={pending}
                            className={buttonClass({ size: "sm" })}
                        >
                            {pending ? "Saving…" : "Save order"}
                        </button>
                    </div>
                </div>
            )}
            <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {items.map((p, i) => (
                    <li
                        key={p.id}
                        draggable
                        onDragStart={() => setDragId(p.id)}
                        onDragEnd={() => setDragId(null)}
                        onDragOver={(ev) => {
                            ev.preventDefault();
                            const from = items.findIndex((x) => x.id === dragId);
                            if (from !== -1 && from !== i) move(from, i);
                        }}
                        className={cx(
                            "group overflow-hidden rounded-lg border border-line bg-surface transition-shadow",
                            dragId === p.id && "opacity-60 ring-2 ring-burgundy",
                        )}
                    >
                        <div className="relative aspect-4/3 cursor-grab bg-paper-deep active:cursor-grabbing">
                            <Image
                                src={p.thumbUrl}
                                alt={p.caption || ""}
                                fill
                                sizes="(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 45vw"
                                unoptimized
                                className={cx("object-cover", !p.isPublished && "opacity-50")}
                                draggable={false}
                            />
                            <span className="absolute top-2 left-2 rounded bg-ink/75 px-1.5 py-0.5 text-[0.7rem] font-semibold text-paper tabular-nums">
                                {i + 1}
                            </span>
                        </div>
                        <div className="space-y-2 p-3">
                            <div className="flex flex-wrap gap-1.5">
                                {!p.isPublished && <StatusChip>Hidden</StatusChip>}
                                {p.isFeatured && <StatusChip tone="gold">Homepage</StatusChip>}
                                {p.isPlaceholder && (
                                    <StatusChip tone="danger">Placeholder</StatusChip>
                                )}
                                <StatusChip tone="neutral">{labels[p.category]}</StatusChip>
                            </div>
                            <p className="truncate text-sm text-ink">{p.caption || "—"}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => move(i, i - 1)}
                                        disabled={i === 0}
                                        aria-label={`Move photo ${i + 1} earlier`}
                                        className="grid size-8 place-items-center rounded-md border border-line hover:border-ink disabled:opacity-30"
                                    >
                                        <ArrowLeft aria-hidden="true" className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(i, i + 1)}
                                        disabled={i === items.length - 1}
                                        aria-label={`Move photo ${i + 1} later`}
                                        className="grid size-8 place-items-center rounded-md border border-line hover:border-ink disabled:opacity-30"
                                    >
                                        <ArrowRight aria-hidden="true" className="size-4" />
                                    </button>
                                </div>
                                <Link
                                    href={`/admin/gallery/${p.id}`}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-burgundy hover:underline"
                                >
                                    <Pencil aria-hidden="true" className="size-3.5" /> Edit
                                </Link>
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}
