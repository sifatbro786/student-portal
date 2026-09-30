"use client";

import { ErrorView } from "@/components/ui/ErrorView.js";

export default function AdminError({ error, retry }) {
    return (
        <ErrorView
            title="This screen hit an error."
            digest={error?.digest}
            retry={retry}
            homeHref="/admin"
            homeLabel="Back to dashboard"
        >
            Nothing was lost — try again. If it repeats, send the reference below to the developer.
        </ErrorView>
    );
}
