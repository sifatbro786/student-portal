"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Submit a multipart form to an admin Route Handler (uploads are too big for
 * Server Actions) and navigate on success.
 * @param {string} url
 * @param {(body: any) => string} redirectTo
 */
export function useUpload(url, redirectTo) {
    const router = useRouter();
    const [state, setState] = useState({ status: "idle" });
    async function onSubmit(e) {
        e.preventDefault();
        setState({ status: "busy" });
        try {
            const res = await fetch(url, { method: "POST", body: new FormData(e.currentTarget) });
            const body = await res.json().catch(() => ({}));
            if (res.ok && body.ok) {
                setState({ status: "done", body });
                router.push(redirectTo(body));
                router.refresh();
            } else {
                setState({
                    status: "error",
                    error: body.error ?? "Something went wrong.",
                    fieldErrors: body.fieldErrors ?? {},
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } catch {
            setState({
                status: "error",
                error: "No connection. Please try again.",
                fieldErrors: {},
            });
        }
    }
    return {
        state,
        onSubmit,
        busy: state.status === "busy" || state.status === "done",
        fe: state.fieldErrors ?? {},
    };
}
