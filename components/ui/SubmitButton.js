"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "./Button.js";

/** Submit button that disables itself while its form's action is pending. */
export function SubmitButton({ children, pendingLabel, variant, size, className, ...props }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            aria-disabled={pending}
            className={buttonClass({ variant, size, className })}
            {...props}
        >
            {pending ? (
                <>
                    <span
                        aria-hidden="true"
                        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                    />
                    {pendingLabel ?? children}
                </>
            ) : (
                children
            )}
        </button>
    );
}
