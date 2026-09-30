"use client";

import { ErrorView } from "@/components/ui/ErrorView.js";

export default function PublicError({ error, retry }) {
    return (
        <section className="px-4 sm:px-6">
            <ErrorView title="This page didn’t load." digest={error?.digest} retry={retry}>
                Please try again in a moment. If it keeps happening, call or WhatsApp the office.
            </ErrorView>
        </section>
    );
}
