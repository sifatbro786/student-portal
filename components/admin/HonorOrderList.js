"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { FormAlert } from "@/components/ui/FormAlert.js";
import { StatusChip } from "@/components/ui/StatusChip.js";
import { buttonClass } from "@/components/ui/Button.js";
import { cx } from "@/components/ui/cx.js";

/**
 * FR-HON-06 drag-to-reorder (plus ↑/↓ buttons for keyboard and touch users).
 * @param {{ action: Function, entries: Array<{ id: string, name: string, grade: string,
 *   percentage: number, thumbUrl: string | null, isPublished: boolean, consentConfirmed: boolean }> }} props
 */
export function HonorOrderList({ action, entries }) {
    const [items, setItems] = useState(entries);
    const [dragId, setDragId] = useState(null);
    const [state, formAction, pending] = useActionState(action, null);
    const changed = items.some((e, i) => e.id !== entries[i]?.id);

    const move = (from, to) => {
        if (to < 0 || to >= items.length || from === to) return;
        const next = [...items];
        const [x] = next.splice(from, 1);
        next.splice(to, 0, x);
        setItems(next);
    };

    function save() {
        const fd = new FormData();
        fd.set("ids", JSON.stringify(items.map((e) => e.id)));
        startTransition(() => formAction(fd));
    }

    return (
        <div>
            <FormAlert state={state} className="mb-3" />
            <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                {items.map((e, i) => (
                    <li
                        key={e.id}
                        draggable
                        onDragStart={() => setDragId(e.id)}
                        onDragEnd={() => setDragId(null)}
                        onDragOver={(ev) => {
                            ev.preventDefault();
                            const from = items.findIndex((x) => x.id === dragId);
                            if (from !== -1 && from !== i) move(from, i);
                        }}
                        className={cx(
                            "flex items-center gap-3 px-3 py-2.5",
                            dragId === e.id && "bg-burgundy-tint/60",
                        )}
                    >
                        <GripVertical
                            aria-hidden="true"
                            className="size-4 shrink-0 cursor-grab text-muted"
                        />
                        <span className="w-6 text-right text-xs text-muted tabular-nums">
                            {i + 1}
                        </span>
                        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-paper-deep ring-2 ring-burgundy/70">
                            {e.thumbUrl ? (
                                <Image
                                    src={e.thumbUrl}
                                    alt=""
                                    width={40}
                                    height={40}
                                    unoptimized
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-semibold text-muted">
                                    {e.name
                                        .split(" ")
                                        .slice(0, 2)
                                        .map((p) => p[0])
                                        .join("")}
                                </span>
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            <Link
                                href={`/admin/honor-board/${e.id}`}
                                className="block truncate font-semibold hover:text-burgundy"
                            >
                                {e.name}
                            </Link>
                            <span className="text-xs text-muted">
                                {e.grade} · {e.percentage}%
                                {e.thumbUrl && !e.consentConfirmed && (
                                    <span className="font-medium text-danger">
                                        {" "}
                                        · consent missing
                                    </span>
                                )}
                            </span>
                        </span>
                        {e.isPublished ? (
                            <StatusChip tone="success">Public</StatusChip>
                        ) : (
                            <StatusChip>Hidden</StatusChip>
                        )}
                        <span className="flex">
                            <button
                                type="button"
                                onClick={() => move(i, i - 1)}
                                disabled={i === 0}
                                aria-label={`Move ${e.name} up`}
                                className="grid size-9 place-items-center rounded-md text-muted hover:bg-paper-deep hover:text-ink disabled:opacity-30"
                            >
                                <ArrowUp aria-hidden="true" className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => move(i, i + 1)}
                                disabled={i === items.length - 1}
                                aria-label={`Move ${e.name} down`}
                                className="grid size-9 place-items-center rounded-md text-muted hover:bg-paper-deep hover:text-ink disabled:opacity-30"
                            >
                                <ArrowDown aria-hidden="true" className="size-4" />
                            </button>
                        </span>
                    </li>
                ))}
            </ol>
            {changed && (
                <div className="mt-3 flex items-center justify-end gap-3">
                    <span className="text-sm font-medium text-gold-deep">Order changed</span>
                    <button
                        type="button"
                        className={buttonClass({ variant: "secondary", size: "sm" })}
                        onClick={() => setItems(entries)}
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
            )}
        </div>
    );
}
