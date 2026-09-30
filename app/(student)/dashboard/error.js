"use client";

import { ErrorView } from "@/components/ui/ErrorView.js";

export default function StudentError({ error, retry }) {
    return (
        <ErrorView
            title="This page didn’t load."
            digest={error?.digest}
            retry={retry}
            homeHref="/dashboard"
            homeLabel="Back to my dashboard"
        >
            Please try again. If it keeps happening, tell the office and share the reference below.
        </ErrorView>
    );
}
