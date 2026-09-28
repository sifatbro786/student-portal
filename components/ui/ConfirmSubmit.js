"use client";

import { useRef } from "react";
import { buttonClass } from "./Button.js";

/**
 * A button that opens a native <dialog> and only submits its parent <form>
 * after confirmation. Native dialog = focus trap + Esc for free.
 */
export function ConfirmSubmit({
    children,
    title,
    body,
    confirmLabel = "Confirm",
    variant = "secondary",
    danger = false,
    size = "md",
    className,
}) {
    const ref = useRef(null);
    return (
        <>
            <button
                type="button"
                className={buttonClass({ variant, size, className })}
                onClick={() => ref.current?.showModal()}
            >
                {children}
            </button>
            <dialog
                ref={ref}
                className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-ink shadow-[0_30px_80px_-30px_rgb(31_26_23/0.5)] backdrop:bg-ink/40"
            >
                <div className="p-6">
                    <h2 className="text-xl font-medium">{title}</h2>
                    {body && <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>}
                </div>
                <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-6 py-4">
                    <button
                        type="button"
                        className={buttonClass({ variant: "secondary", size: "sm" })}
                        onClick={() => ref.current?.close()}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={buttonClass({
                            variant: danger ? "danger" : "primary",
                            size: "sm",
                        })}
                        onClick={() => ref.current?.close()}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </dialog>
        </>
    );
}
